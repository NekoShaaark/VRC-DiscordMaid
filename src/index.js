//imports
import dotenv from 'dotenv'
import { readdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { join, dirname } from 'path'
import { ActivityType, Client, Collection, GatewayIntentBits } from 'discord.js'
import { initializeVRC } from './vrchatClient.js'
import { scheduleCronServerLogArchivalTask } from './db/cronTaskHandling.js'
dotenv.config()

//intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.MessageContent
  ],
  presence: { 
    activities: [{ name: "the Stars.", type: ActivityType.Listening }],
    status: 'online'    
  }
})
client.commands = new Collection()
client.cooldowns = new Collection()

//file and folder variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const foldersPath = join(__dirname, 'commands')
const eventsPath = join(__dirname, 'events')
const commandFolders = readdirSync(foldersPath)
const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith('.js'))

//initialize vrchat api
await initializeVRC()

//initalize cron server log archival task
scheduleCronServerLogArchivalTask()

//command folder handling
//loads commands into bot's runtime, so it can respond to slash-commands
for(const folder of commandFolders){
	const commandsPath = join(foldersPath, folder)
	const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'))

	for(const file of commandFiles){
		const filePath = join(commandsPath, file)
    const commandModule = await import(filePath)
  	const command = commandModule.default
		if('data' in command && 'execute' in command){ client.commands.set(command.data.name, command) } 
    else{ console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`) }
	}
}

//event files handling
for(const file of eventFiles){
  const filePath = join(eventsPath, file)
  const eventModule = await import(filePath)
  const event = eventModule.default || eventModule

  if(event.once){ client.once(event.name, (...args) => event.execute(...args)) } 
  else{ client.on(event.name, (...args) => event.execute(...args)) }
}


//login
client.login(process.env.DISCORD_TOKEN)