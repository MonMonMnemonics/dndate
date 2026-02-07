import { Hono } from "hono";
import { cors } from "hono/cors";
import { db } from "../lib/database";
import { poll, user, auxInfo, attendance } from "../lib/schema";
import { and, eq, inArray } from "drizzle-orm";
import moment from "moment";
import type { UserData } from "@/common/types";

const API = new Hono();
const tempToken: {[key: string]: number} = {};

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
        dateUpdated: creationDate.clone().format("YYYY-MM-DD"),
        dateStart: reqData.dateStart,
        dateEnd: reqData.dateEnd,
        timezone: reqData.timezone
    }).returning({ id: poll.id});

    await db.insert(user).values({
        pollId: newPoll[0]?.id,
        name: reqData.name,
        pass: pass,
        host: true,        
    }).returning({ id: user.id});

    if ((reqData.opts ?? []).length > 0) {
        await db.insert(auxInfo).values((reqData.opts).map((opt: string) => ({
            pollId: newPoll[0]?.id,
            code: opt,
            type: (opt == "first-timer") ? "BOOL" : "TEXT",
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

    let userData: any = await db.select()
        .from(user)
        .leftJoin(poll, eq(user.pollId, poll.id))
        .where(and(
            eq(user.id, reqData.userId),
            eq(user.pass, pass),
            eq(poll.token, reqData.token)
        ))
        .limit(1);

    if (userData.length < 1) {
        ctx.status(404)
        return ctx.text("USER NOT FOUND");
    }

    return ctx.text('OK!');
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
            timezone: poll.timezone
        })
        .from(poll)
        .where(eq(poll.token, reqData.token))
        .limit(1);

    let userData : {[index: string]: UserData} = {};
    
    if (pollData.length > 0) {
        pollData = pollData[0];

        const users = await db.select().from(user).where(eq(user.pollId, pollData.id));

        const usersAttendance = await db.select({
                userId: attendance.userId,
                date: attendance.date,
                timeslot: attendance.timeslot,
                val: attendance.val,
            })
            .from(attendance)
            .where(inArray(attendance.userId, users.map(e => e.id)));

        for (const usr of users) {
            userData[usr.id.toString()] = {
                id: usr.id,
                name: usr.name,
                host: usr.host ?? false,
                attendance: {}
            }
        }

        for (const att of usersAttendance) {
            if (att.userId) {
                const userId = att.userId.toString();
                if (userData[userId]) {
                    const dateKey = att.date + "-" + att.timeslot.toString();
                    userData[userId].attendance[dateKey] = att.val;
                }
            }            
        }        

        delete pollData.id;
    } else {
        pollData = {};
    }

    return ctx.json({
        firstSetup,
        pollData,
        userData: Object.values(userData),
    });
});

API.post("poll/save", async (ctx) => {
    const reqData = await ctx.req.json();

    let pollData: any = await db.select({
            id: poll.id,
            title: poll.title,
            description: poll.description,
            dateStart: poll.dateStart,
            dateEnd: poll.dateEnd,
            timezone: poll.timezone
        })
        .from(poll)
        .where(eq(poll.token, reqData.token))
        .limit(1);
    if (pollData.length < 1) {
        ctx.status(404)
        return ctx.text("POLL NOT FOUND");
    }

    let userData: any = await db.select().from(user).where(eq(user.id, reqData.userData.id)).limit(1);
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

setInterval(() => {
    for (const key in tempToken) {
        if ((tempToken[key] ?? 0) < moment().valueOf()) {
            delete tempToken[key];
        }
    }
}, 60*60*1000)

export default API;
