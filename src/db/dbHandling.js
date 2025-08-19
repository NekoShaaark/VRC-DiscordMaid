import { drizzle } from 'drizzle-orm/node-postgres'
import { and, asc, eq, sql } from 'drizzle-orm'
import { vrcUsersTable, userNotesTable, serverLogsTable, archivedServerLogsTable } from './schema.js'

const db = drizzle(process.env.DATABASE_URL)


//vrchat user handling
export async function getUserInDB(discordUserId, vrcUserId){
    if(discordUserId != null){
        let discordUser = await db
            .select()
            .from(vrcUsersTable)
            .where(eq(vrcUsersTable.discordUserId, discordUserId))
            .limit(1)
        if(discordUser.length > 0){ return discordUser[0] }
    }
    else if(vrcUserId != null){
        let vrcUser = await db
            .select()
            .from(vrcUsersTable)
            .where(eq(vrcUsersTable.vrcUserId, vrcUserId))
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
                .delete(vrcUsersTable)
                .where(eq(vrcUsersTable.discordUserId, discordUserId))
            return true
        }
    }
    else if(vrcUserId != null){
        let vrcUser = getUserInDB(null, vrcUserId)
        if(vrcUser){
            await db
                .delete(vrcUsersTable)
                .where(eq(vrcUsersTable.vrcUserId, vrcUserId))
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
        .insert(vrcUsersTable)
        .values({
            discordUserId,
            discordUsername,
            vrcUserId,
            vrcDisplayName
        })
        .returning()
    return newUser[0]
}


//user note handling
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

export async function createUserNoteInDB(discordUserId, discordUsername, userNote){
    //check if user exists, and return if does
    if(!getUserNoteInDB(discordUserId, null)){ return null }
    if(!discordUserId || !userNote){ return null }
    let note = userNote

    //insert new user with data, and return
    const newUser = await db
        .insert(userNotesTable)
        .values({
            discordUserId,
            discordUsername,
            note
        })
        .returning()
    return newUser[0]
}


//server logs handling
export async function getServerLogInDB(discordUserId, logId, affectedDiscordUserId, eventType, details, limit, archived){
    const allowedDetailKeys = {
        reason: 'string',
        timeoutLength: 'number',
        accountCreatedAt: 'string'
    }
    let whereConditions = []
    let tableToFetchFrom = serverLogsTable
    if(archived){ tableToFetchFrom = archivedServerLogsTable }

    if(logId != null){
        let serverLog = await db
            .select()
            .from(tableToFetchFrom)
            .where(eq(tableToFetchFrom.logId, logId))
            .limit(1)
        return serverLog.length > 0 ? serverLog[0] : null //return one note matching logId
    }

    if(discordUserId != null){ whereConditions.push(eq(tableToFetchFrom.discordUserId, discordUserId)) }
    if(affectedDiscordUserId != null){ whereConditions.push(eq(tableToFetchFrom.affectedDiscordUserId, affectedDiscordUserId)) }
    if(eventType != null){ whereConditions.push(eq(tableToFetchFrom.eventType, eventType)) }
    if(details && typeof details === 'object'){
        for(const [key, rawVal] of Object.entries(details)){
            if(!(key in allowedDetailKeys)){ continue }
            
            const keySql = sql.raw(`'${key}'`) //safe because of allowlist
            const type = allowedDetailKeys[key]
            
            if(type === 'number'){
                const num = Number(rawVal)
                if(!Number.isFinite(num)){ continue }
                //compare as numeric: (details->>'timeoutLength')::numeric = $1
                whereConditions.push(sql`(${tableToFetchFrom.details}->>${keySql}) ILIKE ${'%' + val + '%'}`)
            } 
            else{
              //compare as case-insensitive string
              const val = String(rawVal)
              whereConditions.push(sql`lower(${tableToFetchFrom.details}->>${keySql}) = lower(${val})`)
            }
        }
    }

    const query = db
        .select()
        .from(tableToFetchFrom)
        .limit(limit)

    if(whereConditions.length > 0){ query.where(whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions)) }
    const serverLogs = await query
    return serverLogs
}

export async function getAllServerLogsInDB(){
    let allLogs = await db
        .select()
        .from(serverLogsTable)
        .orderBy(asc(serverLogsTable.logId))
    return allLogs
}

export async function removeServerLogInDB(logId){
    if(logId != null){
        let serverLog = getServerLogInDB(null, logId)
        if(serverLog){
            await db
                .delete(serverLogsTable)
                .where(eq(serverLogsTable.logId, logId))
            return true
        }
    }
    //log wasn't removed
    return false
}

export async function createServerLogInDB(discordUserId, affectedDiscordUserId, eventType, details){
    //insert new log with data, and return
    const newLog = await db
        .insert(serverLogsTable)
        .values({
            discordUserId,
            affectedDiscordUserId,
            eventType,
            details //extra data object
        })
        .returning()
    return newLog[0]
}


//archived server log handling
export async function getAllArchivedServerLogsInDB(){
    let allLogs = await db
        .select()
        .from(archivedServerLogsTable)
        .orderBy(asc(archivedServerLogsTable.logId))
    return allLogs
}