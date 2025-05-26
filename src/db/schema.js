import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core"

const timestamps = {
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  removedAt: timestamp('removed_at')
}

export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(), //internal id
  
  discordUserId: text('discord_user_id').notNull(), //discord id
  discordUsername: text('discord_username').notNull(),
  
  vrcUserId: text('vrchat_user_id').notNull(), //vrchat id
  vrcDisplayName: text('vrchat_display_name').notNull(),

  ...timestamps
})

export const userNotesTable = pgTable('user_notes', {
  id: serial('id').primaryKey(), //internal id
  discordUserId: text('discord_user_id').notNull().references(() => usersTable.discordUserId),
  note: text('note').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
})