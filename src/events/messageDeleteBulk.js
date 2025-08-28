import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { AttachmentBuilder, AuditLogEvent, Events } from "discord.js"
import { createServerLogInDB } from "../db/dbHandling.js"
import LogEventTypes from "../misc/logEventTypes.js"
import { serverLogLogger } from "../misc/serverLogLogger.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function generateBulkLogFilename(){
    let index = 0

    //index file
    const indexFilePath = path.resolve(__dirname, "../misc/bulkIndex.json")
    if(fs.existsSync(indexFilePath)){
        const data = JSON.parse(fs.readFileSync(indexFilePath, "utf8"))
        index = data.lastIndex + 1
    }
    fs.writeFileSync(indexFilePath, JSON.stringify({ lastIndex: index }, null, 2))

    //ensure logs folder exists
    const logsDir = path.resolve(__dirname, "../misc/deletedBulkMessages")
    if(!fs.existsSync(logsDir)){ fs.mkdirSync(logsDir, { recursive: true }) }

    //absolute file path
    const filePath = path.join(logsDir, `bulkDelete${index}.txt`)
    return {filePath, index}
}

export default {
    name: Events.MessageBulkDelete,
    once: false,

    async execute(messages) {
        //if first message was deleted outside of a guild/server, return
        if(!messages.first()?.guild){ return }
        
        //fetch audit logs, and check who bulk deleted
        try{
            const formattedDeletedMessages = messages.map(m => `[${m.createdAt.toISOString()}] ${m.author?.tag || "Unknown"}: ${m.content || "[no content]"}`).join("\n")
            const deletedMessagesPreview = formattedDeletedMessages.split("\n").slice(0, 4).join("\n")
            const deletedMessagesFile = await generateBulkLogFilename()
            fs.writeFileSync(deletedMessagesFile.filePath, formattedDeletedMessages)
            
            const auditLog = await messages.first().guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MessageBulkDelete })
            const fetchedAuditLog = auditLog.entries.first()
            
            const fileAttachment = new AttachmentBuilder(deletedMessagesFile.filePath, { name: `bulkDelete${deletedMessagesFile.index}.txt` })
            const newLog = await createServerLogInDB(fetchedAuditLog.executor.id, null, LogEventTypes.MESSAGE_DELETE_BULK, { 
                //details object
                bulkDeleteMessagesFile: `bulkDelete${deletedMessagesFile.index}.txt`,
                bulkDeleteMessagesPreview: deletedMessagesPreview,
                bulkDeleteMessagesCount: messages.size
            })
        
            //send copy of log to logging channel
            await serverLogLogger(messages.first(), newLog, fileAttachment)
        } 
        catch(error){ console.error("There was an error trying to get bulk deleted message's audit log: ", error) }

    }
}