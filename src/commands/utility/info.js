//imports
import { EmbedBuilder, SlashCommandBuilder } from 'discord.js'

//metadata
export const commandMetadata = {
    name: "info",
    category: "Utility",
    usage: "/info",
    description: "Information about the bot."
}

//export
export default {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription("Information about the bot."),
    cooldown: 5,

    //runs the command
    async execute(interaction) {
        await interaction.deferReply()
        
        const infoEmbed = new EmbedBuilder()
            .setColor('DarkPurple')
            .setTitle(`Discord Maid Bot Info`)
            .setDescription("Discord bot for interacting with the VRChat API, Discord moderation and custom functions.")
            .addFields(
                { name: "Project Commissioner ", value: "Kosaku/Jack" },
                { name: "Programmer", value: "[Neko Shark](https://github.com/NekoShaaark)" }
            )
            .setFooter({ text: '"In a Sea of Fading Stars."' })
        await interaction.editReply({ content: '', embeds: [infoEmbed] })
    }
}