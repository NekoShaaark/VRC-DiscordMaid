//imports
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { ActionRowBuilder, AttachmentBuilder, AuditLogEvent, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags, PermissionFlagsBits, SlashCommandBuilder, time, TimestampStyles } from 'discord.js'
import { createServerLogInDB, createUserNoteInDB, getAllArchivedServerLogsInDB, getAllServerLogsInDB, getAllUserNotesInDB, getServerLogInDB, getUserNoteInDB, removeServerLogInDB, removeUserNoteInDB } from '../../db/dbHandling.js'
import LogEventTypes from '../../misc/logEventTypes.js'
import { serverLogLogger } from '../../misc/serverLogLogger.js'
import { runServerLogArchivalTask, unarchiveServerLog } from '../../db/serverLogArchival.js'
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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
    
    const footerCreatedAtDate = await formatDateToLocaleString(userNoteData.createdAt, "long")
    const userNoteEmbed = new EmbedBuilder()
        .setColor('Greyple')
        .setTitle(`User Note ${handledUserNote} ${userNoteData.discordUsername}`)
        .addFields({ name: `Note ${userNotePlacement}`, value: `${userNoteData.note}` })
        .setFooter({ text: `NoteID: ${userNoteData.noteId}  •  ${footerCreatedAtDate}` })
    return userNoteEmbed
}

export async function createServerLogEmbed(interaction, serverLogData, serverLogOption, serverLogIndex, serverLogLength){
    let handledServerLog = ""
    let serverLogPlacement = ""

    //try to fetch guildMember, else return id (instead of ping)
    let guildMember
    try{ guildMember = await interaction.guild.members.fetch(serverLogData.discordUserId) }
    catch{ guildMember = serverLogData.discordUserId }
    
    //try to fetch affectedGuildMember if any, else return null (instead of ping)
    let affectedGuildMember = serverLogData.affectedDiscordUserId
    if(affectedGuildMember){ 
        try{ affectedGuildMember = await interaction.guild.members.fetch(serverLogData.affectedDiscordUserId) }
        catch{ 
            const exemptedTypes = ["MEMBER_KICK", "MEMBER_BAN", "MEMBER_UNBAN", "MEMBER_TIMEOUT_ADD", "MEMBER_TIMEOUT_REMOVE", "VRCHAT_UNLINKED", "NOTE_DELETED"] //set to null if eventType isn't one of these
            if(!exemptedTypes.includes(serverLogData.eventType)){ affectedGuildMember = null }
        }
    }

    if(serverLogOption == "view"){ handledServerLog = "Server Log" }
    if(serverLogOption == "view-all"){ handledServerLog = "All Server Logs" }
    if(serverLogOption == "view-archived"){ handledServerLog = "Archived Server Log" }
    if(serverLogOption == "view-all-archived"){ handledServerLog = "All Archived Server Logs" }
    if(serverLogIndex && serverLogLength > 1){ serverLogPlacement = `${serverLogIndex}/${serverLogLength}` }

    let restoredAtDate = ""
    if(serverLogData.restoredAt){ restoredAtDate = `Unarchived: ${await formatDateToLocaleString(serverLogData.restoredAt, "long")}` }
    const accountCreatedAtDate = await formatDateToLocaleString(serverLogData.details.accountCreatedAt)
    const footerCreatedAtDate = await formatDateToLocaleString(serverLogData.createdAt, "long")
    const timeoutLength = serverLogData?.details?.timeoutLength ?? null
    const timeoutRemaining = serverLogData?.details?.timeoutRemaining ?? null
    const logReason = serverLogData?.details?.reason ?? null
    const editedMessageOriginal = serverLogData?.details?.editedMessageOriginal ?? null
    const editedMessageEdit = serverLogData?.details?.editedMessageEdit ?? null
    const deletedMessageContent = serverLogData?.details?.deletedMessage ?? null
    const bulkDeleteMessagesFile = serverLogData?.details?.bulkDeleteMessagesFile ?? null
    const bulkDeleteMessagesPreview = serverLogData?.details?.bulkDeleteMessagesPreview ?? null
    const bulkDeleteMessagesCount = serverLogData?.details?.bulkDeleteMessagesCount ?? null
    const inviteCode = serverLogData?.details?.inviteCode ?? null
    const inviteChannel = serverLogData?.details?.inviteChannel ?? null
    const inviteMaxAge = serverLogData?.details?.inviteMaxAge ?? null
    const inviteMaxUses = serverLogData?.details?.inviteMaxUses ?? null
    const inviteTemporary = serverLogData?.details?.inviteTemporary ?? null
    const vrcUserId = serverLogData?.details?.vrcUserId ?? null
    const usernoteId = serverLogData?.details?.usernoteId ?? null
    const usernoteContent = serverLogData?.details?.usernote ?? null

    const serverLogEmbed = new EmbedBuilder()
        .setColor('Greyple')
        .setTitle(`${handledServerLog} ${serverLogPlacement}`)
        .addFields(
            { name: `Event Type`, value: `${serverLogData.eventType}`, inline: true },
            { name: `User`, value: `${guildMember}`, inline: true },
            ...(affectedGuildMember ? [{ name: `Affected User`, value: `${affectedGuildMember}`, inline: true }] : []),
            ...(accountCreatedAtDate ? [{ name: `Account Created`, value: `${accountCreatedAtDate}`, inline: true }] : []),
            ...(timeoutLength ? [{ name: `Timeout Length`, value: `${timeoutLength}`, inline: true }] : []),
            ...(timeoutRemaining ? [{ name: `Timeout Remaining`, value: `${timeoutRemaining}`, inline: true }] : []),
            ...(logReason ? [{ name: `Reason`, value: `${logReason}`, inline: true }] : []),
            ...(editedMessageOriginal ? [{ name: `Original Message`, value: `${editedMessageOriginal}`, inline: true }] : []),
            ...(editedMessageEdit ? [{ name: `Edited Message`, value: `${editedMessageEdit}`, inline: true }] : []),
            ...(deletedMessageContent ? [{ name: `Deleted Message`, value: `${deletedMessageContent}`, inline: true }] : []),
            ...(bulkDeleteMessagesFile ? [{ name: `Deleted Messages File`, value: `${bulkDeleteMessagesFile}`, inline: true }] : []),
            ...(bulkDeleteMessagesPreview ? [{ name: `Preview`, value: `${bulkDeleteMessagesPreview}`, inline: true }] : []),
            ...(bulkDeleteMessagesCount ? [{ name: `Amount of Deleted Messages`, value: `${bulkDeleteMessagesCount}`, inline: true }] : []),
            ...(inviteCode ? [{ name: `Invite Code`, value: `${inviteCode}`, inline: true }] : []),
            ...(inviteChannel ? [{ name: `Invite Channel`, value: `${inviteChannel}`, inline: true }] : []),
            ...(inviteMaxAge ? [{ name: `Invite Length`, value: `${inviteMaxAge}`, inline: true }] : []),
            ...(inviteMaxUses ? [{ name: `Max Uses`, value: `${inviteMaxUses}`, inline: true }] : []),
            ...(inviteTemporary ? [{ name: `Temporary`, value: `${inviteTemporary}`, inline: true }] : []),
            ...(vrcUserId ? [{ name: `VRChat User ID`, value: `${vrcUserId}`, inline: true }] : []),
            ...(usernoteId ? [{ name: `Note ID`, value: `${usernoteId}`, inline: true }] : []),
            ...(usernoteContent ? [{ name: `Note`, value: `${usernoteContent}`, inline: true }] : [])
        )
        .setFooter({ text: `LogID: ${serverLogData.logId}  •  ${footerCreatedAtDate}   \n${restoredAtDate}` })
    return serverLogEmbed
}

