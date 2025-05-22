//imports
import dotenv from 'dotenv'
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder } from 'discord.js'
import { getConfig } from '../../configManager.js'
import { getVRC } from '../../vrchatClient.js'
dotenv.config()

const trustLevelEnum = Object.freeze({
    VISITOR: "",
    NEW: "system_trust_basic",
    USER: "system_trust_known",
    KNOWN: "system_trust_trusted",
    TRUSTED: "system_trust_veteran",
    VETERAN: "system_trust_legend"
})
const vrcStatuses = {
    "join me": { status: "🔵 Join Me", color: "Blue" },
    "online": { status: "🟢 Online", color: "Green" },
    "ask me": { status: "🟠 Ask Me", color: "Orange" },
    "do not disturb": { status: "🔴 Do Not Disturb", color: "Red" },
    "active": { status: "⚫ Offline", color: "Grey" }
}

function formatStatus(userStatus){
    const statusData = vrcStatuses[userStatus]
    if(statusData){
        return {
            vrcStatus: statusData.status, 
            color: statusData.color 
        }
    }
    //blank handling
    return {
        vrcStatus: userStatus, 
        color: Blurple 
    }
}

function determineUserTrustRank(userTags){
    //convert enum to a priority map
    const trustPriorities = Object.entries(trustLevelEnum)
        .filter(([_, value]) => value !== "") //remove VISITOR (empty string)
        .reduce((acc, [key, value], index) => {
            acc[value] = index
            return acc
        }, {})
    let highestPriority = -1
    let highestRank = "Visitor" //default, if no trust tags found
        
    for(const tag of userTags){
        if(trustPriorities.hasOwnProperty(tag)){
            const priority = trustPriorities[tag]
            if(priority > highestPriority){
                highestPriority = priority
                highestRank = Object.keys(trustLevelEnum).find(key => trustLevelEnum[key] === tag)
            }
        }
    }
    return highestRank.charAt(0) + highestRank.slice(1).toLowerCase()
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
        const config = await getConfig()
        if(config.new2faCodeNeeded){ //if set to true, reboot is required to overcome this
            await interaction.reply('Please contact admin to submit new 2fa Code.')
            return
        }

        const targetUser = interaction.options.getString('user')
        await interaction.reply(`Finding ${targetUser}...`)

        const vrc = getVRC()
        const foundUsers = await vrc.users.search(targetUser)
        const foundUserData = {
            displayName: await foundUsers.data[0].displayName,
            status: formatStatus(await foundUsers.data[0].status),
            trustLevel: determineUserTrustRank(await foundUsers.data[0].tags),
            statusText: await foundUsers.data[0].statusDescription,
            bio: await foundUsers.data[0].bio,
            userIcon: await foundUsers.data[0].userIcon,
            userId: await foundUsers.data[0].id
        } 
        
        const foundUserEmbed = new EmbedBuilder()
            .setColor(foundUserData.status.color)
            .setTitle(`VRChat User: ${foundUserData.displayName}`)
            .addFields(
                { name: "Status", value: `**${foundUserData.status.vrcStatus}**`, inline: true },
                { name: "Trust Level", value: `**${foundUserData.trustLevel}**`, inline: true },
                { name: "Status Text", value: `${foundUserData.statusText}`, inline: true },
                { name: "VRChat Bio", value: `${foundUserData.bio}` }
            )
            .setFooter({ text: `${foundUserData.displayName}`, 
                //add icon to footer if it exists
                ...(foundUserData.userIcon && foundUserData.userIcon !== "" ? { iconURL: foundUserData.userIcon } : {}) })
            .setTimestamp()
        
        const vrcProfileLink = new ButtonBuilder()
            .setLabel('Open Website')
            .setURL(`https://vrchat.com/home/user/${foundUserData.userId}`)
            .setStyle(ButtonStyle.Link)
        const vrcActionRow = new ActionRowBuilder()
            .addComponents(vrcProfileLink)

        await interaction.editReply({ content: "", embeds: [foundUserEmbed], components: [vrcActionRow] })
    }
}