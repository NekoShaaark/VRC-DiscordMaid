//imports
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder, StringSelectMenuBuilder, UserSelectMenuBuilder } from 'discord.js'
import { getUserInDB, removeUserInDB, createUserInDB, createServerLogInDB } from '../../db/dbHandling.js'
import { getConfig } from '../../configManager.js'
import { getVRC } from '../../vrchatClient.js'
import { serverLogLogger } from '../../misc/serverLogLogger.js'
import LogEventTypes from '../../misc/logEventTypes.js'

const vrc = await getVRC()
const config = await getConfig()

const yesButton = new ButtonBuilder()
    .setCustomId('yesButton')
    .setLabel('Yes')
    .setStyle(ButtonStyle.Success)
const noButton = new ButtonBuilder()
    .setCustomId('noButton')
    .setLabel('No')
    .setStyle(ButtonStyle.Danger)
const booleanActionRow = new ActionRowBuilder()
    .addComponents(yesButton, noButton)

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

async function formatStatus(userStatus){
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
        color: "Blurple"
    }
}

async function determineUserTrustRank(userTags){
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

async function formatGroupRoles(userRoleIds){
    const groupData = await vrc.groups.get(process.env.VRC_GROUP_ID, true)
    const groupRolesData = groupData.data.roles

    //NOTE: if bot role changes, change the vrc_group_bot_id in .env to match new group role id
    const botRole = groupRolesData.find(roleToFind => roleToFind.id === process.env.VRC_GROUP_BOT_ID)
    const manageableRoles = groupRolesData.filter(role => role.order > botRole.order)

    //map through all roles the bot can manage (all roles below itself) into an object for the selectMenu component
    const rolesNamesObject = manageableRoles.map(role => {
        let option = {
            label: role.name,
            value: role.id
        }
        if(role.description != "" && role.description){ option.description = role.description }
        return option
    })

    const rolesNameString = groupRolesData
        .filter(role => userRoleIds.includes(role.id)) //keep only matching ids
        .map(role => role.name)                        //grab just the role name
        .join("\n") || "*No roles.*"                   //join with newlines

    //check if the user has a higher role than the bot's role
    const hasHigherRole = groupRolesData.some(role => userRoleIds.includes(role.id) && role.order < botRole.order)
    const hasSameRole = groupRolesData.some(role => userRoleIds.includes(role.id) && role.order === botRole.order)

    return { rolesNameString, rolesNamesObject, hasHigherRole, hasSameRole }
}

export async function findVRCUserDataFromProfile(interaction, profileArg, userGetType){
    //determine which method to find user, based on targetUser input
    //discord mention
    if(profileArg.slice(0,2) == "<@"){ 
        const mentionedUserId = profileArg.slice(2, -1)
        const userInDb = await getUserInDB(mentionedUserId, null)
        if(!userInDb){
            await interaction.editReply("That user has not linked their VRChat profile to their Discord account. \nTo link your accounts, use the `/vrchat link` command.")
            return null
        }
        //return groupMember userdata
        if(userGetType == "groupMember"){
            const groupMember = await vrc.groups.getMember(process.env.VRC_GROUP_ID, userInDb.vrcUserId)
            return groupMember.data
        }
        
        const foundUser = await vrc.users.get(userInDb.vrcUserId)
        return foundUser.data
    }
    
    //vrchat profile link
    else if(profileArg.slice(0,29) == "https://vrchat.com/home/user/"){
        const vrcUserId = profileArg.slice(29)

        //return groupMember userdata
        if(userGetType == "groupMember"){
            const groupMember = await vrc.groups.getMember(process.env.VRC_GROUP_ID, vrcUserId)
            return groupMember.data
        }

        //return normal userdata
        const foundUser = await vrc.users.get(vrcUserId)
        if(!foundUser){
            await interaction.editReply("Invalid VRChat profile link given, please provide a valid link.")
            return null
        }
        return foundUser.data
    }
    
    //plain text vrchat username/displayName
    else{
        const foundUsers = await vrc.users.search(profileArg)
        if(!foundUsers.data[0]){
            await interaction.editReply("No VRChat users found containing that name.")
            return null
        }

        //return groupMember userdata
        if(userGetType == "groupMember"){
            const groupMember = await vrc.groups.getMember(process.env.VRC_GROUP_ID, foundUsers.data[0].id)
            return groupMember.data
        }

        //return normal userdata
        return foundUsers.data[0]
    }
}

export async function createVRCUserEmbed(foundUserData, shortOption){
    let foundUserObject = {
        displayName: await foundUserData.displayName,
        status: await formatStatus(await foundUserData.status),
        trustLevel: await determineUserTrustRank(await foundUserData.tags),
        statusText: await foundUserData.statusDescription,
        bio: await foundUserData.bio,
        userIcon: await foundUserData.userIcon,
        userId: await foundUserData.id
    }
    if(foundUserObject.statusText === ""){ foundUserObject.statusText = "*No status text.*" }
    if(foundUserObject.bio === ""){ foundUserObject.bio = "*No bio.*" }
    
    const foundUserEmbed = new EmbedBuilder()
        .setColor(`${foundUserObject.status.color}`)
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

export async function createVRCGroupMemberEmbed(interaction, groupMemberData, setDisabled){
    const foundUserData = await findVRCUserDataFromProfile(interaction, `https://vrchat.com/home/user/${groupMemberData.userId}`)
    let foundUserObject = {
        displayName: foundUserData.displayName,
        status: await formatStatus(await foundUserData.status),
        trustLevel: await determineUserTrustRank(await foundUserData.tags),
        statusText: foundUserData.statusDescription,
        bio: foundUserData.bio,
        userIcon: foundUserData.userIcon,
        userId: foundUserData.id
    }
    if(foundUserObject.statusText === ""){ foundUserObject.statusText = "*No status text.*" }
    if(foundUserObject.bio === ""){ foundUserObject.bio = "*No bio.*" }
    const groupRoles = await formatGroupRoles(groupMemberData.roleIds)
    
    const groupMemberEmbed = new EmbedBuilder()
        .setColor(`${foundUserObject.status.color}`)
        .setTitle(`VRChat Group Member: ${foundUserObject.displayName}`)
        .addFields(
            { name: "Status", value: `**${foundUserObject.status.vrcStatus}**`, inline: true },
            { name: "Trust Level", value: `**${foundUserObject.trustLevel}**`, inline: true },
            { name: "Status Text", value: `${foundUserObject.statusText}`, inline: true },
            { name: "Group Roles", value: `${groupRoles.rolesNameString}` }
        )
        .setFooter({ text: `${foundUserObject.displayName}`,
            //add icon to footer if it exists
            ...(foundUserObject.userIcon && foundUserObject.userIcon !== "" ? { iconURL: foundUserObject.userIcon } : {}) })
        .setTimestamp()

    //set if components should be disabled
    let setRoleSelectDisabled = false
    let setKickBanDisabled = false
    if(setDisabled == true || groupRoles.hasHigherRole){ setRoleSelectDisabled = true; setKickBanDisabled = true }
    if(groupRoles.hasSameRole){ setKickBanDisabled = true }
        
    //role change select menu and kick/ban buttons at bottom of embed message
    const roleSelect = new StringSelectMenuBuilder()
        .setCustomId('vrcRoles')
        .setPlaceholder('Select roles to Add/Remove')
        .addOptions(groupRoles.rolesNamesObject)
        .setDisabled(setRoleSelectDisabled)
    const vrcKick = new ButtonBuilder()
        .setCustomId('vrcKick')
        .setLabel('Kick')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(setKickBanDisabled)
    const vrcBan = new ButtonBuilder()
        .setCustomId('vrcBan')
        .setLabel('Ban')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(setKickBanDisabled)
    const vrcActionRow1 = new ActionRowBuilder()
        .addComponents(roleSelect)
    const vrcActionRow2 = new ActionRowBuilder()
        .addComponents(vrcKick, vrcBan)

    return{ groupMemberEmbed, vrcActionRow1, vrcActionRow2 }
}

export async function getVRCDataFromUrl(url){ 
    if(url.slice(0,29) == "https://vrchat.com/home/user/"){
        try{ 
            const userId = url.slice(29)
            let foundUser = await vrc.users.get(userId)
            return foundUser.data
        }
        catch(error){
            console.error("Invalid VRChat Profile Link given, please provide a valid Link.", error)
            return null
        }
    }
}

export const commandMetadata = {
    name: "vrchat",
    category: "VRChat",
    type: "group",
    description: "VRChat commands!!",
    subcommands: {
        profile: {
            usage: "/vrchat profile <@user/link/vrcName> <short>",
            examples: [
                "/vrchat profile",
                "/vrchat profile short:true",
                "/vrchat profile @vrchatEnjoyer32",
                "/vrchat profile VRChatEnjoyer",
                "/vrchat profile https://vrchat.com/home/user/usr_123"
            ],
            description: "Get your VRChat profile, another user's profile, or any VRChat profile link."
        },
        link: {
            usage: "/vrchat link <link>",
            examples: ["/vrchat link https://vrchat.com/home/user/usr_123"],
            description: "Link your VRChat profile to your Discord profile."
        },
        unlink: {
            usage: "/vrchat unlink <@user/vrcLink> <reason>",
            examples: [
                "/vrchat unlink",
                "/vrchat unlink @vrchatEnjoyer32 Accidentally linked wrong account",
                "/vrchat unlink https://vrchat.com/home/user/usr_123 Not in server anymore"
            ],
            description: "User to unlink the profile of, if not you. Only mods can specify a user or VRChat profile."
        },
        "group-join": {
            usage: "/vrchat group-join",
            description: "Information on how to join this server's VRChat Group."
        }
    }
}

//export
export default {
    data: new SlashCommandBuilder()
        .setName('vrchat')
        .setDescription('VRChat commands!!')
        //profile subcommand
        .addSubcommand(subcommand => 
            subcommand
                .setName('profile')
                .setDescription("Get your VRChat profile, another user's profile, or any VRChat profile link.")
                .addStringOption(option => 
                    option
                        .setName('profile')
                        .setDescription('Discord mention, VRChat profile link, or VRChat username.'))
                .addBooleanOption(option => 
                    option
                        .setName('short')
                        .setDescription('Display a shorter version of the profile.')),
        )
        //link subcommand
        .addSubcommand(subcommand => 
            subcommand
                .setName('link')
                .setDescription('Link your VRChat profile to your Discord profile.')
                .addStringOption(option => 
                    option
                        .setName('profile')
                        .setDescription('VRChat profile link from the website.')
                        .setRequired(true))
        )
        //unlink subcommand
        .addSubcommand(subcommand =>
            subcommand
                .setName('unlink')
                .setDescription('Unlink your VRChat profile from your Discord profile.')
                .addStringOption(option => 
                    option
                        .setName('user')
                        .setDescription('User to unlink the profile of, if not you. Only mods can specify a user or VRChat profile.'))
                .addStringOption(option => 
                    option
                        .setName('reason')
                        .setDescription("Reason for unlinking this user's profile (Mods only)."))
        )
        //group-join subcommand
        .addSubcommand(subcommand => 
            subcommand
                .setName('group-join')
                .setDescription("Information on how to join this server's VRChat Group.")
        ),
    cooldown: 15,

    //runs the command
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand()
        const userInteraction = interaction.user
        await interaction.deferReply()

        //group-join subcommand
        if(subcommand === "group-join"){
            const groupJoinEmbed = new EmbedBuilder()
                .setColor('Greyple')
                .setTitle('Joining the VRChat Group')
                .addFields(
                    { name: '', value: 
                        'To join the Group you can:\n' + 
                        '- Join through [the VRChat website](https://vrc.group/THECON.5065).\n' +
                        '- Search for **THECON.5065** in-game, or on the VRChat website.\n' +
                        '   - To do this, follow these steps: Menu > Groups > Find a Group > Enter "**THECON.5065**".\n' +
                        'To join group event instances, you will need to join the above group.'
                    }
                )

            await interaction.editReply({ content: "", embeds: [groupJoinEmbed] })
            return
        }

        //if a new 2FA code is submitted, reboot is required to overcome this
        if(config.new2faCodeNeeded){
            await interaction.editReply('Please contact admin to submit new 2fa Code.')
            return
        }

        //profile command
        if(subcommand === "profile"){
            let foundUser
            const profileArg = interaction.options.getString('profile')
            const shortOrLong = interaction.options.getBoolean('short')

            //if "profile" option is given, search for user, otherwise return user from database
            if(profileArg){
                await interaction.editReply(`Finding ${profileArg}'s VRChat profile...`)
                try{
                    foundUser = await findVRCUserDataFromProfile(interaction, profileArg)
                    if(!foundUser){ return }
                
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
                    const createdVRCUserEmbed = await createVRCUserEmbed(foundUser.data, shortOrLong)
                    await interaction.editReply({
                        content: "",
                        embeds: [createdVRCUserEmbed.foundUserEmbed],
                        components: [createdVRCUserEmbed.vrcActionRow]
                    })
                    return
                }
                await interaction.editReply("Please link your VRChat profile to your Discord account using the `/vrchat link` command to view your account with this command.")
            }
        }

        //link subcommand
        if(subcommand === "link"){
            const vrcProfileLink = interaction.options.getString('profile')
            const foundUser = await getVRCDataFromUrl(vrcProfileLink)
            
            //invalid vrchat profile link
            if(!foundUser){ 
                await interaction.editReply("Provided VRChat profile link is invalid, please check if provided link is correct.")
                return 
            }

            //if user already exists, don't need to create new user
            if(await getUserInDB(userInteraction.id, null)){ 
                interaction.editReply("You have already linked your VRChat profile to this Discord account. \nTo see your profile use the `/vrchat profile` command. \nOr to unlink your account use the `/vrchat unlink` command.")
                return
            }
            //otherwise, if vrchat profie is already linked to another user, send explanation
            else if(await getUserInDB(null, foundUser.id)){
                interaction.editReply("This VRChat profile is already linked to someone's Discord account. \nIf this profile is yours, please contact an admin to fix this.")
                return
            }
            
            //check if this is the user's account, if is, link it, if not discard it
            const createdVRCUserEmbed = await createVRCUserEmbed(foundUser, false)
            await interaction.editReply({ 
                content: "**Do you want to link this your VRChat profile to your Discord account?**", 
                embeds: [createdVRCUserEmbed.foundUserEmbed],
                components: [booleanActionRow]
            })

            //run button handler (collector)
            const filter = i => i.user.id === interaction.user.id
            const collector = interaction.channel.createMessageComponentCollector({ filter, max:1, time:15000 })
            collector.on('collect', async i => {
                await i.deferUpdate()
                if(i.customId === 'noButton'){
                    await i.editReply({ content: "Please try again, but insert *your* VRChat profile.", embeds: [], components: [] })
                    return
                }
                else if(i.customId === 'yesButton'){
                    try{ 
                        //create user and add it to database
                        const newUser = await createUserInDB(userInteraction.id, userInteraction.username, foundUser) 
                        if(newUser){ 
                            //add server log to db, and send copy of log to logging channel
                            await i.editReply({ content: `Successfully linked VRChat profile *"${foundUser.displayName}"* to Discord account *"${userInteraction.username}"*.`, embeds: [], components: [] }) 
                            const newLog = await createServerLogInDB(userInteraction.id, null, LogEventTypes.VRC_LINKED, {
                                //details object
                                vrcUserId: newUser.vrcUserId
                            })
                            await serverLogLogger(interaction, newLog)
                        }
                    }
                    catch(error){ 
                        console.error("There was an error linking a user's VRChat profile: ", error)
                        await i.editReply({ content: "There was an error linking your accounts, please try again or contact an admin.", embeds: [], components: [] })
                    }
                }
            })
            return
        }

        //unlink subcommand
        if(subcommand === "unlink"){
            //admin-only portion
            let userInDb
            let embedContent = "**Do you want to unlink this User's VRChat profile from their Discord account?**"
            let vrcAccountToUnlink = interaction.options.getString('user')
            let reasonArg = interaction.options.getString('reason')
            let isAdmin = false
            let affectedUser
            if(vrcAccountToUnlink){
                const guildMember = await interaction.guild.members.fetch(userInteraction.id)

                //check if user is an admin, and if user exists
                if(!guildMember.roles.cache.has(process.env.ADMIN_ROLE_ID)){ 
                    interaction.editReply("You do not have the permission to unlink other user's profiles. \nIf you wanted to unlink your Discord account from your VRChat profile, please use the command again, but exclude `user`.")
                    return 
                }

                //discord mention
                if(vrcAccountToUnlink.slice(0,2) == "<@"){ 
                    const mentionedUserId = vrcAccountToUnlink.slice(2, -1)
                    userInDb = await getUserInDB(mentionedUserId, null)
                    isAdmin = true
                    if(!userInDb){ await interaction.editReply("User does not have an account linked."); return }
                }

                //vrchat profile link
                else if(vrcAccountToUnlink.slice(0,29) == "https://vrchat.com/home/user/"){
                    const vrcUserId = vrcAccountToUnlink.slice(29)
                    userInDb = await getUserInDB(null, vrcUserId)
                    isAdmin = true
                    if(!userInDb){ await interaction.editReply("Invalid VRChat Profile Link given, please provide a valid Link."); return }
                }
            }

            //get userInteraction if userInDb did not get defined above (in admin portion)
            if(!isAdmin){ 
                userInDb = await getUserInDB(userInteraction.id, null)
                embedContent = "**Do you want to unlink this VRChat profile from your Discord account?**"
            }
            if(!userInDb){
                interaction.editReply("You do not have an account linked. To link your Discord account to your VRChat profile, use the `/vrchat link` command.")    
                return
            }

            //check if this is the user's account, if is, unlink it, if not discard it
            const foundUser = await vrc.users.get(userInDb.vrcUserId)
            const createdVRCUserEmbed = await createVRCUserEmbed(foundUser.data, false)
            const userDeletedUsername = userInDb.discordUsername
            const embedMessage = await interaction.editReply({ 
                content: embedContent,
                embeds: [createdVRCUserEmbed.foundUserEmbed],
                components: [booleanActionRow]
            })

            //run button handler (collector)
            const filter = i => i.user.id === interaction.user.id
            const collector = embedMessage.createMessageComponentCollector({ filter, max:1, time:15000 })
            collector.on('collect', async i => {
                await i.deferUpdate()
                if(i.customId === 'noButton'){
                    //non-admin version (top/if) vs admin version (bottom/else) 
                    if(!isAdmin){ await i.editReply({ content: `Cancelled unlinking your VRChat profile from your Discord account.`, embeds: [], components: [] }) }
                    else{ await i.editReply({ content: `Cancelled unlinking ${userDeletedUsername}'s VRChat profile from their Discord account.`, embeds: [], components: [] }) }
                    return
                }
                else if(i.customId === 'yesButton'){
                    try{ 
                        //delete user from database
                        const userDeleted = await removeUserInDB(userInteraction.id, null)
                        if(userDeleted){ 
                            if(!isAdmin){ 
                                await i.editReply({ content: `Successfully unlinked your VRChat profile from your Discord account.`, embeds: [], components: [] })  
                                affectedUser = null
                            }
                            else{ 
                                await i.editReply({ content: `Successfully unlinked ${userDeletedUsername}'s VRChat profile from their Discord account.`, embeds: [], components: [] }) 
                                affectedUser = userInDb.discordUserId
                            }
                            //add server log to db, and send copy of log to logging channel
                            const newLog = await createServerLogInDB(userInteraction.id, affectedUser, LogEventTypes.VRC_UNLINKED, {
                                //details object
                                vrcUserId: userInDb.vrcUserId,
                                reason: reasonArg
                            })
                            await serverLogLogger(interaction, newLog)
                        }
                    }
                    catch(error){ 
                        console.error(error)
                        if(!isAdmin){ await i.editReply({ content: "There was an error unlinking your accounts, please try again or contact an admin.", embeds: [], components: [] }) }
                        else{ await i.editReply({ content: `There was an error unlinking ${userDeletedUsername}'s accounts, please try again or contact the owner.`, embeds: [], components: [] }) }
                    }
                }
            })
            //on collector timer's end
            collector.on('end', async (collected) => {
                if(collected.size === 0){ 
                    if(!isAdmin){ await embedMessage.edit({ content: `Cancelled unlinking your VRChat profile from your Discord account.`, embeds: [], components: [] }) }
                    else{ await embedMessage.edit({ content: `Cancelled unlinking ${userDeletedUsername}'s VRChat profile from their Discord account.`, embeds: [], components: [] }) }
                }
                return
            })
        }
    }
}