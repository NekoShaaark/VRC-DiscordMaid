//imports
import { SlashCommandBuilder } from 'discord.js'


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