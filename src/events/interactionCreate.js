import { Events, MessageFlags, Collection } from 'discord.js';

export default {
	name: Events.InteractionCreate,
	async execute(interaction) {

		//interaction handling
		if(!interaction.isChatInputCommand()){ return }

		const command = interaction.client.commands.get(interaction.commandName)
		if(!command){
			console.error(`No command matching ${interaction.commandName} was found.`)
			return
		}


		//cooldown handling
		const { cooldowns } = interaction.client
		if(!cooldowns.has(command.data.name)){ cooldowns.set(command.data.name, new Collection()) }

		const now = Date.now()
		const timestamps = cooldowns.get(command.data.name)
		const defaultCooldownDuration = 3
		const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1_000

		if(timestamps.has(interaction.user.id)){
			const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount

			if(now < expirationTime){
				const expiredTimestamp = Math.round(expirationTime / 1_000)
				return interaction.reply({ 
					content: `\`${command.data.name}\` is on cooldown. Wait <t:${expiredTimestamp}:R> to use it again.`, 
					flags: MessageFlags.Ephemeral 
				})
			}
		}

		timestamps.set(interaction.user.id, now)
		setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount)


		//execute command
		try{ await command.execute(interaction) } 
		catch(error){
			console.error(error)
			if(interaction.replied || interaction.deferred){
				await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral })
			} 
			else{ 
				await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral })
			}
		}
	}
}