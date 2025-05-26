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
    if(!doesUserExistInDB(discordUserId, null, "discord")){ return null }
    
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
    console.log("returned newUser")
    return newUser[0]
}

async function doesUserExistInDB(discordUserId, vrcUserId, discordOrVRChat){
    if(discordOrVRChat == "discord"){
        const currentUser = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.discordUserId, discordUserId))
            .limit(1)
        if(currentUser.length > 0){ console.log("returned discord currentUser"); return currentUser[0] }
    }
    if(discordOrVRChat == "vrchat"){
        const currentUser = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.vrcUserId, vrcUserId))
            .limit(1)
        if(currentUser.length > 0){ console.log("returned vrchat currentUser"); return currentUser[0] }
    }
    //neither user exists
    return null
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
        //TODO: unlink subcommand
        .addSubcommand(subcommand =>
            subcommand
                .setName('unlink')
                .setDescription('Unlink your VRChat profile from your Discord profile.')
                .addUserOption(option => 
                    option
                        .setName('user')
                        .setDescription('User to unlink the profile of, if not you. Only mods can specify a user.')
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
            if(await doesUserExistInDB(userInteraction.id, null, "discord")){ 
                interaction.editReply("You have already linked your VRChat Profile to this Discord account. \n To see your profile use the `/vrc` command. \n Or to unlink your account use the `/vrchat unlink` command.")
                return
            }
            else if(await doesUserExistInDB(null, foundUser.id, "vrchat")){
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
                if(i.customId === 'noButton'){
                    await i.update({ content: "Please try again, but insert *your* VRChat profile.", embeds: [], components: [] })
                    return
                }
                else if(i.customId === 'yesButton'){
                    try{ 
                        //create user and add it to database
                        const newUser = await createNewUser(userInteraction.id, userInteraction.username, foundUser) 
                        if(newUser){ await i.update({ content: `Successfully linked VRChat profile *"${foundUser.displayName}"* to Discord profile *"${userInteraction.username}"*.`, embeds: [], components: [] }) }
                    }
                    catch(error){ 
                        console.error(error)
                        await i.update("There was an error linking your accounts, please try again or contact an admin.")
                    }
                }
            })
            return
        }
    }
}