//imports
import { SlashCommandBuilder } from 'discord.js'

//metadata
export const commandMetadata = {
    name: "ping",
    category: "Utility",
    usage: "/ping",
    description: "Replies to the user's message with 'pong'."
}

//export
export default {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription("Replies to the user's message with 'pong'."),
    cooldown: 5,

    //runs the command
    async execute(interaction) {

        await interaction.reply('pong')
    
    }
}