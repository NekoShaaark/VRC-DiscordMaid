//imports
import { SlashCommandBuilder } from 'discord.js'
import { VRChatApi } from '@kindlyfire/vrchatapi'
import { getConfig, updateConfig } from '../../configManager.js'

const config = await getConfig()
const newAuthToken = config.authToken
const userAgentName = config.userAgent
const vrc = new VRChatApi({
    userAgent: userAgentName,
    authToken: newAuthToken
})


//export
export default {
    data: new SlashCommandBuilder()
        .setName('submit2fa')
        .setDescription("Submit new 2FA for VRChat User.")
        .addStringOption(option => 
            option
                .setName('2facode')
                .setDescription('The new code')
                .setMinLength(6)
                .setMaxLength(6)
                .setRequired(true)),
    cooldown: 6,

    //runs the command
    async execute(interaction) {        
        if(!config.new2faCodeNeeded){ 
            await interaction.reply("A new 2fa Code isn't required now.")
            return 
        }
        
        //login with authToken and submitted 2fa code
        const inputCode = interaction.options.getString('2facode')
        const result = await vrc.auth.verify2fa(inputCode)
        if(result.data.verified){
            console.log("New 2fa code submitted, please reboot")
            await interaction.reply('New 2fa Code submitted. Please reboot bot to complete reconnect!')
        }
    }
}