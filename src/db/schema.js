import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core"


export const usersTable = pgTable('users', {
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
  note: text('note').notNull(),
  noteId: serial('noteId').notNull(), //note id
  createdAt: timestamp('created_at').defaultNow().notNull()
})