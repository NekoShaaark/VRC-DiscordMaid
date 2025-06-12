//imports
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js'
import { createUserNoteInDB, getAllUserNotesInDB, getUserNoteInDB, removeUserNoteInDB } from '../../db/dbHandling.js'

let currentComponents
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


async function createUserNoteEmbed(userNoteData, userNoteOption, userNoteIndex, userNoteLength){
    let handledUserNote = ""
    let userNotePlacement = ""
    if(userNoteOption == "add"){ handledUserNote = "added for:" }
    if(userNoteOption == "view"){ handledUserNote = "for:" }
    if(userNoteIndex && userNoteLength > 1){ userNotePlacement = `${userNoteIndex}/${userNoteLength}` }
    
    const createdAtDate = (userNoteData.createdAt).toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: 'numeric', minute: '2-digit', hour12: true })
    const userNoteEmbed = new EmbedBuilder()
        .setColor('Greyple')
        .setTitle(`User Note ${handledUserNote} ${userNoteData.discordUsername}`)
        .addFields({ name: `Note ${userNotePlacement}`, value: `${userNoteData.note}` })
        .setFooter({ text: `NoteID: ${userNoteData.noteId}  •  ${createdAtDate}` })
    return userNoteEmbed
}

async function handlePageEmbed(interaction, array, removeMultipleNotes){
    if(!array){ return null }

    let currentIndex = 0
    let row = new ActionRowBuilder()
    const embeds = await Promise.all(array.map((note, index) => createUserNoteEmbed(note, "view", index+1, array.length)))
    
    //left and right buttons
    const superLeftButton = new ButtonBuilder()
        .setCustomId('superLeftButton')
        .setEmoji('⏪')
        .setStyle(ButtonStyle.Primary)
    const leftButton = new ButtonBuilder()
        .setCustomId('leftButton')
        .setEmoji('⬅️')
        .setStyle(ButtonStyle.Primary)
    const rightButton = new ButtonBuilder()
        .setCustomId('rightButton')
        .setEmoji('➡️')
        .setStyle(ButtonStyle.Primary)
    const superRightButton = new ButtonBuilder()
        .setCustomId('superRightButton')
        .setEmoji('⏩')
        .setStyle(ButtonStyle.Primary)
    
    //handle which row to use, or just return the embed without a row component
    if(embeds.length > 1 && embeds.length < 5){ row.addComponents(leftButton, rightButton) }
    else if(embeds.length >= 5){ row.addComponents(superLeftButton, leftButton, rightButton, superRightButton) }
    else{ await interaction.editReply({ content: "", embeds: [embeds[0]] }); return }

    //send first page embed
    const message = await interaction.editReply({
        content: "",
        embeds: [embeds[currentIndex]],
        components: [row],
        fetchReply: true
    })
    currentComponents = message.components
    
    //run button handler (collector)
    const filter = i => i.user.id === interaction.user.id
    const collector = message.createMessageComponentCollector({ filter, time: 90000 })
    collector.on('collect', async i => {
        let newIndex = currentIndex
        if(i.customId === 'superLeftButton'){ newIndex = (currentIndex-5 + embeds.length) % embeds.length }
        else if(i.customId === 'leftButton'){ newIndex = (currentIndex === 0) ? embeds.length-1 : currentIndex-1 }
        else if(i.customId === 'rightButton'){ newIndex = (currentIndex === embeds.length-1) ? 0 : currentIndex+1 }
        else if(i.customId === 'superRightButton'){ newIndex = (currentIndex+5) % embeds.length }

        //send updated page embed, if index is updated (button is pressed)
        if(newIndex !== currentIndex){
            currentIndex = newIndex
            await i.update({ embeds: [embeds[currentIndex]] })
        }
        else{ await i.deferUpdate() }
    })

    //disable buttons when collector timer out
    if(!removeMultipleNotes){ 
        collector.on('end', async () => {
            let disabledRow = new ActionRowBuilder()
            if(row.components.length == 4){
                disabledRow.addComponents(
                    superLeftButton.setDisabled(true),
                    leftButton.setDisabled(true),
                    rightButton.setDisabled(true),
                    superRightButton.setDisabled(true)
                )
            }
            else if(row.components.length == 2){
                disabledRow.addComponents(
                    leftButton.setDisabled(true),
                    rightButton.setDisabled(true)
                )
            }
            await interaction.editReply({ components: [disabledRow] })
        })
    }
}

