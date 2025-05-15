// imports
import { SlashCommandBuilder } from 'discord.js';

// export using default
export default {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription("Shows the help menu for all commands."),
    cooldown: 5,

    // runs the command
    async execute(interaction) {
        await interaction.reply('Help Menu');
    }
};
