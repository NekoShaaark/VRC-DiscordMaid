import { AuditLogEvent, Events } from "discord.js"
import { createServerLogInDB } from "../db/dbHandling.js"
import LogEventTypes from "../misc/logEventTypes.js"
import { serverLogLogger } from "../misc/serverLogLogger.js"

export default {
    name: Events.GuildBanAdd,
    once: false,

    async execute(member) {
        const bannedGuildMember = await member.guild.bans.fetch(member.user.id).catch(() => null)
        if(!bannedGuildMember){ return }
        
        //check if user that left was banned (from audit log)
        const auditLog = await member.guild.fetchAuditLogs({
            limit: 1,
            type: AuditLogEvent.MemberBanAdd
        })

        //check bans that happened within' the last 5 seconds
        const banLog = auditLog.entries.find(log =>
            log.target.id === bannedGuildMember.user.id && Date.now() - log.createdTimestamp < 5000
        )

        //log handling
        let newLog
        if(banLog){
            let banReason = banLog.reason
            if(banReason == null){ banReason = "None" }
            const [userId, ...rest] = (bannedGuildMember.reason).split(' | ')
            const newBanReason = rest.join(' | ')

            //if banned using bot slash-command
            if(newBanReason){
                newLog = await createServerLogInDB(userId, bannedGuildMember.user.id, LogEventTypes.MEMBER_BAN, { 
                    //details object
                    reason: newBanReason
                })
            }
            //else banned using discord's built-in ban system
            else{
                newLog = await createServerLogInDB(`<@${banLog.executor.id}>`, bannedGuildMember.user.id, LogEventTypes.MEMBER_BAN, { 
                    //details object
                    reason: bannedGuildMember.reason
                })
            }
        }
        
        //send copy of log to logging channel
        if(newLog){ await serverLogLogger(member, newLog) }
    }
}