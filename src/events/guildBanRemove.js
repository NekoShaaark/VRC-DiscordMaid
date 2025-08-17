import { AuditLogEvent, Events } from "discord.js"
import { createServerLogInDB } from "../db/dbHandling.js"
import LogEventTypes from "../misc/logEventTypes.js"
import { serverLogLogger } from "../misc/serverLogLogger.js"

export default {
    name: Events.GuildBanRemove,
    once: false,

    async execute(member) {
        //check if user that left was unbanned (from audit log)
        const auditLogBanRemove = await member.guild.fetchAuditLogs({
            limit: 1,
            type: AuditLogEvent.MemberBanRemove
        })
        const unbanLog = auditLogBanRemove.entries.first() //get first unban log

        //check latest ban that happened to this user
        //NOTE: this may need a limit, or may not find ban in audit log if its too far back
        const auditLogBanAdd = await member.guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd })
        const banLog = auditLogBanAdd.entries.find(log => log.target.id === unbanLog.target.id)
        
        //log handling
        let newLog
        if(unbanLog){
            let banReason = banLog.reason
            if(banReason == null){ banReason = "None" }
            const [userId, ...rest] = (banLog.reason).split(' | ')
            const newBanReason = rest.join(' | ')
            
            //if banned using bot slash-command
            if(newBanReason){
                newLog = await createServerLogInDB(userId, unbanLog.target.id, LogEventTypes.MEMBER_UNBAN, { 
                    //details object
                    reason: newBanReason
                })
            }
            //else banned using discord's built-in ban system
            else{
                newLog = await createServerLogInDB(`<@${unbanLog.executor.id}>`, unbanLog.target.id, LogEventTypes.MEMBER_UNBAN, { 
                    //details object
                    reason: banLog.reason
                })
            }
        }
        
        //send copy of log to logging channel
        if(newLog){ await serverLogLogger(member, newLog) }
    }
}