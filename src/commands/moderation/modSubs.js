//imports
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags, PermissionFlagsBits, SlashCommandBuilder, time, TimestampStyles } from 'discord.js'
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
    await loggingChannel.send({ content: `${interaction.user} deleted ${messageContext} ${removedNotesMessage}.` })
}

async function handleConfirmationMessage(message, userArg, contextType){
    return new Promise((resolve) => {
        let messageContext
        switch(contextType){
            case "ban": messageContext = "banning"; break
            case "unban": messageContext = "unbanning"; break
            case "kick": messageContext = "kicking"; break
            case "timeout": messageContext = "giving timeout to"; break
            case "untimeout": messageContext = "removing timeout from"; break
        }
        
        //run button handler (collector)
        const filter = i => i.customId === 'yesButton' || i.customId === 'noButton'
        const collector = message.createMessageComponentCollector({ filter, max:1, time:15000 })
        collector.on('collect', async i => {
            await i.deferUpdate()
            if(i.customId === 'noButton'){
                await i.editReply({ content: `Cancelled ${messageContext} ${userArg}.`, embeds: [], components: [] })
                resolve(false)
            }
            else if(i.customId === 'yesButton'){
                await i.editReply({ content: `Now ${messageContext} ${userArg}...`, embeds: [], components: [] })
                resolve(true)
            }
        })
        //on collector timer's end
        collector.on('end', async (collected) => {
            if(collected.size === 0){ 
                await message.edit({ content: `Cancelled ${messageContext} ${userArg}.`, embeds: [], components: [] }) 
                resolve(false)
            }
        })
    })
}

