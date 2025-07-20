import { jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core"


export const vrcUsersTable = pgTable('vrc_users', {
  id: serial('id').primaryKey(), //internal id
  
  discordUserId: text('discord_user_id').notNull(), //discord id
  discordUsername: text('discord_username').notNull(),
  
  vrcUserId: text('vrchat_user_id').notNull(), //vrchat id
  vrcDisplayName: text('vrchat_display_name').notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull()
})

export const userNotesTable = pgTable('user_notes', {
  id: serial('id').primaryKey(), //internal id
  
  discordUserId: text('discord_user_id').notNull(), //discord id
  discordUsername: text('discord_username').notNull(),
  
  note: text('note').notNull(),
  noteId: serial('noteId').notNull(), //note id
  
  createdAt: timestamp('created_at').defaultNow().notNull()
})

export const serverLogsTable = pgTable('server_logs', {
  id: serial('id').primaryKey(), //internal id
  
  discordUserId: text('discord_user_id').notNull(), //discord id of command-performing user
  affectedDiscordUserId: text('affected_discord_user_id'), //discord id of affected user (if any)
  
  eventType: text('event_type').notNull(),
  details: jsonb('details').notNull(), //details/extra data on what happened
  logId: serial('logId').notNull(), //log id

  createdAt: timestamp('created_at').defaultNow().notNull()
})