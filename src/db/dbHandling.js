import { drizzle } from 'drizzle-orm/node-postgres'
import { eq } from 'drizzle-orm'
import { usersTable, userNotesTable } from './schema.js'

const db = drizzle(process.env.DATABASE_URL)


export async function getUserInDB(discordUserId, vrcUserId){
    if(discordUserId != null){
        let discordUser = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.discordUserId, discordUserId))
            .limit(1)
        if(discordUser.length > 0){ return discordUser[0] }
    }
    else if(vrcUserId != null){
        let vrcUser = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.vrcUserId, vrcUserId))
            .limit(1)
        if(vrcUser.length > 0){ return vrcUser[0] }
    }
    //neither user exists
    return null
}

export async function removeUserInDB(discordUserId, vrcUserId){
    if(discordUserId != null){
        let discordUser = getUserInDB(discordUserId, null)
        if(discordUser){
            await db
                .delete(usersTable)
                .where(eq(usersTable.discordUserId, discordUserId))
            return true
        }
    }
    else if(vrcUserId != null){
        let vrcUser = getUserInDB(null, vrcUserId)
        if(vrcUser){
            await db
                .delete(usersTable)
                .where(eq(usersTable.vrcUserId, vrcUserId))
            return true
        }
    }
    //neither user got removed
    return false
}

export async function createUserInDB(discordUserId, discordUsername, userVRCData){
    //check if user exists, and return if does
    if(!getUserInDB(discordUserId, null)){ return null }
    
    //check if userVRCData exists, and pull data from it
    if(!userVRCData){ return null }
    let vrcUserId = await userVRCData.id
    let vrcDisplayName = await userVRCData.displayName

    //insert new user with data, and return
    const newUser = await db
        .insert(usersTable)
        .values({
            discordUserId,
            discordUsername,
            vrcUserId,
            vrcDisplayName
        })
        .returning()
    return newUser[0]
}


export async function getUserNoteInDB(discordUserId, noteId){
    if(discordUserId != null){
        let discordUserNotes = await db
            .select()
            .from(userNotesTable)
            .where(eq(userNotesTable.discordUserId, discordUserId))
        if(discordUserNotes.length > 0){ return discordUserNotes } //return all notes
    }
    else if(noteId != null){
        let userNote = await db
            .select()
            .from(userNotesTable)
            .where(eq(userNotesTable.noteId, noteId))
            .limit(1)
        if(userNote.length > 0){ return userNote[0] } //return one note matching noteId
    }
    //neither user or note exists
    return null
}

export async function getAllUserNotesInDB(){
    let allNotes = await db
        .select()
        .from(userNotesTable)
    return allNotes
}

export async function removeUserNoteInDB(noteId){
    if(noteId != null){
        let userNote = getUserNoteInDB(null, noteId)
        if(userNote){
            await db
                .delete(userNotesTable)
                .where(eq(userNotesTable.noteId, noteId))
            return true
        }
    }
    //note wasn't removed
    return false
}

export async function createUserNoteInDB(discordUserId, userNote){
    //check if user exists, and return if does
    if(!getUserNoteInDB(discordUserId, null)){ return null }
    if(!discordUserId || !userNote){ return null }
    let note = userNote

    //insert new user with data, and return
    const newUser = await db
        .insert(userNotesTable)
        .values({
            discordUserId,
            note
        })
        .returning()
    return newUser[0]
}