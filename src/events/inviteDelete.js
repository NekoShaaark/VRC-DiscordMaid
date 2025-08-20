import { AuditLogEvent, Events } from "discord.js"
import { createServerLogInDB } from "../db/dbHandling.js"
import LogEventTypes from "../misc/logEventTypes.js"
import { serverLogLogger } from "../misc/serverLogLogger.js"


export default {
    name: Events.InviteDelete,
    once: false,

    async execute(invite) {
        let deletedBy = null
        try{
            const logs = await invite.guild.fetchAuditLogs({
                type: AuditLogEvent.InviteDelete,
                limit: 1
            })

            const deletionLog = logs.entries.first()
            if(deletionLog?.target.code === invite.code){ deletedBy = deletionLog.executor }
        } 
        catch(error){ console.error("Could not fetch audit log for invite deletion:", error); return }

        const inviteDeletedBy = deletedBy?.id || "Error: Race Condition"
        const newLog = await createServerLogInDB(inviteDeletedBy, null, LogEventTypes.INVITE_DELETE, {
            //details object
            inviteCode: invite.code,
            inviteChannel: `#${invite.channel.name}\n ${invite.channelId}`
        })

        //send copy of log to logging channel
        await serverLogLogger(invite, newLog)
    }
}