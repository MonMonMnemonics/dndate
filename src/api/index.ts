import { Hono } from "hono";
import { cors } from "hono/cors";
import { db } from "../lib/database";
import { poll, user, auxInfo, attendance, userInfo } from "../lib/schema";
import { and, asc, desc, eq, inArray, lt, notInArray } from "drizzle-orm";
import moment from "moment";
import type { UserData } from "@/common/types";
import { createMiddleware } from "hono/factory";
import { auxInfoEnum } from "@/common/consts";

const API = new Hono<{
    Variables: {
        pollData: AuthPollData,
        userData: AuthUserData
    },
}>();
const tempToken: {[key: string]: number} = {};

//-------------------------- HELPERS --------------------------
function convertToInfoVal(code: string, val: string):any {
    switch (code) {
        case (auxInfoEnum.firstTimer): {
            if (val.toUpperCase() == "TRUE") {
                return true;
            } else if (val.toUpperCase() == "FALSE") { 
                return false;
            }
            break;
        }

        case (auxInfoEnum.helpCharCreate): {
            if (val.toUpperCase() == "TRUE") {
                return true;
            } else if (val.toUpperCase() == "FALSE") { 
                return false;
            }
            break;
        }
    
        default: {
            return val;
        }                        
    }
}

function convertFromInfoVal(code: string, val: any): string {
    switch (code) {
        case (auxInfoEnum.firstTimer): {
            if (val === true) {
                return("TRUE");
            } else {
                return("FALSE");
            }
        }

        case (auxInfoEnum.helpCharCreate): {
            if (val === true) {
                return("TRUE");
            } else {
                return("FALSE");
            }
        }

        default: {
            return(val.toString());
        }
    }
}

//-------------------------- MIDDLEWARE --------------------------
type AuthPollData = {
    id: number,
    title: string,
    description: string,
    dateStart: string,
    dateEnd: string,
    timezone: string,
    open: boolean
};

type AuthUserData = {
    id: number,
    name: string,
    host: boolean
};

const checkAuth = createMiddleware(async (ctx, next) => {
    const reqData = await ctx.req.json();

    let pollData: any = await db.select({
            id: poll.id,
            title: poll.title,
            description: poll.description,
            dateStart: poll.dateStart,
            dateEnd: poll.dateEnd,
            timezone: poll.timezone,
            open: poll.open
        })
        .from(poll)
        .where(eq(poll.token, reqData.token))
        .limit(1);
    if (pollData.length < 1) {
        ctx.status(404)
        return ctx.text("POLL NOT FOUND");
    }

    let userData: any = await db.select({
            id: user.id,
            name: user.name,
            host: user.host
        })
        .from(user)
        .where(eq(user.id, reqData.userData.id))
        .limit(1);
    if (userData.length < 1) {
        ctx.status(404)
        return ctx.text("USER NOT FOUND");
    }

    if (reqData.userData.auth == "OTT") {
        if (!((reqData.token + reqData.userData.key) in tempToken)) {
            ctx.status(401)
            return ctx.text("USER NOT AUTHORIZED");
        }
        delete tempToken[reqData.token + reqData.userData.key];
    } else {
        const pass = Bun.SHA512.hash(Bun.env.APP_ID + reqData.userData.key, "hex");
        let userData: any = await db.select().from(user).where(and(eq(user.id, reqData.userData.id), eq(user.pass, pass))).limit(1);
        if (userData.length < 1) {
            ctx.status(401);
            return ctx.text("USER NOT AUTHORIZED");
        }
    }

    ctx.set("pollData", pollData[0]);
    ctx.set("userData", userData[0]);

    await next();
})

//-------------------------- ROUTING --------------------------
API.use('/*', cors({
    origin: (process.env.NODE_ENV !== "production") ? "*" : "*3mworkshop.org"
}));

API.post('poll/create', async (ctx) => {
    const reqData = await ctx.req.json();
    const token = Bun.SHA256.hash(Bun.env.APP_ID + moment().toISOString() + reqData.title, "hex");
    const pass = Bun.SHA512.hash(Bun.env.APP_ID + reqData.pass, "hex");
    const creationDate = moment();

    const newPoll = await db.insert(poll).values({
        token: token,
        title: reqData.title,
        description: reqData.desc,
        timeCreated: (new Date()).getTime()/1000,
        dateStart: reqData.dateStart,
        dateEnd: reqData.dateEnd,
        timezone: reqData.timezone,
    }).returning({ id: poll.id});

    await db.insert(user).values({
        pollId: newPoll[0]?.id,
        name: reqData.name,
        pass: pass,
        host: true,        
    });

    if ((reqData.opts ?? []).length > 0) {
        await db.insert(auxInfo).values((reqData.opts).map((opt: string) => ({
            pollId: newPoll[0]?.id,
            code: opt,
            type: (opt == auxInfoEnum.firstTimer) ? "BOOL" : "TEXT",
            title: opt,
            description: ""
        })))
    }

    const ott = Bun.SHA256.hash(Bun.env.APP_ID + moment().toISOString() + token, "hex");
    tempToken[token + ott] = moment().add(1, "h").valueOf();
    return ctx.json({
        ott: ott,
        token: token
    });
})

