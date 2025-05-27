//imports
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } from 'discord.js'
import { drizzle } from 'drizzle-orm/node-postgres'
import { eq } from 'drizzle-orm'
import { usersTable } from '../../db/schema.js'
import { getVRC } from '../../vrchatClient.js'
import { createVRCUserEmbed } from './findUser.js'

const db = drizzle(process.env.DATABASE_URL)
const vrc = getVRC()

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
    

async function createNewUser(discordUserId, discordUsername, userVRCData){
    //check if user exists, and return if does
    if(!getUserInDB(discordUserId, null)){ return null }
    
    //check if userVRCData exists, and pull data from it
    if(!userVRCData){ return null }
    let vrcUserId = await userVRCData.id
    let vrcDisplayName = await userVRCData.displayName

    //insert new user with data, and return
    const newUser = await db
        .insert(usersTable)
        .values({
            discordUserId,
            discordUsername,
            vrcUserId,
            vrcDisplayName
        })
        .returning()
    return newUser[0]
}

export async function getUserInDB(discordUserId, vrcUserId){
    if(discordUserId != null){
        const currentUser = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.discordUserId, discordUserId))
            .limit(1)
        if(currentUser.length > 0){ return currentUser[0] }
    }
    else if(vrcUserId != null){
        const currentUser = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.vrcUserId, vrcUserId))
            .limit(1)
        if(currentUser.length > 0){ return currentUser[0] }
    }
    //neither user exists
    return null
}