async function formatNotesArrayMessage(notesArray, startingMessage){

    //determine if it's an array of objects or raw values
    const values = notesArray.map(entry => entry.noteId ?? entry)
    const lastValue = values.pop() //remove and save the last one

    let formattedMessage
    if(notesArray.length >= 2){ 
        const messageParts = startingMessage.trim().split(/\s+/) //split on spaces
        messageParts.pop() //remove the last item (same as lastValue)
        formattedMessage = `${messageParts.join(' ')} and ${lastValue}`
    }
    else{ formattedMessage = lastValue }
    return formattedMessage
}

async function handleMassNoteRemoval(embedMessage, loggingChannel, array){
    if(!array){ return null }

    let removedNotes = []
    let removedNotesArrayMessage = ""
    let messageContext = "noteId"
    await Promise.all(array.map(async (note) => {
        const noteId = note.noteId
        const noteRemoved = await removeUserNoteInDB(noteId)
        if(noteRemoved){ 
            removedNotes.push(noteId)
            removedNotesArrayMessage += `${noteId}, `
        }
    }))
    const removedNotesMessage = await formatNotesArrayMessage(removedNotes, removedNotesArrayMessage)
    if(removedNotes.length >= 2){ messageContext = "noteIds" }

    console.log(`Removed ${messageContext} ${removedNotesMessage} from database.`)
    await embedMessage.edit({ content: `Successfully deleted ${messageContext} ${removedNotesMessage}.`, embeds: [], components: [] })
    await loggingChannel.send({ content: `Successfully deleted ${messageContext} ${removedNotesMessage}.` })
}