API.post("poll/login", async (ctx) => {
    const reqData = await ctx.req.json();
    const pass = Bun.SHA512.hash(Bun.env.APP_ID + reqData.pass, "hex");

    let userData: any = await db.select({
            id: user.id,
            host: user.host,
            pollId: user.pollId
        })
        .from(user)
        .leftJoin(poll, eq(user.pollId, poll.id))
        .where(and(
            eq(user.id, reqData.userId),
            eq(user.pass, pass),
            eq(poll.token, reqData.token)
        ))
        .limit(1);

    if (userData.length < 1) {
        ctx.status(400)
        return ctx.text("USER NOT FOUND");
    }

    let privateAuxInfoList: {[index: string]: {[index:string]: string}} = {};
    if (userData[0].host ?? false) {
        const auxInfos = await db.select({
                userId: userInfo.userId,
                code: auxInfo.code,
                val: userInfo.val
            })
            .from(userInfo)
            .leftJoin(auxInfo, eq(userInfo.infoId, auxInfo.id))
            .where(eq(auxInfo.pollId, userData[0].pollId))
        
        for (const infoDt of auxInfos) {
            const userId = (infoDt.userId ?? -1).toString();
            if (!(userId in privateAuxInfoList)) {
                privateAuxInfoList[userId] = {};
            }

            //@ts-expect-error
            privateAuxInfoList[userId][infoDt.code] = convertToInfoVal(infoDt.code, infoDt.val);
        }
    } else {
        const auxInfos = await db.select({
                userId: userInfo.userId,
                code: auxInfo.code,
                val: userInfo.val
            })
            .from(userInfo)
            .leftJoin(auxInfo, eq(userInfo.infoId, auxInfo.id))
            .where(eq(userInfo.userId, userData[0].id));

        for (const infoDt of auxInfos) {
            const userId = (infoDt.userId ?? -1).toString();
            if (!(userId in privateAuxInfoList)) {
                privateAuxInfoList[userId] = {};
            }

            //@ts-expect-error
            privateAuxInfoList[userId][infoDt.code] = convertToInfoVal(infoDt.code, infoDt.val);
        }
    }

    return ctx.json(privateAuxInfoList);
});

API.post("poll/create-user", async (ctx) => {
    const reqData = await ctx.req.json();
    const pass = Bun.SHA512.hash(Bun.env.APP_ID + reqData.pass, "hex");

    let pollData : any = await db.select({
            id: poll.id,
            open: poll.open
        })
        .from(poll)
        .where(eq(poll.token, reqData.token))
        .limit(1);
    
    if (pollData.length < 1) {
        ctx.status(418);
        return ctx.text('AM A TEAPOT XD');
    }

    if (!pollData[0].open) {
        ctx.status(418);
        return ctx.text('AM A TEAPOT XD');
    }

    const newUser = await db.insert(user).values({
        pollId: pollData[0].id,
        name: reqData.name,
        pass: pass
    }).returning({ id: user.id});

    const infoMapData = await db.select({ id:auxInfo.id, code:auxInfo.code }).from(auxInfo).where(eq(auxInfo.pollId, pollData[0].id));
    let infoMap : {[index:string]: number} = {};
    for (const dt of infoMapData) {
        if (dt.code) {
            infoMap[dt.code] = dt.id;
        }        
    }

    let newInfoData: {userId: number, infoId: number, val:string}[] = [];
    for (const code in (reqData.auxInfo ?? {})) {
        if (code in infoMap) {
            const val = convertFromInfoVal(code, reqData.auxInfo[code] ?? null);
            if (val != "") {
                newInfoData.push({
                    //@ts-expect-error
                    userId: newUser[0]?.id,
                    //@ts-expect-error
                    infoId: infoMap[code],
                    val: val
                });
            }
        }
    }

    if (newInfoData.length > 0) {
        await db.insert(userInfo).values(newInfoData);
    }

    return ctx.json({
        userId: newUser[0]?.id,
    });
});

