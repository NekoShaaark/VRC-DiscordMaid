import { Events } from "discord.js"
import { createServerLogInDB } from "../db/dbHandling.js"
import LogEventTypes from "../misc/logEventTypes.js"
import { serverLogLogger } from "../misc/serverLogLogger.js"
import { convertMinutesToString } from "../commands/moderation/modSubs.js"

export default {
    name: Events.InviteCreate,
    once: false,

    async execute(invite) {
        let inviteMaxAge = invite.maxAge
        if(inviteMaxAge == 0){ inviteMaxAge = "Doesn't Expire" }
        else if(inviteMaxAge == 1800){ inviteMaxAge = "30 minutes"}
        else if(inviteMaxAge > 1800){ inviteMaxAge = await convertMinutesToString(Math.floor(invite.maxAge / 60), true) }
        
        let inviteMaxUses = invite.maxUses
        if(inviteMaxUses == 0){ inviteMaxUses = "Unlimited" }
        
        let inviteTemporary = invite.temporary
        if(inviteTemporary){ inviteTemporary = "True" }

        const inviteCreator = invite.inviter?.id || null
        const newLog = await createServerLogInDB(inviteCreator, null, LogEventTypes.INVITE_CREATE, { 
            //details object
            inviteCode: invite.code,
            inviteChannel: `#${invite.channel.name}\n ${invite.channelId}`,
            inviteMaxAge: inviteMaxAge,
            inviteMaxUses: inviteMaxUses,
            inviteTemporary: inviteTemporary
        })
    
        //send copy of log to logging channel
        await serverLogLogger(invite, newLog)
    }
}