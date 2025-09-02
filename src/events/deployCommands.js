import dotenv from 'dotenv'
import { readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'url'
import { REST, Routes } from 'discord.js'

dotenv.config()

//resolve __filename / __dirname (ESM style)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

//gather all command definitions that need to be deployed
const commands = []
const commandsRoot = join(__dirname, '..', 'commands') // <-- points to src/commands
const commandFolders = readdirSync(commandsRoot)

for(const folder of commandFolders){
  	const folderPath = join(commandsRoot, folder)
  	const commandFiles = readdirSync(folderPath).filter((f) => f.endsWith('.js'))

  	for(const file of commandFiles){
    	const filePath = join(folderPath, file)

    	try{
    	  	//convert the absolute Windows path to a proper file:// URL
    	  	const commandModule = await import(pathToFileURL(filePath).href)
    	  	const command = commandModule.default ?? commandModule

    	  	if(command?.data && typeof command.execute === 'function'){ commands.push(command.data.toJSON()) }
			else{ console.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`) }
    	} 
		catch(error){ console.error(`[ERROR] Failed to import command ${filePath}:`, error) }
  }
}

//deploy the collected commands to Discord (needs ; at the end for some reason)
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  	try {
    	console.log(`Started refreshing ${commands.length} slash-commands (/)`)

    	const data = await rest.put(
    	  	Routes.applicationGuildCommands(
    	  	  	process.env.CLIENT_ID,
    	  	  	process.env.GUILD_ID
    	  	),
    	  	{ body: commands }
    	)

    	//count sub‑commands and sub‑command groups
    	let subcommands = 0
    	let subcommandGroups = 0

    	for(const cmd of data){
    	  	if(cmd.options){
    	  	  	for(const opt of cmd.options){
    	  	  	  	if(opt.type === 1){ subcommands++ } //subcommand
    	  	  	  	if(opt.type === 2){ subcommandGroups++ } //subcommand group
    	  	  	}
    	  	}
    	}

    	console.log(`Successfully reloaded ${data.length} slash-commands (/)`)
    	console.log(`Successfully started and reloaded ${subcommandGroups} subcommand groups and ${subcommands} subcommands.`)
  } 
  catch(error){ console.error('There was an error refreshing slash-commands:', error) }
})()