API.post("poll/data", async (ctx) => {
    const reqData = await ctx.req.json();
    let firstSetup = false;

    if ("ott" in reqData) {
        if ((reqData.token + reqData.ott) in tempToken) {
            firstSetup = true;
        }
    }

    let pollData : any = await db.select({
            id: poll.id,
            title: poll.title,
            description: poll.description,
            dateStart: poll.dateStart,
            dateEnd: poll.dateEnd,
            timezone: poll.timezone,
            open: poll.open
        })
        .from(poll)
        .where(eq(poll.token, reqData.token))
        .limit(1);

    let userData : {[index: string]: UserData} = {};
    
    if (pollData.length < 1) {
        ctx.status(418);
        return ctx.text('AM A TEAPOT XD');
    }

    pollData = pollData[0];

    pollData.auxInfo = await db.select({
            id: auxInfo.id,
            code: auxInfo.code
        })
        .from(auxInfo)
        .where(eq(auxInfo.pollId, pollData.id));

    const sortedAuxInfo = Object.values(auxInfoEnum);
    pollData.auxInfo = pollData.auxInfo.sort((a: any, b: any) => {
        return sortedAuxInfo.indexOf(a.code) - sortedAuxInfo.indexOf(b.code);
    })
    
    let auxInfoMap : {[index: string]: string} = {};
    for (const infoDt of pollData.auxInfo) {
        auxInfoMap[infoDt.id.toString()] = infoDt.code;
    }

    const users = await db.select()
        .from(user)
        .where(eq(user.pollId, pollData.id));
    for (const usr of users) {
        userData[usr.id.toString()] = {
            id: usr.id,
            name: usr.name,
            host: usr.host ?? false,
            attendance: {},
            auxInfo: {}
        };
    }

    const usersAttendance = await db.select({
            userId: attendance.userId,
            date: attendance.date,
            timeslot: attendance.timeslot,
            val: attendance.val,
        })
        .from(attendance)
        .where(inArray(attendance.userId, users.map(e => e.id)));
    for (const att of usersAttendance) {
        if (att.userId) {
            const userId = att.userId.toString();
            if (userData[userId]) {
                const dateKey = att.date + "-" + att.timeslot.toString();
                userData[userId].attendance[dateKey] = att.val;
            }
        }            
    }

    const auxInfos = await db.select({
            infoId: userInfo.infoId,
            userId: userInfo.userId,
            val: userInfo.val
        })
        .from(userInfo)
        .leftJoin(auxInfo, eq(userInfo.infoId, auxInfo.id))
        .where(and(
            inArray(userInfo.userId, users.map(e => e.id)),
            inArray(userInfo.infoId, pollData.auxInfo.map((e: any) => e.id)),
            firstSetup ? undefined : notInArray(auxInfo.code, [auxInfoEnum.veils, auxInfoEnum.lines, auxInfoEnum.discordHandle])
        ));

    for (const auxDt of auxInfos) {
        if ((auxDt.infoId) && (auxDt.userId)) {
            const userId = auxDt.userId.toString();
            const infoId = auxDt.infoId.toString();
            if ((userData[userId]) && (auxInfoMap[infoId])) {
                userData[userId].auxInfo[auxInfoMap[infoId]] = convertToInfoVal(auxInfoMap[infoId], auxDt.val ?? "");
            }
        }
    }

    delete pollData.id;

    return ctx.json({
        firstSetup,
        pollData,
        userData: Object.values(userData).sort((a, b) => {
            if (a.host != b.host) {
                if (a.host) {
                    return(-1);
                } else {
                    return(1);
                }
            } else {
                return a.name.localeCompare(b.name);
            }
        }),
    });
});

API.use("poll/save-att", async (ctx, next) => checkAuth(ctx, next));
API.post("poll/save-att", async (ctx) => {
    const reqData = await ctx.req.json();

    let newAttData: {userId: number, date: string, timeslot:number, val: boolean}[] = [];
    for (const dateKey in (reqData.attData ?? {})) {
        newAttData.push({
            userId: reqData.userData.id,
            date: dateKey.slice(0, 10),
            timeslot: Number(dateKey.slice(11)),
            val: reqData.attData[dateKey]
        });
    }
    
    await db.delete(attendance).where(eq(attendance.userId, reqData.userData.id ?? -1));
    if (newAttData.length > 0) {
        await db.insert(attendance).values(newAttData);
    }

    return ctx.text("SAVED!");
});

