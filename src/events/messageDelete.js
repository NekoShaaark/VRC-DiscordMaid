import { AuditLogEvent, Events } from "discord.js"
import { createServerLogInDB } from "../db/dbHandling.js"
import LogEventTypes from "../misc/logEventTypes.js"
import { serverLogLogger } from "../misc/serverLogLogger.js"

export default {
    name: Events.MessageDelete,
    once: false,

    async execute(message) {
        //if message was deleted outside of a guild/server, or if message deleted was from a bot, return
        if(!message.guild || message.author?.bot){ return }

        //grab latest audit log, to try to see who deleted last message it
        let executorId
        let messageAuthorId = message.author.id
        try{
            const auditLog = await message.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MessageDelete })
            const fetchedAuditLog = auditLog.entries.first()
            if(fetchedAuditLog?.target?.id === message.author.id){ executorId = fetchedAuditLog.executor.id }
            if(!executorId){ 
                executorId = message.author.id
                messageAuthorId = null
            }
            
            const newLog = await createServerLogInDB(executorId, messageAuthorId, LogEventTypes.MESSAGE_DELETE, { 
                //details object
                deletedMessage: message.content
            })
            //send copy of log to logging channel
            await serverLogLogger(message, newLog)
        } 
        catch(error){ console.error("There was an error trying to get deleted message's audit log: ", error) }
    }
}