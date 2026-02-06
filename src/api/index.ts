import { Hono } from "hono";
import { db } from "../lib/database";
import { poll } from "../lib/schema";
import moment from "moment";

const API = new Hono();

API.get('/hello', (ctx) => {
    return ctx.json({
        message: "Hello, world!",
        method: "GET",
    })
});

API.get('/hello/:name', (ctx) => {
    return ctx.json({
        message: 'Hello, ' + ctx.req.param('name') + '!',
    });
})

API.put('/hello', (ctx) => {
    return ctx.json({
        message: "Hello, world!",
        method: "PUT"
    });
});

API.put('/hello/:name', async (ctx) => {
    const token = Bun.SHA256.hash(Bun.env.APP_ID + ctx.req.param("name"), "hex");
    const newRow = await db.insert(poll).values({
        token: token,
        title: ctx.req.param("name"),
        description: "",
        dateUpdated: moment().format("YYYY-MM-DD")
    }).returning();

    return ctx.json({
        message: JSON.stringify(newRow),
        method: "PUT"
    });
});

export default API;