API.use("poll/save-info", async (ctx, next) => checkAuth(ctx, next));
API.post("poll/save-info", async (ctx) => {
    const reqData = await ctx.req.json();
    const pollData = ctx.get("pollData");

    const infoMapData = await db.select({ id:auxInfo.id, code:auxInfo.code }).from(auxInfo).where(eq(auxInfo.pollId, pollData.id));
    let infoMap : {[index:string]: number} = {};
    for (const dt of infoMapData) {
        if (dt.code) {
            infoMap[dt.code] = dt.id;
        }        
    }

    await db.delete(userInfo).where(eq(userInfo.userId, reqData.userData.id ?? -1));
    let newInfoData: {userId: number, infoId: number, val:string}[] = [];
    for (const code in (reqData.userData.auxInfo ?? {})) {
        if (code in infoMap) {
            const val = convertFromInfoVal(code, reqData.userData.auxInfo[code] ?? null);
            if (val != "") {
                newInfoData.push({
                    userId: reqData.userData.id,
                    //@ts-expect-error
                    infoId: infoMap[code],
                    val: val
                });
            }
        }
    }

    if (newInfoData.length > 0) {
        await db.insert(userInfo).values(newInfoData);
    }

    return ctx.text("SAVED!");
});

API.use("poll/withdraw", async (ctx, next) => checkAuth(ctx, next));
API.post("poll/withdraw", async (ctx) => {
    await db.delete(user).where(eq(user.id, ctx.get("userData").id));
    await db.delete(attendance).where(eq(attendance.userId, ctx.get("userData").id));
    await db.delete(userInfo).where(eq(userInfo.userId, ctx.get("userData").id));
    return ctx.text("Done!");
});

API.use("poll/delete-user", async (ctx, next) => checkAuth(ctx, next));
API.post("poll/delete-user", async (ctx) => {
    if (ctx.get("userData").host) {
        const reqData = await ctx.req.json();
        await db.delete(user).where(eq(user.id, reqData.userId));
        await db.delete(attendance).where(eq(attendance.userId, reqData.userId));
        await db.delete(userInfo).where(eq(userInfo.userId, reqData.userId));
    }
    
    return ctx.text("Done!");
});

API.use("poll/set-open", async (ctx, next) => checkAuth(ctx, next));
API.post("poll/set-open", async (ctx) => {
    if (ctx.get("userData").host) {
        const reqData = await ctx.req.json();
        await db.update(poll).set({ open: reqData.open ?? true }).where(eq(poll.id, ctx.get("pollData").id));
    }
    return ctx.text("Done!");
});

API.use("poll/delete", async (ctx, next) => checkAuth(ctx, next));
API.post("poll/delete", async (ctx) => {
    if (ctx.get("userData").host) {
        await db.delete(poll).where(eq(poll.id, ctx.get("pollData").id));
        await db.delete(auxInfo).where(eq(auxInfo.id, ctx.get("pollData").id));
        
        const users = await db.select({ id: user.id }).from(user).where(eq(user.pollId, ctx.get("pollData").id));
        await db.delete(user).where(inArray(user.id, users.map(e => e.id)));
        await db.delete(attendance).where(inArray(attendance.userId, users.map(e => e.id)));
        await db.delete(userInfo).where(inArray(userInfo.userId, users.map(e => e.id)));
    }    
    return ctx.text("Done!");
});

//-------------------------- ROUTINES --------------------------
setInterval(() => {
    for (const key in tempToken) {
        if ((tempToken[key] ?? 0) < moment().valueOf()) {
            delete tempToken[key];
        }
    }
}, 60*60*1000)

setInterval(async () => {
    const cutoffTIme = (new Date()).getTime()/1000 + 60*60*24*210;
    const pollToDelete = await db.select({ id: poll.id }).from(poll).where(lt(poll.timeCreated,  cutoffTIme));
    if (pollToDelete.length > 0) {
        await db.delete(poll).where(inArray(poll.id, pollToDelete.map(e => e.id)));
        await db.delete(auxInfo).where(inArray(auxInfo.id, pollToDelete.map(e => e.id)));
        
        const users = await db.select({ id: user.id }).from(user).where(inArray(user.pollId, pollToDelete.map(e => e.id)));
        await db.delete(user).where(inArray(user.id, users.map(e => e.id)));
        await db.delete(attendance).where(inArray(attendance.userId, users.map(e => e.id)));
        await db.delete(userInfo).where(inArray(userInfo.userId, users.map(e => e.id)));
    }
}, 24*20*60*1000)

export default API;
