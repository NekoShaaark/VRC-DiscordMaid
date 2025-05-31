//imports
import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js'
import { VRChatApi } from '@kindlyfire/vrchatapi'
import { getConfig } from '../../configManager.js'

const config = await getConfig()
const vrc = new VRChatApi({
    userAgent: config.userAgent,
    authToken: config.authToken
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
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    cooldown: 6,

    //runs the command
    async execute(interaction) {
        await interaction.deferReply()
        if(!config.new2faCodeNeeded){ 
            await interaction.editReply("A new 2FA Code isn't required now.")
            return 
        }

        //make sure inputted code is numerical
        const inputCode = interaction.options.getString('2facode')
        if(!/^\d{6}$/.test(inputCode)){
            await interaction.editReply("That doesn't look like a valid 6-digit 2FA code, please try a numerical code.")
            return
        }
        
        //check if submitted code works, if it does, login as normal
        //if submitted code doesn't work, handle and return error (hopefully without crashing)
        try{
            const result = await vrc.auth.verify2fa(inputCode)
            if(result.data.verified){
                console.log("New 2FA code submitted, please reboot.")
                await interaction.editReply('New 2FA code submitted. Please reboot bot to complete reconnect!')
            }
            else{ 
                console.log("2FA code is incorrect, please try again.")
                await interaction.editReply("That 2FA code was invalid. Please double-check it and try again.") 
            }
        }
        catch(error){
            console.log("Error during 2FA verification:", error)
            await interaction.editReply("Something went wrong while verifying the 2FA code. Make sure it's a valid code, and try again. Check console for more details.")
        }
    }
}