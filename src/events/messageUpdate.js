import { Events } from "discord.js"
import { createServerLogInDB } from "../db/dbHandling.js"
import LogEventTypes from "../misc/logEventTypes.js"
import { serverLogLogger } from "../misc/serverLogLogger.js"

export default {
    name: Events.MessageUpdate,
    once: false,

    async execute(message) {
        if(message.author.bot || message.author.system){ return }

        const newLog = await createServerLogInDB(message.author.id, null, LogEventTypes.MESSAGE_EDIT, { 
            //details object
            editedMessageOriginal: message.content,
            editedMessageEdit: message.reactions.message.content
        })
    
        //send copy of log to logging channel
        await serverLogLogger(message, newLog)
    }
}