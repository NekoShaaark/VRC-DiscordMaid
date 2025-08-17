import { createServerLogEmbed } from "../commands/moderation/modSubs.js"

//send serverLog to logging channel
export async function serverLogLogger(member, newLog) {
    const loggingChannel = member.guild.channels.cache.get(process.env.LOGGING_CHANNEL_ID)
    if(!loggingChannel){ console.log("ERROR: Logging Channel ID doesn't exist."); return }
    const serverLogEmbed = await createServerLogEmbed(member, newLog, "view")
    await loggingChannel.send({ content: "", embeds: [serverLogEmbed] })
}