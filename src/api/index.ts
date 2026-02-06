import { Hono } from "hono";
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

export default API;
