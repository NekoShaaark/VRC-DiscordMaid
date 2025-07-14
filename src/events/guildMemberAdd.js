import { Events } from "discord.js"
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFile } from 'fs/promises'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const data = await readFile(join(__dirname, '../misc/welcomeMessages.json'), 'utf-8')
const welcomeMessages = JSON.parse(data)

export default {
    name: Events.GuildMemberAdd,
    once: false,

    async execute(member) {
        const welcomeChannel = member.guild.channels.cache.get(process.env.WELCOME_CHANNEL_ID)
        if(!welcomeChannel){ console.log("ERROR: Welcome Channel ID doesn't exist."); return }
    
        const randomMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)]
        const newMessage = randomMessage.replace('{user}', `<@${member.id}>`)
        welcomeChannel.send(newMessage)
    }
}