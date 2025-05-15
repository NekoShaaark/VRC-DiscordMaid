//imports
import { SlashCommandBuilder } from 'discord.js'
import { VRChatApi } from '@kindlyfire/vrchatapi'
import dotenv from 'dotenv'
dotenv.config()

// const vrcUsername = process.env.VRC_USERNAME
// const vrcPassword = process.env.VRC_PASSWORD
const newAuthToken = process.env.VRC_AUTHTOKEN
const userAgentName = 'VRChatDiscordHelperBot/0.1'

//login with authToken
const vrc = new VRChatApi({
	userAgent: userAgentName,
	authToken: newAuthToken,
})


//export
export default {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription("Replies to the user's message with 'pong'.")
        .addStringOption(option => 
            option
                .setName('user')
                .setDescription('The user to find')
                .setRequired(true)),
    cooldown: 64,

    //runs the command
    async execute(interaction) {
        const targetUser = interaction.options.getString('user')

        await interaction.reply(`Finding ${targetUser}...`)
        const foundUser = await vrc.users.search(targetUser)
        const foundUserName = await foundUser.data[0].displayName
        // console.log(foundUserName)
        await interaction.editReply(`Found User's name: ${foundUserName}`)
    }
}