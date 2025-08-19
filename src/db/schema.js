import { integer } from "drizzle-orm/gel-core"
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
  noteId: serial('note_id').notNull(), //note id
  
  createdAt: timestamp('created_at').defaultNow().notNull()
})

export const serverLogsTable = pgTable('server_logs', {
  id: serial('id').primaryKey(), //internal id
  
  discordUserId: text('discord_user_id').notNull(), //discord id of command-performing user
  affectedDiscordUserId: text('affected_discord_user_id'), //discord id of affected user (if any)
  
  eventType: text('event_type').notNull(),
  details: jsonb('details').notNull(), //details/extra data on what happened
  logId: serial('log_id').notNull(), //log id

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  restoredAt: timestamp('restored_at', { withTimezone: true }) //date when log was "unarchived"
})

//mostly copied over from serverLogsTable
export const archivedServerLogsTable = pgTable('archived_server_logs', {
  id: serial('id').primaryKey(), //internal id
  
  discordUserId: text('discord_user_id').notNull(), //discord id of command-performing user
  affectedDiscordUserId: text('affected_discord_user_id'), //discord id of affected user (if any)
  
  eventType: text('event_type').notNull(),
  details: jsonb('details').notNull(), //details/extra data on what happened
  logId: integer('log_id').notNull(), //log id (same as serverLogsTable, for consistency)

  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  archivedAt: timestamp('archived_at', { withTimezone: true }).defaultNow().notNull()
})