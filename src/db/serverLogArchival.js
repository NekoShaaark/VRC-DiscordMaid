import { drizzle } from 'drizzle-orm/node-postgres'
import { eq, lt, sql } from 'drizzle-orm'
import { serverLogsTable, archivedServerLogsTable } from './schema.js'
import { removeBulkDeletionMessageFile } from '../commands/moderation/modSubs.js'

const db = drizzle(process.env.DATABASE_URL)

export async function runServerLogArchivalTask(){
    const archiveCutoff = new Date()
    const deleteCutoff = new Date()
    archiveCutoff.setDate(archiveCutoff.getDate() - 90) //archive if is from 90 days ago
    deleteCutoff.setDate(deleteCutoff.getDate() - 180) //delete if is archived from 180 days ago

    console.log(`[ServerLogArchivalTask] Archiving Server Logs older than ${archiveCutoff.toISOString()}`)
    console.log(`[ServerLogArchivalTask] Deleting Server Logs older than ${deleteCutoff.toISOString()}`)
    
    //copy old logs into archive table
    const oldLogs = await db
        .select()
        .from(serverLogsTable)
        //use restoredAt if it exists, otherwise fall back to createdAt
        .where(lt(sql`COALESCE(${serverLogsTable.restoredAt}, ${serverLogsTable.createdAt})`, archiveCutoff))

    if(oldLogs.length > 0){
        const mappedLogs = oldLogs.map(log => ({
            ...log,
            archivedAt: new Date() //add archive timestamp
        }))

        await db.insert(archivedServerLogsTable).values(mappedLogs)
        await db.delete(serverLogsTable).where(lt(sql`COALESCE(${serverLogsTable.restoredAt}, ${serverLogsTable.createdAt})`, archiveCutoff))
    }

    const archivedLogsToDelete = await db
    .select()
    .from(archivedServerLogsTable)
    .where(lt(archivedServerLogsTable.archivedAt, deleteCutoff))
    
    //remove related bulkDeleteMessageFile if exists
    if(archivedLogsToDelete.length > 0){
        
        //delete bulk deletion file related to archived logs
        for(const log of archivedLogsToDelete){
            if(log.details?.bulkDeleteMessagesFile){ await removeBulkDeletionMessageFile(log.details.bulkDeleteMessagesFile) }
        }
        
        //delete expired logs from archive
        const deletedResult = await db
            .delete(archivedServerLogsTable)
            .where(lt(archivedServerLogsTable.archivedAt, deleteCutoff))
            .returning({ id: archivedServerLogsTable.id })

        return {
            archived: oldLogs.length,
            deleted: deletedResult.length
        }
    }

    return {
        archived: oldLogs.length,
        deleted: 0
    }
}

export async function unarchiveServerLog(logId){
    //fetch from archive table
    const [archivedLog] = await db
        .select()
        .from(archivedServerLogsTable)
        .where(eq(archivedServerLogsTable.logId, logId))
    if(!archivedLog){ throw new Error(`No archived server log found with logId ${logId}.`) }

    //prevent accidental duplicate re-insert
    const [existingLog] = await db
        .select()
        .from(serverLogsTable)
        .where(eq(serverLogsTable.logId, logId))
    if(existingLog){ throw new Error(`Log with logId ${logId} already exists in server_logs.`) }

    //insert back into server logs table
    await db.insert(serverLogsTable).values({
        discordUserId: archivedLog.discordUserId,
        affectedDiscordUserId: archivedLog.affectedDiscordUserId,
        eventType: archivedLog.eventType,
        details: archivedLog.details,
        logId: archivedLog.logId, //keep the original logId
        createdAt: archivedLog.createdAt, //keep original creation time
        restoredAt: new Date() //record restored at time
    })

    //delete unarchived log from archive table
    await db
        .delete(archivedServerLogsTable)
        .where(eq(archivedServerLogsTable.logId, logId))
    
    return logId
}