export async function removeUserInDB(discordUserId, vrcUserId){
    if(discordUserId != null){
        const currentUser = getUserInDB(discordUserId, null)
        if(currentUser){
            await db
                .delete(usersTable)
                .where(eq(usersTable.discordUserId, discordUserId))
            return true
        }
    }
    else if(vrcUserId != null){
        const currentUser = getUserInDB(null, vrcUserId)
        if(currentUser){
            await db
                .delete(usersTable)
                .where(eq(usersTable.vrcUserId, vrcUserId))
            return true
        }
    }
    //neither user got removed
    return false
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


//export
export default {
    data: new SlashCommandBuilder()
        .setName('vrchat')
        .setDescription('something cool here')
        //TODO: info subcommand
        .addSubcommand(subcommand => 
            subcommand
                .setName('info')
                .setDescription('Info on this Bot!')
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
                        .setDescription('User to unlink the profile of, if not you. Only mods can specify a user or VRChat profile.')
                )
        ),
    cooldown: 64,

    //runs the command
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand()
        const userInteraction = interaction.user
        await interaction.deferReply()

        //link subcommand
        if(subcommand === "link"){
            const vrcProfileLink = interaction.options.getString('profile')
            const foundUser = await getVRCDataFromUrl(vrcProfileLink)
            
            //invalid vrchat profile link
            if(!foundUser){ 
                await interaction.editReply("Provided VRChat Profile Link is invalid, please check if provided link is correct.")
                return 
            }

            //if user already exists, don't need to create new user
            //otherwise, if vrchat is already linked to another user, send explanation
            if(await getUserInDB(userInteraction.id, null)){ 
                interaction.editReply("You have already linked your VRChat Profile to this Discord account. \n To see your profile use the `/vrc` command. \n Or to unlink your account use the `/vrchat unlink` command.")
                return
            }
            else if(await getUserInDB(null, foundUser.id)){
                interaction.editReply("This VRChat Profile is already linked to someone's Discord account. \n If this Profile is yours, please contact an admin to fix this.")
                return
            }
            
            //check if this is the user's account, if is, link it, if not discard it
            const createdVRCUserEmbed = await createVRCUserEmbed(foundUser, false)
            await interaction.editReply({ 
                content: "**Is this your User?**", 
                embeds: [createdVRCUserEmbed.foundUserEmbed],
                components: [booleanActionRow]
            })

            //run button handler (collector)
            const filter = i => i.customId === 'yesButton' || i.customId === 'noButton'
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
                        const newUser = await createNewUser(userInteraction.id, userInteraction.username, foundUser) 
                        if(newUser){ 
                            console.log(`Added ${userInteraction.username} to database.`)
                            await i.editReply({ content: `Successfully linked VRChat profile *"${foundUser.displayName}"* to Discord profile *"${userInteraction.username}"*.`, embeds: [], components: [] }) 
                        }
                    }
                    catch(error){ 
                        console.error(error)
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
            let embedContent = "**Do you want to unlink this User's account?**"
            let vrcAccountToUnlink = interaction.options.getString('user')
            let adminMode = false
            if(vrcAccountToUnlink){
                const guildMember = await interaction.guild.members.fetch(userInteraction.id)

                //check if user is an admin, and if user exists
                if(!guildMember.roles.cache.has(process.env.ADMIN_ROLE_ID)){ 
                    interaction.editReply("You do not have the permission to unlink other user's profiles. \n If you wanted to unlink your Discord account from your VRChat profile, please use the command again, but exclude `user`.")
                    return 
                }

                //discord mention
                if(vrcAccountToUnlink.slice(0,2) == "<@"){ 
                    const mentionedUserId = vrcAccountToUnlink.slice(2, -1)
                    userInDb = await getUserInDB(mentionedUserId, null)
                    adminMode = true
                    if(!userInDb){ await interaction.editReply("User does not have an account linked."); return }
                }

                //vrchat profile link
                else if(vrcAccountToUnlink.slice(0,29) == "https://vrchat.com/home/user/"){
                    const vrcUserId = vrcAccountToUnlink.slice(29)
                    userInDb = await getUserInDB(null, vrcUserId)
                    adminMode = true
                    if(!userInDb){ await interaction.editReply("Invalid VRChat Profile Link given, please provide a valid Link."); return }
                }
            }

            //get userInteraction if userInDb did not get defined above (in admin portion)
            if(!adminMode){ 
                userInDb = await getUserInDB(userInteraction.id, null)
                embedContent = "**Is this the account you to unlink from?**"
            }
            if(!userInDb){
                interaction.editReply("You do not have an account linked. To link your Discord account to your VRChat account, use the `/vrchat link` command.")    
                return
            }

            //check if this is the user's account, if is, unlink it, if not discard it
            const foundUser = await vrc.users.get(userInDb.vrcUserId)
            const createdVRCUserEmbed = await createVRCUserEmbed(foundUser.data)
            const userDeletedUsername = userInDb.discordUsername
            await interaction.editReply({ 
                content: embedContent,
                embeds: [createdVRCUserEmbed.foundUserEmbed],
                components: [booleanActionRow]
            })

            //run button handler (collector)
            const filter = i => i.customId === 'yesButton' || i.customId === 'noButton'
            const collector = interaction.channel.createMessageComponentCollector({ filter, max:1, time:15000 })
            collector.on('collect', async i => {
                await i.deferUpdate()
                if(i.customId === 'noButton'){
                    //non-admin version (top/if) vs admin version (bottom/else) 
                    if(!adminMode){ await i.editReply({ content: `Cancelled unlinking your VRChat profile from your Discord profile.`, embeds: [], components: [] }) }
                    else{ await i.editReply({ content: `Cancelled unlinking ${userDeletedUsername}'s VRChat profile from their Discord profile.`, embeds: [], components: [] }) }
                    return
                }
                else if(i.customId === 'yesButton'){
                    try{ 
                        //delete user from database
                        const userDeleted = await removeUserInDB(userInteraction.id, null)
                        if(userDeleted){ 
                            console.log(`Removed ${userInteraction.username} from database.`)
                            if(!adminMode){ await i.editReply({ content: `Successfully unlinked your VRChat profile from their Discord profile.`, embeds: [], components: [] })  }
                            else{ await i.editReply({ content: `Successfully unlinked ${userDeletedUsername}'s VRChat profile from their Discord profile.`, embeds: [], components: [] }) }
                        }
                    }
                    catch(error){ 
                        console.error(error)
                        if(!adminMode){ await i.editReply({ content: "There was an error unlinking your accounts, please try again or contact an admin.", embeds: [], components: [] }) }
                        else{ await i.editReply({ content: `There was an error unlinking ${userDeletedUsername}'s accounts, please try again or contact the owner.`, embeds: [], components: [] }) }
                    }
                }
            })
            return
        }
    }
}