//export
export default {
    data: new SlashCommandBuilder()
        .setName('mod')
        .setDescription("Moderation commands!!")
        //usernote subcommand group
        .addSubcommandGroup(group => 
            group
                .setName('usernote')
                .setDescription("Add/Remove/View notes made, or make notes on Users.")
                //add usernote subcommand
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('add')
                        .setDescription("Add a note to a User.")
                        .addUserOption(option =>
                            option
                                .setName('user')
                                .setDescription("User to make a notes on.")
                                .setRequired(true))
                        .addStringOption(option =>
                            option
                                .setName('note')
                                .setDescription("Note about User.")
                                .setRequired(true))
                )
                //remove usernote subcommand
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('remove')
                        .setDescription("Remove one or more notes, using note ID(s).")
                        .addStringOption(option =>
                            option
                                .setName('noteid')
                                .setDescription("Note ID(s) to remove (multiple = seperated by comma).")
                                .setRequired(true))
                )
                //view usernote subcommand
                .addSubcommand(subcommand =>    
                    subcommand
                        .setName('view')
                        .setDescription('View notes on a specific User.')
                        .addUserOption(option => 
                            option
                                .setName('user')
                                .setDescription("User to view notes on."))
                        .addStringOption(option => 
                            option
                                .setName('noteid')
                                .setDescription('Note ID to view (optional).'))
                )
                //view-all usernote subcommand
                .addSubcommand(subcommand => 
                subcommand
                    .setName('view-all')
                    .setDescription('View all notes in existence ever.')
                )
        )
        //TODO: group-user subcommand
        .addSubcommand(subcommand => 
            subcommand
                .setName('group-user')
                .setDescription("Get user's VRChat profile in Group.")
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages), //STUB: maybe change this
    cooldown: 8,

    //runs the command
    async execute(interaction) {
        const loggingChannel = interaction.guild.channels.cache.get(process.env.LOGGING_CHANNEL_ID)
        const subcommandGroup = interaction.options.getSubcommandGroup()
        const subcommand = interaction.options.getSubcommand()
        await interaction.deferReply() //{ flags: MessageFlags.Ephemeral }

        //usernote subcommandGroup
        if(subcommandGroup === "usernote"){
            //usernote add subcommand
            if(subcommand === "add"){
                const userArg = interaction.options.getUser("user")
                const noteArg = interaction.options.getString("note")
                const guildMember = await interaction.guild.members.fetch(userArg.id)
                
                let newUserNote = await createUserNoteInDB(userArg.id, guildMember.user.username, noteArg)
                const userNoteEmbed = await createUserNoteEmbed(newUserNote, "add")

                await interaction.editReply({ content: "", embeds: [userNoteEmbed] })
                await loggingChannel.send({ content: "", embeds: [userNoteEmbed] })
            }
            //usernote remove subcommand
            if(subcommand === "remove"){
                const noteIdArg = interaction.options.getString("noteid")
                let removeMultipleNotes = false
                let notesArrayMessage = ""
                let invalidNotesArrayMessage = ""
                let foundNotesArray = []
                let embedMessage
                
                //multi-note removal
                if(noteIdArg.includes(",")){ 
                    removeMultipleNotes = true
                    const noteIdArray = noteIdArg.split(",")
                    const seenNoteIds = new Set()
                    const uniqueNoteIds = [...new Set(noteIdArray)]
                    let invalidNotesArray = []
                    let embedMessageContent = `**Do you want to remove these Notes?**`
                    if(noteIdArray.includes("")){ await interaction.editReply("Argument contains invalid number. Please provide only valid Note IDs."); return }
                    
                    //map through all provided notes
                    await Promise.all(uniqueNoteIds.map(async (noteId) => {
                        let foundUserNote = await getUserNoteInDB(null, noteId)
                        if(!foundUserNote){ //invalid notes
                            invalidNotesArray.push(noteId)
                            invalidNotesArrayMessage += `${noteId}, `
                            return 
                        }
                        //skip if duplicate
                        if(seenNoteIds.has(foundUserNote)){ return }
                        
                        //valid notes
                        seenNoteIds.add(foundUserNote.noteId)
                        foundNotesArray.push(foundUserNote)
                        notesArrayMessage += `${foundUserNote.noteId}, `
                    }))
                    
                    //handle invalid notes
                    if(!foundNotesArray[0]){ await interaction.editReply("None of these Note IDs exist, please provide valid Note IDs to remove."); return }
                    let foundNotesMessageContext = "this valid Note"
                    if(foundNotesArray.length >= 2){ foundNotesMessageContext = "these valid Notes" }

                    invalidNotesArrayMessage = await formatNotesArrayMessage(invalidNotesArray, invalidNotesArrayMessage)
                    if(invalidNotesArray[0]){
                        if(invalidNotesArray.length >= 2){ embedMessageContent = `These Note IDs don't exist: ${invalidNotesArrayMessage}.\n **Do you want to remove ${foundNotesMessageContext} instead?**` }
                        else{ embedMessageContent = `Note ID ${invalidNotesArrayMessage} does not exist.\n**Do you want to remove ${foundNotesMessageContext} instead?**` }
                    }
                    
                    //create paged embed, then edit embed to have yes/no buttons
                    await handlePageEmbed(interaction, foundNotesArray, removeMultipleNotes)
                    notesArrayMessage = await formatNotesArrayMessage(foundNotesArray, notesArrayMessage)
                    let newMessageComponents
                    if(currentComponents){ newMessageComponents = [...currentComponents, booleanActionRow] }
                    else{ newMessageComponents = [booleanActionRow] }

                    embedMessage = await interaction.editReply({
                        content: embedMessageContent,
                        components: newMessageComponents
                    })
                }

                //check if singular note exists
                else{
                    const foundUserNote = await getUserNoteInDB(null, noteIdArg)
                    if(!foundUserNote){ interaction.editReply("This Note ID does not exist."); return }
                    const userNoteEmbed = await createUserNoteEmbed(foundUserNote, "view")
                    embedMessage = await interaction.editReply({
                        content: "**Are you sure you want to remove this Note?**",
                        embeds: [userNoteEmbed],
                        components: [booleanActionRow]
                    })
                }

                //run button handler (collector)
                const filter = i => i.customId === 'yesButton' || i.customId === 'noButton'
                const collector = embedMessage.createMessageComponentCollector({ filter, max:1, time:15000 })
                collector.on('collect', async i => {
                    if(!removeMultipleNotes){ await i.deferUpdate() }
                    if(i.customId === 'noButton'){
                        if(removeMultipleNotes){ await embedMessage.edit({ content: `Cancelled removing noteIds ${notesArrayMessage}.`, embeds: [], components: [] }) }
                        else{ await i.editReply({ content: `Cancelled removing noteId ${noteIdArg}.`, embeds: [], components: [] }) }
                        return
                    }
                    else if(i.customId === 'yesButton'){
                        try{ 
                            if(removeMultipleNotes){
                                handleMassNoteRemoval(embedMessage, loggingChannel, foundNotesArray)
                                return
                            }
                            //remove singular note from database
                            else{
                                const noteDeleted = await removeUserNoteInDB(noteIdArg)
                                if(noteDeleted){ 
                                    console.log(`Removed noteId ${noteIdArg} from database.`)
                                    await i.editReply({ content: `Successfully deleted noteId ${noteIdArg}.`, embeds: [], components: [] })
                                    await loggingChannel.send({ content: `Successfully deleted noteId ${noteIdArg}.` })
                                }
                            }
                        }
                        catch(error){ 
                            console.error(error)
                            if(removeMultipleNotes){ await embedMessage.edit({ content: `There was an error deleting noteIds ${notesArrayMessage}, please try again or contact the owner.`, embeds: [], components: [] }) }
                            else{ await i.editReply({ content: `There was an error deleting noteId ${noteIdArg}, please try again or contact the owner.`, embeds: [], components: [] }) }
                        }
                    }
                })
                //on collector timer's end
                collector.on('end', async (collected) => {
                    if(collected.size === 0){ 
                        if(removeMultipleNotes){ await embedMessage.edit({ content: `Cancelled removing noteIds ${notesArrayMessage}.`, embeds: [], components: [] }) }
                        else{ await embedMessage.edit({ content: `Cancelled removing noteId ${noteIdArg}.`, embeds: [], components: [] }) }
                    }
                    return
                })
            }
            //usernote view subcommand
            if(subcommand === "view"){
                const noteIdArg = interaction.options.getString("noteid")
                const userArg = interaction.options.getUser("user")

                //noteId is more weighted, as it only displays one userNote
                if(noteIdArg){ 
                    let foundUserNote = await getUserNoteInDB(null, noteIdArg)
                    if(!foundUserNote){ await interaction.editReply("This Note ID does not exist."); return }
                    
                    //get all user's notes, and calculate which note this is out of how many the user has
                    let allUserNotes = await getUserNoteInDB(foundUserNote.discordUserId, null)
                    let noteIndex = allUserNotes.findIndex(note => note.noteId === foundUserNote.noteId)
                    let userNoteEmbed = await createUserNoteEmbed(foundUserNote, "view", noteIndex+1, allUserNotes.length)
                    await interaction.editReply({ content: "", embeds: [userNoteEmbed] }) //flags: MessageFlags.Ephemeral 
                }

                //get all of a user's notes, and display them in a paginated embed
                else if(userArg){
                    let allUserNotes = await getUserNoteInDB(userArg.id, null)
                    if(!allUserNotes){ await interaction.editReply("This User has no notes."); return }
                    await handlePageEmbed(interaction, allUserNotes, false)
                }

                //no arguments given
                else{ await interaction.editReply("Please provide a User or NoteID to view.") }
            }
            //usernote view-all subcommand
            if(subcommand === "view-all"){
                let allUserNotesInDb = await getAllUserNotesInDB()
                if(!allUserNotesInDb[0]){ await interaction.editReply('There are no notes currently stored. To store a note on a User, use the `/mod usernote add @ping "noteHere"` command.'); return }
                await interaction.editReply("This might take a while, please be patient, and do not run the command again until this message changes.")
                await handlePageEmbed(interaction, allUserNotesInDb, false)
            }
        }
    }
}