async function convertMinutesToString(inputMinutes){
    if(inputMinutes < 60){ return ' ' }

    const days = Math.floor(inputMinutes / 1440)
    const hours = Math.floor((inputMinutes % 1440) / 60)
    const minutes = inputMinutes % 60
    
    let resultTime = ''
    if(days > 0){ resultTime += `${days} day${days > 1 ? 's' : ''}` }
    if(hours > 0){
        if(resultTime){ resultTime += ', ' }
        resultTime += `${hours} hour${hours > 1 ? 's' : ''}`
    }
    if(minutes > 0){
        if(resultTime){ resultTime += ', ' }
        resultTime += `${minutes} minute${minutes > 1 ? 's' : ''}`
    }
    
    return ` (${resultTime}) ` || '0 minutes'
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
        //ban subcommand
        .addSubcommand(subcommand => 
            subcommand
                .setName('ban')
                .setDescription("Ban a specific User.")
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription("User to ban.")
                        .setRequired(true))
                .addStringOption(option => 
                    option
                        .setName('reason')
                        .setDescription("Reason for ban.")
                        .setRequired(true))
        )
        //unban subcommand
        .addSubcommand(subcommand =>
            subcommand
                .setName('unban')
                .setDescription('Unban a specific User.')
                .addStringOption(option =>
                    option
                        .setName('userid')
                        .setDescription("User to unban (provide id).")
                        .setRequired(true))
        )
        //kick subcommand
        .addSubcommand(subcommand =>
            subcommand
                .setName('kick')
                .setDescription('Kick a specific User.')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription("User to kick.")
                        .setRequired(true))
                .addStringOption(option =>
                    option
                        .setName('reason')
                        .setDescription("Reason for kick.")
                        .setRequired(true))
        )
        //timeout subcommand
        .addSubcommand(subcommand =>
            subcommand
                .setName('timeout')
                .setDescription("Timeout a specific User.")
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription("User to timeout.")
                        .setRequired(true))
                .addNumberOption(option => 
                    option
                        .setName('minutes')
                        .setDescription("Length of timeout (in minutes).")
                        .setRequired(true))
                .addStringOption(option =>
                    option
                        .setName('reason')
                        .setDescription("Reason for timeout.")
                        .setRequired(true))
        )
        //untimeout subcommand
        .addSubcommand(subcommand =>
            subcommand
                .setName('untimeout')
                .setDescription("Remove timeout from a specific User.")
                .addUserOption(option => 
                    option
                        .setName('user')
                        .setDescription("User to remove timeout from.")
                        .setRequired(true))
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages), //STUB: maybe change this
    cooldown: 8,

    //runs the command
    async execute(interaction) {
        const loggingChannel = interaction.guild.channels.cache.get(process.env.LOGGING_CHANNEL_ID)
        const subcommandGroup = interaction.options.getSubcommandGroup()
        const subcommand = interaction.options.getSubcommand()
        await interaction.deferReply() //{ flags: MessageFlags.Ephemeral } //TODO: add this in production

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
                await loggingChannel.send({ content: `${interaction.user} added note`, embeds: [userNoteEmbed] })
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
                                    await loggingChannel.send({ content: `${interaction.user} deleted noteId ${noteIdArg}.` })
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

        //ban/kick subcommand
        if(subcommand === "ban" || subcommand === "kick"){
            let messageContext1
            let messageContext2
            if(subcommand === "ban"){
                messageContext1 = "banning"
                messageContext2 = "banned"
            }
            else if(subcommand === "kick"){
                messageContext1 = "kicking"
                messageContext2 = "kicked"
            }

            const userArg = interaction.options.getUser("user")
            const reasonArg = interaction.options.getString("reason")

            if(userArg === process.env.CLIENT_ID){ interaction.editReply(`You can't ${subcommand} me using myself, silly...`); return }
            if(userArg === interaction.user){ interaction.editReply(`You can't ${subcommand} yourself, silly~`); return}
            if(!userArg){ interaction.editReply(`Please provide a valid User to ${subcommand}.`); return }
            if(!reasonArg){ interaction.editReply(`Please provide a reason for ${messageContext1} this User.`); return }

            const confirmationMessage = await interaction.editReply({ content: `Do you want to ${subcommand} ${userArg} for "${reasonArg}"?`, components: [booleanActionRow] })
            const confirmationResult = await handleConfirmationMessage(confirmationMessage, userArg, subcommand)
            
            if(confirmationResult === true){ 
                try{ 
                    if(subcommand === "ban"){ await interaction.guild.members.ban(userArg, {reason: reasonArg}) }
                    else if(subcommand === "kick"){ await interaction.guild.members.kick(userArg, {reason: reasonArg}) }
                    await interaction.editReply(`Successfully ${messageContext2} ${userArg} for "${reasonArg}".`) 
                    await loggingChannel.send({ content: `${interaction.user} ${messageContext2} ${userArg} for "${reasonArg}".` })
                    return
                }
                catch(error){
                    if(error.code == 50013){ await interaction.editReply(`Provided User cannot be ${messageContext2}. Permission level is higher than me.`) }
                    else{
                        console.error(`Error ${messageContext1} user:`, error) 
                        await interaction.editReply(`An error occurred while trying to ${subcommand} ${userArg}. Please try again, or check console for more info.`) 
                    }
                }
            }
        }
        //unban subcommand
        if(subcommand === "unban"){
            const userArg = interaction.options.getString("userid")
            try{ await interaction.guild.bans.fetch(userArg) } //handle user cannot be found/unbanned
            catch(error){
                if(error.code == 10026){ await interaction.editReply("Provided UserID does not exist, or is already unbanned. Please enter a valid UserID."); return }
                else{
                    console.error("Error finding user:", error)
                    await interaction.editReply("An error occurred while trying to find that user. Please try again, or check console for more info.")
                }
            }
            
            const bannedUser = await interaction.guild.bans.fetch(userArg)
            if(!bannedUser){ interaction.editReply("Please provide a valid User to unban."); return }

            const userToUnban = bannedUser.user
            const confirmationMessage = await interaction.editReply({ content: `Do you want to unban ${userToUnban}? \nUser was previous banned for "${bannedUser.reason}"`, components: [booleanActionRow] })
            const confirmationResult = await handleConfirmationMessage(confirmationMessage, userToUnban, "unban")

            if(confirmationResult === true){
                try{
                    await interaction.guild.members.unban(userToUnban)
                    await interaction.editReply(`Unbanned ${userToUnban}.`)
                    await loggingChannel.send({ content: `${interaction.user} unbanned ${userToUnban}.` })
                    return
                }
                catch(error){
                    console.error("Error unbanning user:", error)
                    await interaction.editReply(`An error occurred while trying to unban ${userToUnban}. Please try again, or check console for more info.`)
                }
            }
        }
        //timeout subcommand
        if(subcommand === "timeout"){
            const userArg = interaction.options.getUser("user")
            const lengthArg = interaction.options.getNumber("minutes")
            const reasonArg = interaction.options.getString("reason")
            
            if(userArg === process.env.CLIENT_ID){ interaction.editReply("You can't time me out using myself, silly..."); return }
            if(userArg === interaction.user){ interaction.editReply("You can't time yourself out, silly~"); return}
            if(!userArg){ interaction.editReply("Please provide a valid User to timeout."); return }
            if(!reasonArg){ interaction.editReply("Please provide a reason for timing this User out."); return }
            if(!lengthArg || lengthArg < 0){ interaction.editReply("Please provide a valid length (in numerical form)."); return }
            if(lengthArg > 40320){ interaction.editReply("40320 minutes (28 days) is the max amount of days allowed by Discord.\nPlease provide a smaller time."); return }

            const timeoutLength = lengthArg * 60000 //convert time to minutes
            const convertedTime = await convertMinutesToString(lengthArg)
            const confirmationMessage = await interaction.editReply({ content: `Do you want to timeout ${userArg} for ${lengthArg} minutes${convertedTime}for "${reasonArg}"?`, components: [booleanActionRow] })
            const confirmationResult = await handleConfirmationMessage(confirmationMessage, userArg, "timeout")

            if(confirmationResult === true){ 
                try{ 
                    const guildMember = await interaction.guild.members.cache.get(userArg.id)
                    await guildMember.timeout(timeoutLength)
                    await interaction.editReply(`Successfully timed ${userArg} out for ${lengthArg} minutes${convertedTime}for "${reasonArg}".`) 
                    await loggingChannel.send({ content: `${interaction.user} timed out ${userArg} for ${lengthArg} minutes for "${reasonArg}".` })
                    return
                }
                catch(error){
                    if(error.code == 50013){ await interaction.editReply(`Provided User cannot be timed out. Permission level is higher than me.`) }
                    else{
                        console.error(`Error timing out user:`, error) 
                        await interaction.editReply(`An error occurred while trying to give timeout to ${userArg}. Please try again, or check console for more info.`) 
                    }
                }
            }
        }
        //untimeout subcommand
        //TODO: add reason for timeout (fetch from database logging system)
        if(subcommand === "untimeout"){
            const userArg = interaction.options.getUser('user')
            const guildMember = await interaction.guild.members.cache.get(userArg.id)
            const timeoutEnd = await guildMember.communicationDisabledUntil

            if(!userArg){ interaction.editReply("Please provide a valid User to remove timeout from."); return }
            if(!timeoutEnd){ interaction.editReply('User is not currently timed out. \nTo timeout a User, use the "/mod timeout" slashcommand.'); return }
        
            //TODO: add reason for timeout
            const confirmationMessage = await interaction.editReply({ content: `${userArg}'s timeout ends ${time(timeoutEnd, TimestampStyles.RelativeTime)}. \nThey were timed out for "%REASON_HERE%". \nDo you want to remove their timeout?`, components: [booleanActionRow] })
            const confirmationResult = await handleConfirmationMessage(confirmationMessage, userArg, "untimeout")
        
            if(confirmationResult === true){
                try{
                    await guildMember.timeout(null)
                    await interaction.editReply(`Removed timeout from ${userArg}.`)
                    await loggingChannel.send({ content: `${interaction.user} removed timeout from ${userArg}. \nThey were previously timed out for "%REASON_HERE%".` })
                    return
                }
                catch(error){
                    console.error("Error removing timeout from user:", error)
                    await interaction.editReply(`An error occurred while trying to remove timeout from ${userArg}. Please try again, or check console for more info.`)
                }
            }
        }
    }
}