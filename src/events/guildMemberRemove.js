import { AuditLogEvent, Events } from "discord.js"
import { createServerLogInDB } from "../db/dbHandling.js"
import LogEventTypes from "../misc/logEventTypes.js"
import { serverLogLogger } from "../misc/serverLogLogger.js"

//NOTE: this might be buggy for some unknown reason
export default {
    name: Events.GuildMemberRemove,
    once: false,

    async execute(member) {
        //wait for 1.5 seconds before executing (to allow the audit log and bans to update)
        setTimeout(async () => {
            const guildMemberBan = await member.guild.bans.fetch(member.user.id).catch(() => null)
            if(guildMemberBan){ return } //handled by guildBanAdd.js instead

            //check if user that left was kicked (from audit log)
            const auditLog = await member.guild.fetchAuditLogs({
                limit: 1,
                type: AuditLogEvent.MemberKick
            })

            //check kicks that happened within' the last 5 seconds
            const kickLog = auditLog.entries.find(log =>
                log.target.id === member.id && Date.now() - log.createdTimestamp < 5000
            )
        
            //log handling
            let newLog
            if(kickLog){
                let kickReason = kickLog.reason
                if(kickReason == null){ kickReason = "None" }
                const [userId, ...rest] = kickReason.split(' | ')
                const newKickReason = rest.join(' | ')

                //if kicked using bot slash-command
                if(newKickReason){
                    newLog = await createServerLogInDB(userId, member.id, LogEventTypes.MEMBER_KICK, { 
                        //details object
                        reason: newKickReason
                    })
                }
                //else kicked using discord's built-in kick system
                else{
                    newLog = await createServerLogInDB(`<@${kickLog.executor.id}>`, kickLog.target.id, LogEventTypes.MEMBER_KICK, { 
                        //details object
                        reason: kickLog.reason
                    })
                }
            } 
            //else left voluntarily
            else{ newLog = await createServerLogInDB(member.id, null, LogEventTypes.MEMBER_LEAVE) }
            
            //send copy of log to logging channel
            if(newLog){ await serverLogLogger(member, newLog) }
        }, 1500)
    }
}