//imports
import dotenv from 'dotenv'
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags, SlashCommandBuilder } from 'discord.js'
import { getConfig } from '../../configManager.js'
import { getVRC } from '../../vrchatClient.js'
dotenv.config()

const vrc = getVRC()
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

export async function createVRCUserEmbed(foundUserData, shortOption){
    const foundUserObject = {
        displayName: await foundUserData.displayName,
        status: formatStatus(await foundUserData.status),
        trustLevel: determineUserTrustRank(await foundUserData.tags),
        statusText: await foundUserData.statusDescription,
        bio: await foundUserData.bio,
        userIcon: await foundUserData.userIcon,
        userId: await foundUserData.id
    }
    
    const foundUserEmbed = new EmbedBuilder()
        .setColor(foundUserObject.status.color)
        .setTitle(`VRChat User: ${foundUserObject.displayName}`)
        .addFields(
            { name: "Status", value: `**${foundUserObject.status.vrcStatus}**`, inline: true },
            ...(!shortOption ? [{ name: "Trust Level", value: `**${foundUserObject.trustLevel}**`, inline: true }] : []),
            { name: "Status Text", value: `${foundUserObject.statusText}`, inline: true },
            ...(!shortOption ? [{ name: "VRChat Bio", value: `${foundUserObject.bio}` }] : [])
        )
        .setFooter({ text: `${foundUserObject.displayName}`,
            //add icon to footer if it exists
            ...(foundUserObject.userIcon && foundUserObject.userIcon !== "" ? { iconURL: foundUserObject.userIcon } : {}) })
        .setTimestamp()

    //button link at bottom of embed message
    const vrcProfileLink = new ButtonBuilder()
        .setLabel('Open Website')
        .setURL(`https://vrchat.com/home/user/${foundUserObject.userId}`)
        .setStyle(ButtonStyle.Link)
    const vrcActionRow = new ActionRowBuilder()
        .addComponents(vrcProfileLink)

    return{ foundUserEmbed, vrcActionRow }
}


//export
export default {
    data: new SlashCommandBuilder()
        .setName('vrc')
        .setDescription("Get your VRChat profile, another user's profile, or any profile link.")
        .addStringOption(option => 
            option
                .setName('profile')
                .setDescription('Discord mention or VRChat profile link.')) //TODO: discord mention
        .addBooleanOption(option => 
            option
                .setName('short')
                .setDescription('Display a shorter version of the profile.')),
    cooldown: 64,

    //runs the command
    async execute(interaction) {
        const config = await getConfig()
        if(config.new2faCodeNeeded){ //if set to true, reboot is required to overcome this
            await interaction.reply('Please contact admin to submit new 2fa Code.')
            return
        }

        //send "loading..." message
        const targetUser = interaction.options.getString('profile')
        const shortOrLong = interaction.options.getBoolean('short')
        await interaction.reply(`Finding ${targetUser}...`)
        
        //if user is found, create the vrcUser embed
        try{
            const foundUsers = await vrc.users.search(targetUser)
            const createdVRCUserEmbed = await createVRCUserEmbed(foundUsers.data[0], shortOrLong)
            
            //send embed with profile link button
            await interaction.editReply({ 
                content: "", 
                embeds: [createdVRCUserEmbed.foundUserEmbed], 
                components: [createdVRCUserEmbed.vrcActionRow] 
            })
        }
        catch(error){
            console.error("An error occured while trying to find the VRChat User, or while creating the VRChat User Embed.", error)
            await interaction.editReply({ content: "An error occured while trying to find that VRChat User.", flags: MessageFlags.Ephemeral })
        }
    }
}