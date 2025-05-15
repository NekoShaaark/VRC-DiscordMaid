//imports
import { SlashCommandBuilder } from 'discord.js';


//export
export default {
    data: new SlashCommandBuilder()
        .setName('hug')
        .setDescription("Does something."),
    cooldown: 5,

    //runs the command
    async execute(interaction){

        await interaction.reply('pong')
        
    }
}