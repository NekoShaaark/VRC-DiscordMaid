//imports
import { SlashCommandBuilder } from 'discord.js'
import { VRChatApi } from '@kindlyfire/vrchatapi'
import { getConfig, updateConfig } from '../../configManager.js'
import dotenv from 'dotenv'
dotenv.config()

const config = await getConfig()
const vrcUsername = process.env.VRC_USERNAME
const vrcPassword = process.env.VRC_PASSWORD
const currentAuthToken = config.authToken
const userAgentName = 'VRChatDiscordHelperBot/0.1'

const vrc = new VRChatApi({
	userAgent: userAgentName,
	authToken: currentAuthToken
})

//TODO: extract this into its own handler file
//if logs into user, continue as normal
const authResult = await vrc.auth.login(vrcUsername, vrcPassword)
if(!('requiresTwoFactorAuth' in authResult.data)){
    const vrcUser = await vrc.user.get()
    console.log("Logged in as:", vrcUser.data.displayName)
    await updateConfig('new2faCodeNeeded', false)
}
//otherwise, create a new authToken, and prompt user to submit new 2FA code
else{
    //login and generate new authToken
    const vrcAgent = new VRChatApi({ userAgent: userAgentName })
    const authResult = await vrcAgent.auth.login(vrcUsername, vrcPassword)
    await updateConfig('authToken', authResult.token) //store token in config.json

    //if 2fa is required (should be always true)
    if('requiresTwoFactorAuth' in authResult.data){ 
        console.log('New 2fa code required!')
        await updateConfig('new2faCodeNeeded', true)
    }
}


//export
export default {
    data: new SlashCommandBuilder()
        .setName('finduser')
        .setDescription("Finds the specified VRChat User.")
        .addStringOption(option => 
            option
                .setName('user')
                .setDescription('The user to find')
                .setRequired(true)),
    cooldown: 64,

    //runs the command
    async execute(interaction) {
        if(config.new2faCodeNeeded){
            await interaction.reply('Please contact admin to submit new 2fa Code.')
            return
        }

        const targetUser = interaction.options.getString('user')
        await interaction.reply(`Finding ${targetUser}...`)

        const foundUsers = await vrc.users.search(targetUser)
        const foundUserName = await foundUsers.data[0].displayName
        // console.log(foundUsers)
        await interaction.editReply(`Found User's displayName: ${foundUserName}`)
    }
}