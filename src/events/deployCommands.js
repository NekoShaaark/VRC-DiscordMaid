import dotenv from 'dotenv'
import { readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'url'
import { REST, Routes } from 'discord.js'
dotenv.config()

//fetch all command folders
const commands = []
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const foldersPath = join(__dirname, '../commands')
const commandFolders = readdirSync(foldersPath)

//fetch all command files
for(const folder of commandFolders) {
	const commandsPath = join(foldersPath, folder)
	const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'))
	
	//grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
	for(const file of commandFiles){
		const filePath = join(commandsPath, file)
		const command = await import(filePath)
		if(command.default && 'data' in command.default && 'execute' in command.default){
			commands.push(command.default.data.toJSON())
		} 
		else{ console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`) }
	}
}

//construct and prepare an instance of the REST module
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

//deploy/register all commands to discord/guild
(async () => {
	try{
		console.log(`Started refreshing ${commands.length} slash-commands (/).`)

		//refresh all commands in the guild with the current set
		const data = await rest.put(
			Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.DEV_GUILD_ID),
			{ body: commands }
		)

		//count subcommands and subcommand groups
		let subcommands = 0
		let subcommandGroups = 0
		for(const cmd of data){
			if(cmd.options){
				for(const opt of cmd.options){
					if(opt.type === 1){ subcommands++ }
					if(opt.type === 2){ subcommandGroups++ } 
				}
			}
		}

		console.log(`Successfully reloaded ${data.length} slash-commands (/).`)
		console.log(`Successfully started and reloaded ${subcommandGroups} subcommand groups and ${subcommands} subcommands.`)
	}
	catch(error){ console.error("There was an error refreshing slash-commands: ", error) }
})()