async function handlePageEmbed(interaction, array, removeMultipleNotes, embedType){
    if(!array){ return null }

    let embeds
    let currentIndex = 0
    let row = new ActionRowBuilder()
    
    if(embedType == "userNote"){ embeds = await Promise.all(array.map((note, index) => createUserNoteEmbed(note, "view", index+1, array.length))) }
    else if(embedType == "serverLog"){ embeds = await Promise.all(array.map((log, index) => createServerLogEmbed(interaction, log, "view", index+1, array.length))) }
    else if(embedType == "serverLog-all"){ embeds = await Promise.all(array.map((log, index) => createServerLogEmbed(interaction, log, "view-all", index+1, array.length))) }
    else if(embedType == "archivedServerLog"){ embeds = await Promise.all(array.map((log, index) => createServerLogEmbed(interaction, log, "view-archived", index+1, array.length))) }
    else if(embedType == "archivedServerLog-all"){ embeds = await Promise.all(array.map((log, index) => createServerLogEmbed(interaction, log, "view-all-archived", index+1, array.length))) }
    
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

    //add file attachment for first page embed, if exists
    let firstEmbedOptions = { 
        content: "",
        embeds: [embeds[currentIndex]], 
        components: [row],
        files: [],
        fetchReply: true
    }
    const firstDeletedFileField = embeds[currentIndex].data.fields.find(f => f.name === 'Deleted Messages File')
    if(firstDeletedFileField){
        const fileName = firstDeletedFileField?.value //bulkDelete12.txt
        await handleFileAttachmentAdding(fileName, firstEmbedOptions)
    }

    //send first page embed
    const message = await interaction.editReply(firstEmbedOptions)
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
            let embedOptions = { embeds: [embeds[currentIndex]], files: [] }

            //this name is the same as the field name in the createServerEmbed() function
            const deletedFileField = embeds[currentIndex].data.fields.find(f => f.name === 'Deleted Messages File')
            if(deletedFileField){
                const fileName = deletedFileField?.value //bulkDelete12.txt
                await handleFileAttachmentAdding(fileName, embedOptions)
            }

            await i.update(embedOptions)
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

async function formatEntriesArrayMessage(array, entryId, startingMessage){

    //determine if it's an array of objects or raw values
    const values = array.map(entry => entry[entryId] ?? entry)
    const lastValue = values.pop() //remove and save the last one

    let formattedMessage
    if(array.length >= 2){ 
        const messageParts = startingMessage.trim().split(/\s+/) //split on spaces
        messageParts.pop() //remove the last item (same as lastValue)
        formattedMessage = `${messageParts.join(' ')} and ${lastValue}`
    }
    else{ formattedMessage = lastValue }
    return formattedMessage
}

async function handleMassDBEntryRemoval(interaction, embedMessage, array, deleteFunction, removalType){
    if(!array){ return null }

    let removedEntries = []
    let removedEntriesArrayMessage = ""
    let messageContext = removalType
    await Promise.all(array.map(async (item) => {
        //make serverlog if removed notes, otherwise ignore
        if(removalType == "noteId"){ 
            const newLog = await createServerLogInDB(interaction.user.id, item.discordUserId, LogEventTypes.NOTE_DELETED, { 
                //details object
                usernote: item.note,
                usernoteId: item.noteId
            })
            await serverLogLogger(interaction, newLog)
        }

        //delete bulkDeletionMessageFile, if exists
        const deletedFileField = item?.details?.bulkDeleteMessagesFile ?? null
        if(deletedFileField){ await removeBulkDeletionMessageFile(deletedFileField) }
        
        const entryId = item[messageContext]
        const entryRemoved = await deleteFunction(entryId)
        if(entryRemoved){ 
            removedEntries.push(entryId)
            removedEntriesArrayMessage += `${entryId}, `
        }
    }))
    const removedEntriesMessage = await formatEntriesArrayMessage(removedEntries, removalType, removedEntriesArrayMessage)
    const loggingChannel = interaction.guild.channels.cache.get(process.env.LOGGING_CHANNEL_ID)
    if(removedEntries.length >= 2){ messageContext += "s" }

    await embedMessage.edit({ content: `Successfully deleted ${messageContext} ${removedEntriesMessage}.`, embeds: [], components: [], files: [] })
    await loggingChannel.send({ content: `<@${interaction.user.id}> successfully deleted ${messageContext} ${removedEntriesMessage}.`, embeds: [], components: [] })
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
            case "archive": messageContext = "activating Archival task"; break
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

export async function convertMinutesToString(inputMinutes, noBrackets){
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
    
    if(noBrackets){ return `${resultTime}` || '0 minutes' }
    return ` (${resultTime}) ` || '0 minutes'
}

async function formatDateToLocaleString(date, timeType){
    if(!date){ return null }

    //start with year, month and day
    let formatOptions = { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
    } 
    
    //add hours and minutes if needed
    if(timeType == "long"){ 
        formatOptions = { 
            ...formatOptions, 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true 
        } 
    }
    return new Date(date).toLocaleString('en-GB', { ...formatOptions })
}

async function validateFutureTimestamp(isoString){
    const targetTime = new Date(isoString)
    const now = new Date()

    return targetTime > now ? targetTime : null
}

async function getTimeRemainingString(targetIsoString) {
    const target = new Date(targetIsoString)
    const now = new Date()
    const diffMs = target - now

    if(diffMs <= 0){ return null }

    const minutesRemaining = Math.floor(diffMs / 1000 / 60)
    return `${minutesRemaining} minutes${await convertMinutesToString(minutesRemaining)}`
}

async function handleSubcommandDBRemoval(interaction, subcommandIdArg, subcommandGroup, getFromDBFunction, removeFromDBFunction){
    const entryIdArg = interaction.options.getString(subcommandIdArg)
    let removeMultipleEntries = false
    let entriesArrayMessage = ""
    let invalidEntriesArrayMessage = ""
    let foundEntriesArray = []
    let embedMessage
    let foundEntry

    let subcommandMessageContext
    let subcommandMessageContextId
    if(subcommandIdArg == "noteid"){ 
        subcommandMessageContext = "Note"
        subcommandMessageContextId = "noteId" 
    }
    else if(subcommandIdArg == "logid"){ 
        subcommandMessageContext = "Log"
        subcommandMessageContextId = "logId"
    }
    
    //multi-note removal
    if(entryIdArg.includes(",")){ 
        removeMultipleEntries = true
        const entryIdArray = entryIdArg.split(",").map(id => id.trim())
        const uniqueEntryIds = [...new Set(entryIdArray)]
        let invalidEntriesArray = []
        let embedMessageContent = `**Do you want to remove these ${subcommandMessageContext}s?**`
        if(entryIdArray.includes("")){ await interaction.editReply(`Argument contains invalid number. Please provide only valid ${subcommandMessageContext} IDs.`); return }
        
        //loop through all provided entries
        for(const entryId of uniqueEntryIds) {
            const foundEntry = await getFromDBFunction(null, entryId)
            if(!foundEntry || isNaN(Number(entryId))){ //invalid entries
                invalidEntriesArray.push(entryId)
                invalidEntriesArrayMessage += `${entryId}, `
                continue
            }

            //valid entries
            foundEntriesArray.push(foundEntry)
            entriesArrayMessage += `${foundEntry[subcommandMessageContextId]}, `
        }
        
        //handle invalid notes
        if(!foundEntriesArray[0]){ await interaction.editReply(`None of these ${subcommandMessageContext} IDs exist, please provide valid ${subcommandMessageContext} IDs to remove.`); return }
        let foundNotesMessageContext = `this valid ${subcommandMessageContext}`
        if(foundEntriesArray.length >= 2){ foundNotesMessageContext = `these valid ${subcommandMessageContext}s` }
        
        invalidEntriesArrayMessage = await formatEntriesArrayMessage(invalidEntriesArray, subcommandMessageContextId, invalidEntriesArrayMessage)
        if(invalidEntriesArray[0]){
            if(invalidEntriesArray.length >= 2){ embedMessageContent = `These ${subcommandMessageContext} IDs don't exist: ${invalidEntriesArrayMessage}.\n **Do you want to remove ${foundNotesMessageContext} instead?**` }
            else{ embedMessageContent = `${subcommandMessageContext} ID ${invalidEntriesArrayMessage} does not exist.\n**Do you want to remove ${foundNotesMessageContext} instead?**` }
        }

        //create embedOptions object
        let embedOptions = { 
            content: embedMessageContent,
            components: [], 
            files: [] 
        }
        
        //create paged embed, then edit embed to have yes/no buttons
        await handlePageEmbed(interaction, foundEntriesArray, removeMultipleEntries, subcommandGroup)
        entriesArrayMessage = await formatEntriesArrayMessage(foundEntriesArray, subcommandMessageContextId, entriesArrayMessage)
        if(currentComponents){ embedOptions.components = [...currentComponents, booleanActionRow] }
        else{ embedOptions.components = [booleanActionRow] }
        
        //add file attachment, if exists
        const deletedFileField = foundEntry?.details?.bulkDeleteMessagesFile ?? null
        await handleFileAttachmentAdding(deletedFileField, embedOptions)
        
        embedMessage = await interaction.editReply(embedOptions)
    }

    //check if singular note exists
    else{
        foundEntry = await getFromDBFunction(null, entryIdArg)
        if(!foundEntry){ interaction.editReply(`This ${subcommandMessageContext} ID does not exist.`); return }
        
        //create embed for subcommandGroup
        let embedOptions = { 
            content: `**Are you sure you want to remove this ${subcommandMessageContext}?**`,
            embeds: [],
            components: [booleanActionRow], 
            files: [] 
        }
        if(subcommandGroup == "userNote"){ embedOptions.embeds = [await createUserNoteEmbed(foundEntry, "view")] }
        else if(subcommandGroup == "serverLog"){ embedOptions.embeds = [await createServerLogEmbed(interaction, foundEntry, "view")] }
        
        //add file attachment, if exists
        const deletedFileField = foundEntry?.details?.bulkDeleteMessagesFile ?? null
        await handleFileAttachmentAdding(deletedFileField, embedOptions)

        embedMessage = await interaction.editReply(embedOptions)
    }
    
    //run button handler (collector)
    const filter = i => i.customId === 'yesButton' || i.customId === 'noButton'
    const collector = embedMessage.createMessageComponentCollector({ filter, max:1, time:15000 })
    collector.on('collect', async i => {
        if(!removeMultipleEntries){ await i.deferUpdate() }
        if(i.customId === 'noButton'){
            if(removeMultipleEntries){ await embedMessage.edit({ content: `Cancelled removing ${subcommandMessageContextId}s ${entriesArrayMessage}.`, embeds: [], components: [], files: [] }) }
            else{ await i.editReply({ content: `Cancelled removing ${subcommandMessageContextId} ${entryIdArg}.`, embeds: [], components: [], files: [] }) }
            return
        }
        else if(i.customId === 'yesButton'){
            try{ 
                //remove multiple notes from database
                if(removeMultipleEntries){
                    handleMassDBEntryRemoval(interaction, embedMessage, foundEntriesArray, removeFromDBFunction, subcommandMessageContextId)
                    return
                }
                //remove singular note from database
                //and only create serverlog if noteid was deleted
                else{
                    const entryDeleted = await removeFromDBFunction(entryIdArg)
                    if(entryDeleted){ 
                        await i.editReply({ content: `Successfully deleted ${subcommandMessageContextId} ${entryIdArg}.`, embeds: [], components: [] })
                        if(subcommandMessageContextId == "noteId"){ 
                            const newLog = await createServerLogInDB(interaction.user.id, foundEntry.discordUserId, LogEventTypes.NOTE_DELETED, { 
                                //details object
                                usernote: foundEntry.note,
                                usernoteId: foundEntry.noteId
                            })
                            await serverLogLogger(interaction, newLog)
                        }
                        //remove bulkDeleteMessageFile if exists
                        if(foundEntry.details.bulkDeleteMessagesFile){ await removeBulkDeletionMessageFile(foundEntry.details.bulkDeleteMessagesFile) }
                    }
                }
            }
            catch(error){ 
                console.error(error)
                if(removeMultipleEntries){ await embedMessage.edit({ content: `There was an error deleting ${subcommandMessageContextId}s ${entriesArrayMessage}, please try again or contact the owner.`, embeds: [], components: [], files: [] }) }
                else{ await i.editReply({ content: `There was an error deleting ${subcommandMessageContextId} ${entryIdArg}, please try again or contact the owner.`, embeds: [], components: [], files: [] }) }
            }
        }
    })
    //on collector timer's end
    collector.on('end', async (collected) => {
        if(collected.size === 0){ 
            if(removeMultipleEntries){ await embedMessage.edit({ content: `Cancelled removing ${subcommandMessageContextId}s ${entriesArrayMessage}.`, embeds: [], components: [], files: [] }) }
            else{ await embedMessage.edit({ content: `Cancelled removing ${subcommandMessageContextId} ${entryIdArg}.`, embeds: [], components: [], files: [] }) }
        }
        return
    })
}

async function handleFileAttachmentAdding(deletedFileField, embedOptionsObject){
    //add file attachment, if exists
    if(deletedFileField){
        let filePath = path.resolve(__dirname, "../../misc/deletedBulkMessages", deletedFileField)
        if(fs.existsSync(filePath)){ embedOptionsObject.files = [new AttachmentBuilder(filePath)] }
    }
}

export async function removeBulkDeletionMessageFile(fileName){
    const filePath = path.resolve(__dirname, "../../misc/deletedBulkMessages", fileName)
    try{ 
        await fs.promises.unlink(filePath)
        console.log("Removed Bulk Deletion Message File:", fileName)
    }
    catch(error){
        if(error.code === "ENOENT"){ console.error("File not found:", filePath) } 
        else{ console.error("Error deleting file:", error) }
    }
}

//metadata
export const commandMetadata = {
    name: "mod",
    category: "Moderation",
    type: "group",
    permissions: ["MODERATOR"],
    description: "Moderation commands!!",
    subcommandGroups: {
        usernote: {
            type: "group",
            permissions: ["MODERATOR"],
            description: "Add/Remove/View notes made, or make notes on Users.",
            subcommands: {
                add: {
                    permissions: ["MODERATOR"],
                    usage: "/mod usernote add <user> <note>",
                    examples: ["/mod usernote add @stinkyGoober This guy is really stinky"],
                    description: "Add a note to a User."
                },
                remove: {
                    permissions: ["MODERATOR"],
                    usage: "/mod usernote remove <noteId>",
                    examples: [
                        "/mod usernote remove 12",
                        "/mod usernote remove 34,35,36,40,42,58"
                    ],
                    description: "Remove one or more notes, using note ID(s). Multiple removals = noteId seperated by comma."
                },
                view: {
                    permissions: ["MODERATOR"],
                    usage: "/mod usernote view <user> <noteId>",
                    examples: [
                        "/mod usernote view @stinkyGoober",
                        "/mod usernote view 12",
                    ],
                    description: "View notes on a specific User, or specific note using noteId."
                },
                "view-all": {
                    permissions: ["MODERATOR"],
                    usage: "/mod usernote view-all",
                    description: "View all notes currently stored in the database."
                }
            }
        },
        logs: {
            type: "group",
            permissions: ["MODERATOR"],
            description: "Remove/View categorized Server Logs.",
            subcommands: {
                remove: {
                    permissions: ["ADMIN"],
                    usage: "/mod logs remove <noteId>",
                    examples: [
                        "/mod logs remove 12",
                        "/mod logs remove 34,35,36,40,42,58"
                    ],
                    description: "Remove one or more logs, using log ID(s). Multiple removals = noteId seperated by comma."
                },
                view: {
                    permissions: ["MODERATOR"],
                    usage: "/mod logs view <user> <affectedUser> <eventType> <detail> <detailValue> <limit> <logId> <archived>",
                    examples: [
                        "/mod logs view user:@stinkyGoober eventType:Member Join",
                        "/mod logs view eventtype:Member Ban detail:Reason detailvalue:Stinky limit:50",
                        "/mod logs view user:@randomModerator affectedUser:@stinkyGoober archived:True"
                    ],
                    description: "View filtered Server Logs using filters."
                },
                "view-all": {
                    permissions: ["MODERATOR"],
                    usage: "/mod logs view-all <archived>",
                    examples: [
                        "/mod logs view-all",
                        "/mod logs view-all true"
                    ],
                    description: "View all logs currently stored in the database."
                },
                archive: {
                    permissions: ["ADMIN"],
                    usage: "/mod logs archive",
                    description: "Run the Server Logs Archival task NOW (instead of on its regular schedule)."
                },
                unarchive: {
                    permissions: ["ADMIN"],
                    usage: "/mod logs unarchive <logId>",
                    examples: ["/mod logs unarchive 34"],
                    description: "Pull an Archived Server Log back into the unarchived (this also resets its time-to-archive)!"
                }
            }
        }
    },
    subcommands: {
        ban: {
            permissions: ["MODERATOR"],
            usage: "/mod ban <user> <reason>",
            examples: ["/mod ban @stinkyGoober Breaking rules"],
            description: "Bans a user from the server."
        },
        unban: {
            permissions: ["MODERATOR"],
            usage: "/mod unban <userId>",
            examples: ["/mod unban 123456789"],
            description: "Unbans a user from the server."
        },
        kick: {
            permissions: ["MODERATOR"],
            usage: "/mod kick <user> <reason>",
            examples: ["/mod kick @stinkyGoober Being annoying"],
            description: "Kicks a user from the server."
        },
        timeout: {
            permissions: ["MODERATOR"],
            usage: "/mod timeout <user> <minutes> <reason>",
            examples: ["/mod timeout @stinkyGoober 60 Spamming chat"],
            description: "Timeout a user for the given duration (in minutes)."
        },
        untimeout: {
            permissions: ["MODERATOR"],
            usage: "/mod untimeout <user>",
            examples: ["/mod untimeout @stinkyGoober"],
            description: "Removes timeout given to specified user."
        },
    }
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
                        .setDescription('View notes on a specific User, or specific note using noteId.')
                        .addUserOption(option => 
                            option
                                .setName('user')
                                .setDescription("User to view notes on."))
                        .addStringOption(option => 
                            option
                                .setName('noteid')
                                .setDescription('Note ID to view (overrides user filter).'))
                )
                //view-all usernote subcommand
                .addSubcommand(subcommand => 
                    subcommand
                        .setName('view-all')
                        .setDescription('View all notes in existence ever.')
                )
        )
        //logs subcommand group
        .addSubcommandGroup(group =>
            group
                .setName('logs')
                .setDescription('Remove/View categorized Server Logs.')
                //remove logs subcommand
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('remove')
                        .setDescription("Remove one or more logs, using log ID(s).")
                        .addStringOption(option =>
                            option
                                .setName('logid')
                                .setDescription("Log ID(s) to remove (multiple = seperated by comma).")
                                .setRequired(true))
                )
                //view logs subcommand
                .addSubcommand(subcommand => 
                    subcommand
                        .setName('view')
                        .setDescription('View filtered Server Logs using filters.')
                        .addUserOption(option =>
                            option
                                .setName('user')
                                .setDescription('User that used the command, or self if no other User was affected (optional).'))
                        .addUserOption(option =>
                            option
                                .setName('affecteduser')
                                .setDescription('User Affected by the command (optional).'))
                        .addStringOption(option =>
                            option
                                .setName('eventtype')
                                .setDescription('Type of Event to view Logs of (optional).')
                                .addChoices(
                                    { name: 'Member Join', value: LogEventTypes.MEMBER_JOIN },
                                    { name: 'Member Leave', value: LogEventTypes.MEMBER_LEAVE },
                                    { name: 'Member Kick', value: LogEventTypes.MEMBER_KICK },
                                    { name: 'Member Ban', value: LogEventTypes.MEMBER_BAN },
                                    { name: 'Timeout Add', value: LogEventTypes.MEMBER_TIMEOUT_ADD },
                                    { name: 'Timeout Remove', value: LogEventTypes.MEMBER_TIMEOUT_REMOVE },
                                    { name: 'Message Edited', value: LogEventTypes.MESSAGE_EDIT },
                                    { name: 'Message Deleted', value: LogEventTypes.MESSAGE_DELETE },
                                    { name: 'Messages Bulk Deleted', value: LogEventTypes.MESSAGE_DELETE_BULK },
                                    { name: 'Invite Created', value: LogEventTypes.INVITE_CREATE },
                                    { name: 'Invite Deleted', value: LogEventTypes.INVITE_DELETE },
                                    { name: 'VRChat Linked', value: LogEventTypes.VRC_LINKED },
                                    { name: 'VRChat Unlinked', value: LogEventTypes.VRC_UNLINKED },
                                    { name: 'Usernote Deleted', value: LogEventTypes.NOTE_DELETED }
                                ))
                        .addStringOption(option =>
                            option
                                .setName('detail')
                                .setDescription('Filter Logs by specific detail (optional).')
                                .addChoices( //NOTE: remember to add new detailKey to allowedDetailKeys in getServerLogInDB() function in dbHandling.js when adding new filter here
                                    { name: 'Account Created At', value: 'accountCreatedAt' },
                                    { name: 'Timeout Length', value: 'timeoutLength' },
                                    { name: 'Timeout Remaining', value: 'timeoutRemaining' },
                                    { name: 'Deleted Message', value: 'deletedMessage' },
                                    { name: 'Original Message', value: 'editedMessageOriginal' },
                                    { name: 'Edited Message', value: 'editedMessageEdit' },
                                    { name: 'Bulk Deleted Messages File Name', value: 'bulkDeleteMessagesFile' },
                                    { name: 'Bulk Deleted Messages Preview', value: 'bulkDeleteMessagesPreview' },
                                    { name: 'Bulk Deleted Messages Amount', value: 'bulkDeleteMessagesCount' },
                                    { name: 'Invite Code', value: 'inviteCode' },
                                    { name: 'Invite Channel', value: 'inviteChannel' },
                                    { name: 'Invite Max Age', value: 'inviteMaxAge' },
                                    { name: 'Invite Max Uses', value: 'inviteMaxUses' },
                                    { name: 'Invite Temporary', value: 'inviteTemporary' },
                                    { name: 'VRChat User ID', value: 'vrcUserId' },
                                    { name: 'Usernote Note', value: 'usernote' },
                                    { name: 'Usernote ID', value: 'usernoteId' },
                                    { name: 'Reason', value: 'reason' }
                                ))
                        .addStringOption(option =>
                            option
                                .setName('detailvalue')
                                .setDescription('Value for the chosen detail filter (optional, only use if "detail" is selected).')
                        )
                        .addIntegerOption(option =>
                            option
                                .setName('limit')
                                .setDescription('How many Logs to fetch (default 25, max 200).')
                                .setMinValue(1)
                                .setMaxValue(200))
                        .addStringOption(option =>
                            option
                                .setName('logid')
                                .setDescription('Log ID to view (overrides other filters).'))
                        .addBooleanOption(option =>
                            option
                                .setName('archived')
                                .setDescription('View only Archived Logs (optional).'))
                )
                //view-all logs subcommand
                .addSubcommand(subcommand => 
                    subcommand
                        .setName('view-all')
                        .setDescription('View all logs in existence ever.')
                        .addBooleanOption(option =>
                            option
                                .setName('archived')
                                .setDescription('View only Archived Logs (optional).'))
                )
                //archive logs subcommand
                .addSubcommand(subcommand => 
                    subcommand
                        .setName('archive')
                        .setDescription('Run the Server Logs Archival task NOW (instead of on its regular schedule).')
                )
                //unarchive logs subcommand
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('unarchive')
                        .setDescription('Pull an Archived Server Log back into the living (this also resets its time-to-archive)!')
                        .addStringOption(option =>
                            option
                                .setName('logid')
                                .setDescription('Log ID to unarchive.')
                                .setRequired(true))
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

    //TODO: add check for if user has moderator or admin permission
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
                await loggingChannel.send({ content: "", embeds: [userNoteEmbed] })
            }
            //usernote remove subcommand
            if(subcommand === "remove"){
                handleSubcommandDBRemoval(interaction, "noteid", "userNote", getUserNoteInDB, removeUserNoteInDB)
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
                    await handlePageEmbed(interaction, allUserNotes, false, "userNote")
                }

                //no arguments given
                else{ await interaction.editReply("Please provide a User or NoteID to view.") }
            }
            //usernote view-all subcommand
            if(subcommand === "view-all"){
                let allUserNotesInDb = await getAllUserNotesInDB()
                if(!allUserNotesInDb[0]){ await interaction.editReply('There are no notes currently stored. To store a note on a User, use the `/mod usernote add @ping "noteHere"` command.'); return }
                await interaction.editReply("This might take a while, please be patient, and do not run the command again until this message changes.")
                await handlePageEmbed(interaction, allUserNotesInDb, false, "userNote")
            }
        }

        //logs subcommandGroup
        if(subcommandGroup === "logs"){
            //logs remove subcommand
            if(subcommand === "remove"){
                if(!interaction.member.roles.cache.has(process.env.ADMIN_ROLE_ID)){ await interaction.editReply("You do not have permission to activate this command. If it is urgent, please contact an admin."); return }
                handleSubcommandDBRemoval(interaction, "logid", "serverLog", getServerLogInDB, removeServerLogInDB)
            }
            //logs view subcommand
            if(subcommand === "view"){
                const logIdArg = interaction.options.getString("logid")
                const detailArg = interaction.options.getString("detail")
                const detailValueArg = interaction.options.getString("detailvalue")
                const eventTypeArg = interaction.options.getString("eventtype")
                const affectedUserArg = interaction.options.getUser("affecteduser")
                const userArg = interaction.options.getUser("user")
                const limitArg = interaction.options.getInteger("limit") || 25
                const archivedArg = interaction.options.getBoolean("archived")

                //logId is more weighted, as it only displays one server log
                if(logIdArg){ 
                    let foundServerLog = await getServerLogInDB(null, logIdArg)
                    if(!foundServerLog){ await interaction.editReply("This Server Log ID does not exist."); return }
                    
                    //send server log embed
                    let serverLogEmbed = await createServerLogEmbed(interaction, foundServerLog, "view")
                    let embedOptions = { 
                        content: "",
                        embeds: [serverLogEmbed],
                        files: []
                    }

                    //add file attachment, if exists, then send serverLogEmbed
                    const deletedFileField = foundServerLog?.details?.bulkDeleteMessagesFile ?? null
                    await handleFileAttachmentAdding(deletedFileField, embedOptions)
                    await interaction.editReply(embedOptions) //flags: MessageFlags.Ephemeral 
                    return
                }

                //if detailValue is selected without detail, return
                if(!detailArg && detailValueArg){
                    await interaction.editReply("Please provide the Detail filter to use Detail Value.")
                    return
                }

                //if nothing is selected, return
                if(!detailArg && !detailValueArg && !eventTypeArg && !affectedUserArg && !userArg && !archivedArg){
                    await interaction.editReply("Please provide at least one filter (User, Affected User, Event Type, Detail, or Archived) to view filtered Logs.")
                    return
                }

                //otherwise, get all of the categorized server logs, and display them in a paginated embed
                let details = null
                if(detailArg && detailValueArg){ details = { [detailArg]: detailValueArg } }
                else if(detailArg){ details = { [detailArg]: null } }
                
                const allFoundLogs = await getServerLogInDB(
                    userArg?.id || null,
                    null,
                    affectedUserArg?.id || null,
                    eventTypeArg || null,
                    details,
                    limitArg,
                    archivedArg
                )
                if(!allFoundLogs || allFoundLogs.length === 0){
                    await interaction.editReply("No matching logs were found.")
                    return
                }

                //set pageEmbedType to be normal or archived
                let pageEmbedType = "serverLog"
                if(archivedArg){ pageEmbedType = "archivedServerLog" }
                
                await interaction.editReply("Fetching filtered Logs, this might take a while. Please be patient, and do not run the command again until this message changes.")
                await handlePageEmbed(interaction, allFoundLogs, false, pageEmbedType)
            }
            //logs view-all subcommand
            if(subcommand === "view-all"){
                let allLogs
                let pageEmbedType
                let errorMessage
                if(interaction.options.getBoolean("archived")){ 
                    allLogs = await getAllArchivedServerLogsInDB()
                    pageEmbedType = "archivedServerLog-all"
                    errorMessage = "There are no Archived Server Logs currently stored. Archived Logs will be made when a Server Log is archived (logs will be archived after existing for 90 days)."
                }
                else{ 
                    allLogs = await getAllServerLogsInDB()
                    pageEmbedType = "serverLog-all"
                    errorMessage = "There are no Server Logs currently stored. Logs will be made when a Server Event is triggered (eg. when a user joins/leaves the server)."
                }

                if(!allLogs[0]){ await interaction.editReply(errorMessage); return }
                await interaction.editReply("This might take a while. Please be patient, and do not run the command again until this message changes.")
                await handlePageEmbed(interaction, allLogs, false, pageEmbedType)
            }
            //logs archive subcommand
            if(subcommand === "archive"){
                if(!interaction.member.roles.cache.has(process.env.ADMIN_ROLE_ID)){ await interaction.editReply("You do not have permission to activate this command. If it is urgent, please contact an admin."); return }
                
                //confirmation button before activating archival task
                const confirmationMessage = await interaction.editReply({ content: "Are you sure you want to activate the Archival task *now*?", components: [booleanActionRow] })
                const confirmationResult = await handleConfirmationMessage(confirmationMessage, interaction.user, subcommand)

                if(confirmationResult === true){
                    try{ 
                        const archivalResult = await runServerLogArchivalTask()
                        await interaction.editReply(`Server Logs Archival task has been executed manually.\nArchived: ${archivalResult.archived}\nDeleted: ${archivalResult.deleted}`)
                    }
                    catch(error){
                        console.error("Error running Server Logs Archvial task: ", error)
                        await interaction.editReply("Failed to run Server Logs Archival task! Please check the console for more info.")
                    }
                }
            }
            //logs unarchive subcommand
            if(subcommand === "unarchive"){
                const logId = interaction.options.getString('logid')
                if(!interaction.member.roles.cache.has(process.env.ADMIN_ROLE_ID)){ await interaction.editReply("You do not have permission to activate this command. If it is urgent, please contact an admin."); return }
                
                try{
                    const isLogArchived = await getServerLogInDB(null, logId, null, null, null, null, true)
                    if(!isLogArchived){ await interaction.editReply("Provided LogID is not archived, please provide a valid archived Server Log to unarchive."); return }
                    const restoredLogId = await unarchiveServerLog(logId)
                    await interaction.editReply(`Successfully restored log ${restoredLogId}`)
                }
                catch(error){ 
                    console.error("Error restoring Archived Server Log: ", error)
                    await interaction.editReply(`There was an error restoring ${logId}. Please check the console for more info.`)
                }
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

            if(userArg.id === process.env.CLIENT_ID){ interaction.editReply(`You can't ${subcommand} me using myself, silly...`); return }
            if(userArg === interaction.user){ interaction.editReply(`You can't ${subcommand} yourself, silly~`); return}
            if(!userArg){ interaction.editReply(`Please provide a valid User to ${subcommand}.`); return }
            if(!reasonArg){ interaction.editReply(`Please provide a reason for ${messageContext1} this User.`); return }

            let dmMessage = `Heyo ${userArg}, \nYou have been ${messageContext2} from ${interaction.guild.name} for reason: "${reasonArg}". \n\nIf you believe this was a mistake, please contact one of the Admins of the above Server to assist in an appeal.`
            const confirmationMessage = await interaction.editReply({ content: `Do you want to ${subcommand} ${userArg} for "${reasonArg}"?`, components: [booleanActionRow] })
            const confirmationResult = await handleConfirmationMessage(confirmationMessage, userArg, subcommand)
            
            if(confirmationResult === true){ 
                try{ 
                    const guildMemberToRemove = await interaction.guild.members.fetch(userArg.id).catch(() => null)
                    await guildMemberToRemove.send(dmMessage).catch(() => { console.log(`Error in DMing banned/kicked user reason for ban/kick.`) })
                    if(subcommand === "ban"){ await interaction.guild.members.ban(userArg, {reason: `${interaction.user.id} | ${reasonArg}`}) }
                    else if(subcommand === "kick"){ guildMemberToRemove.kick(`${interaction.user.id} | ${reasonArg}`) }
                    await interaction.editReply(`Successfully ${messageContext2} ${userArg} for "${reasonArg}".`) 
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
            const [userId, ...rest] = (bannedUser.reason).split(' | ')
            let newBanReason = rest.join(' | ')
            if(!newBanReason){    
                //check latest ban that happened to this user
                //NOTE: this may need a limit, or may not find ban in audit log if its too far back
                const auditLog = await interaction.guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd })
                const banLog = auditLog.entries.find(log => log.target.id === userArg)
                newBanReason = banLog.reason
            }

            const confirmationMessage = await interaction.editReply({ content: `Do you want to unban ${userToUnban}? \nUser was previous banned for "${newBanReason}"`, components: [booleanActionRow] })
            const confirmationResult = await handleConfirmationMessage(confirmationMessage, userToUnban, "unban")

            if(confirmationResult === true){
                try{
                    await interaction.guild.members.unban(userToUnban)
                    await interaction.editReply(`Unbanned ${userToUnban}.`)
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
            
            if(userArg.id === process.env.CLIENT_ID){ interaction.editReply("You can't time me out using myself, silly..."); return }
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
                    
                    //add server log to db, and send copy of log to logging channel
                    const newLog = await createServerLogInDB(interaction.user.id, userArg.id, LogEventTypes.MEMBER_TIMEOUT_ADD, {
                        //details object
                        timeoutLength: `${lengthArg} minutes${convertedTime}`,
                        reason: reasonArg
                    })
                    await serverLogLogger(interaction, newLog)
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
        if(subcommand === "untimeout"){
            const userArg = interaction.options.getUser('user')
            const guildMember = await interaction.guild.members.cache.get(userArg.id)
            const timeoutEnd = await guildMember.communicationDisabledUntil
            const convertedTimeoutEnd = await validateFutureTimestamp(timeoutEnd)
            
            if(!userArg){ interaction.editReply("Please provide a valid User to remove timeout from."); return }
            if(!convertedTimeoutEnd){ interaction.editReply('User is not currently timed out. \nTo timeout a User, use the "/mod timeout" slashcommand.'); return }
            
            let timeoutServerLog = await getServerLogInDB(null, null, userArg.id, "MEMBER_TIMEOUT_ADD")
            timeoutServerLog = timeoutServerLog[timeoutServerLog.length - 1]
            const timeoutReason = timeoutServerLog.details.reason
            const timeoutRemaining = await getTimeRemainingString(timeoutEnd)
            
            const confirmationMessage = await interaction.editReply({ content: `${userArg}'s timeout ends ${time(timeoutEnd, TimestampStyles.RelativeTime)}. \nThey were timed out for "${timeoutReason}". \nDo you want to remove their timeout?`, components: [booleanActionRow] })
            const confirmationResult = await handleConfirmationMessage(confirmationMessage, userArg, "untimeout")
        
            if(confirmationResult === true){
                try{
                    await guildMember.timeout(null)
                    await interaction.editReply(`Removed timeout from ${userArg}.`)
                    const newLog = await createServerLogInDB(interaction.user.id, userArg.id, LogEventTypes.MEMBER_TIMEOUT_REMOVE, {
                        //details object
                        timeoutRemaining: timeoutRemaining,
                        reason: timeoutReason
                    })
                    await serverLogLogger(interaction, newLog)
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