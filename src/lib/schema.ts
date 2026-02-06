import { sql } from "drizzle-orm";
import { check } from "drizzle-orm/gel-core";
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const poll = sqliteTable("poll", {
    id: integer("id").primaryKey(),
    token: text("token").notNull(),
    title: text("title").default("").notNull(),
    description: text("description").default(""),
    dateUpdated: text("date_updated").notNull()
}, (table) => [
    check("date_format_check", sql`${table.dateUpdated} LIKE [0-9][0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]`)
]);

export const timeframe = sqliteTable("timeframe", {
    id: integer("id").primaryKey(),
    pollId: integer("poll_id").references(() => poll.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    timeStart: text("time_start").notNull(),
    timeEnd: text("time_end").notNull(),
}, (table) => [
    check("date_format_check", sql`${table.date} LIKE [0-9][0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]`),
    check("time_start_check", sql`${table.timeStart} LIKE [0-2][0-9]:[0-6][0-9]`),
    check("time_end_check", sql`${table.timeEnd} LIKE [0-2][0-9]:[0-6][0-9]`),
])

export const user = sqliteTable("user", {
    id: integer("id").primaryKey(),
    pollId: integer("poll_id").references(() => poll.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    pass: text("pass").notNull(),
    host: integer("host", {mode: "boolean"}).default(false).notNull()
})

export const attendance = sqliteTable("attendance", {
    id: integer("id").primaryKey(),
    userId: integer("user_id").references(() => user.id, { onDelete: "cascade" }),
    val: integer("val", {mode: "boolean"})
})

export const auxInfo = sqliteTable("aux_info", {
    id: integer("id").primaryKey(),
    pollId: integer("poll_id").references(() => poll.id, { onDelete: "cascade" }),
    type: text("type", { enum:["TEXT", "NMBR", "BOOL"]}),
    title: text("title").default("").notNull(),
    description: text("description").default(""),
})

export const userInfo = sqliteTable("user_info", {
    id: integer("id").primaryKey(),
    userId: integer("user_id").references(() => user.id, { onDelete: "cascade" }),
    infoId: integer("info_id").references(() => auxInfo.id, { onDelete: "cascade" }),
    val: text("val")
})