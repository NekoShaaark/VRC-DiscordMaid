//imports
import dotenv from 'dotenv'
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder } from 'discord.js'
import { getConfig } from '../../configManager.js'
import { getVRC } from '../../vrchatClient.js'
import { getUserInDB } from './vrchatSubs.js'
dotenv.config()

const vrc = getVRC()
const config = await getConfig()

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
                .setDescription('Discord mention, VRChat profile link, or VRChat username.'))
        .addBooleanOption(option => 
            option
                .setName('short')
                .setDescription('Display a shorter version of the profile.')),
    cooldown: 64,

    //runs the command
    async execute(interaction) {
        await interaction.deferReply()

        //if a new 2FA code is submitted, reboot is required to overcome this
        if(config.new2faCodeNeeded){
            await interaction.reply('Please contact admin to submit new 2fa Code.')
            return
        }

        //send "loading..." message
        let foundUser
        const profileArg = interaction.options.getString('profile')
        const shortOrLong = interaction.options.getBoolean('short')
        
        //if "profile" option is given, search for user, otherwise return user from database
        if(profileArg){
            await interaction.editReply(`Finding ${profileArg}'s VRChat profile...`)
            try{
                //determine which method to find user, based on targetUser input
                //discord mention
                if(profileArg.slice(0,2) == "<@"){ 
                    const mentionedUserId = profileArg.slice(2, -1)
                    const userInDb = await getUserInDB(mentionedUserId, null)
                    if(!userInDb){ 
                        await interaction.editReply("That user has not linked their VRChat account to their Discord account. \n To link your accounts, use the `/vrchat link` command.")
                        return
                    }
                    const foundUsers = await vrc.users.get(userInDb.vrcUserId)
                    foundUser = await foundUsers.data
                }

                //vrchat profile link
                else if(profileArg.slice(0,29) == "https://vrchat.com/home/user/"){
                    const vrcUserId = profileArg.slice(29)
                    const foundUsers = await vrc.users.get(vrcUserId)
                    if(!foundUsers){
                        await interaction.editReply("Invalid VRChat Profile Link given, please provide a valid Link.")
                        return
                    }
                    foundUser = await foundUsers.data
                }

                //plain text vrchat username/displayName
                else{
                    const foundUsers = await vrc.users.search(profileArg)
                    if(!foundUsers){
                        await interaction.editReply("No VRChat users found containing that name.")
                        return
                    }
                    foundUser = await foundUsers.data[0]
                }
            
                //send embed with profile link button
                const createdVRCUserEmbed = await createVRCUserEmbed(foundUser, shortOrLong)
                await interaction.editReply({ 
                    content: "", 
                    embeds: [createdVRCUserEmbed.foundUserEmbed], 
                    components: [createdVRCUserEmbed.vrcActionRow] 
                })
            }
            catch(error){
                console.error("An error occured while trying to find the VRChat User, or while creating the VRChat User Embed.", error)
                await interaction.editReply("An error occured while trying to find that VRChat User.")
            }
        }
        //return user from database, if exists
        else{
            await interaction.editReply(`Finding your VRChat profile...`)
            const userInDb = await getUserInDB(interaction.user.id, null)
            if(userInDb){
                const foundUser = await vrc.users.get(userInDb.vrcUserId)
                const createdVRCUserEmbed = await createVRCUserEmbed(foundUser.data)
                await interaction.editReply({
                    content: "",
                    embeds: [createdVRCUserEmbed.foundUserEmbed],
                    components: [createdVRCUserEmbed.vrcActionRow]
                })
                return
            }
            await interaction.editReply("Please link your VRChat account to your Discord account using the `/vrchat link` command to view your account with this command.")
        }
    }
}