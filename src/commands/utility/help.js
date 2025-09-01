//imports
import dotenv from 'dotenv'
import { EmbedBuilder, SlashCommandBuilder } from 'discord.js'
import { flattenMetadata, getAllSubcommandMetadata } from '../../misc/metadataHandler.js'
dotenv.config()

async function determineUserPermission(member) {
    if(member.roles.cache.has(process.env.ADMIN_ROLE_ID) || member.id === process.env.BOT_MANAGER_ID){ return "ADMIN" }
    else if(member.roles.cache.has(process.env.MOD_ROLE_ID)){ return "MODERATOR" }
    return "USER"
}

async function hasPermission(userPerms, requiredPerms) {
  const userArray = Array.isArray(userPerms) ? userPerms : [userPerms]
  const requiredArray = Array.isArray(requiredPerms) ? requiredPerms : [requiredPerms]
  const userLevel = Math.max(...userArray.map(p => PERMISSION_HIERARCHY[p] ?? -1))

  return requiredArray.some(req => userLevel >= (PERMISSION_HIERARCHY[req] ?? -1))
}

const PERMISSION_HIERARCHY = {
    USER: 0,
    MODERATOR: 1,
    ADMIN: 2
}

//metadata
export const commandMetadata = {
    name: "help",
    category: "Utility",
    usage: "/help <command>",
    examples: [
        "/help ping",
        "/help vrchat link"
    ],
    description: "Shows the help menu for all commands (or specific command)."
}

//export
export default {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription("Shows the help menu for all commands.")
        .addStringOption(option =>
            option
                .setName('command')
                .setDescription('Get details about specific command (or specific command).')
        ),
    cooldown: 5,

    //runs the command
    async execute(interaction) {
        const commandArg = interaction.options.getString("command")
        const entries = await getAllSubcommandMetadata()
        const metadataMap = await flattenMetadata(entries)
        const userHighestPermission = await determineUserPermission(interaction.member)
        let helpEmbed
        await interaction.deferReply() //{ flags: MessageFlags.Ephemeral } //TODO: add this in production
        
        //fetch all major commands, and organize into embed
        if(!commandArg){
            //group commands by category
            const categories = {}
            const topLevelCommands = [...metadataMap.values()].filter(meta => !meta.name.includes(" "))
            for(const command of topLevelCommands){
                if(await hasPermission(userHighestPermission, command.permissions)){
                    if(!categories[command.category]){ categories[command.category] = [] }
                    categories[command.category].push(command)
                }
            }

            //create help menu embed
            helpEmbed = new EmbedBuilder()
                .setColor('Greyple')
                .setTitle(`Help Menu - All Major Commands`)
                .addFields(
                    Object.entries(categories).map(([category, commands]) => ({
                        name: category,
                        value: commands.map(command => `\`/${command.name}\` - ${command.description}`).join("\n"),
                        inline: false
                    }))
                )
        }

        if(!helpEmbed){
            //if specified command doesn't exist, return
            const metadata = metadataMap.get(commandArg.toLowerCase())
            if(!metadata){ await interaction.editReply(`No help data found for \`${commandArg}\`.`); return }

            //if user has admin permission, ignore permission checks
            const requiredPermissions = metadata.permissions
            const userHasPermission = await hasPermission(userHighestPermission, requiredPermissions)
            if(!userHasPermission){ await interaction.editReply("You do not have permission to view this comamnd."); return }

            //organize and fetch data
            let commandExamples = ""
            let commandSubcommands = ""
            let commandSubcommandGroups = ""
            if(metadata.examples?.length){ commandExamples += `${metadata.examples.map(e => `- \`${e}\``).join("\n")}` }
            if(metadata.subcommands?.length){ 
                for(const sub of metadata.subcommands){
                    //if user doesn't have fetched permission, group/subcommand won't appear
                    if(await hasPermission(userHighestPermission, sub.permissions)){
                        if(sub.type === "group"){ commandSubcommandGroups += `\`${sub.name}\`: ${sub.description}\n` } 
                        else{ commandSubcommands += `\`${sub.name}\`: ${sub.description}\n` }
                    }
                }
            }

            //create help menu embed
            helpEmbed = new EmbedBuilder()
                .setColor('Greyple')
                .setTitle(`Help Menu - /${metadata.name}`)
                .addFields(
                    { name: "Description", value: metadata.description, inline: true },
                    { name: "Category", value: metadata.category, inline: true },
                    ...(commandSubcommands ? [{ name: `Subcommands`, value: commandSubcommands }] : []),
                    ...(commandSubcommandGroups ? [{ name: `Subcommand Groups`, value: commandSubcommandGroups }] : []),
                    ...(metadata.usage ? [{ name: "Usage", value: `\`${metadata.usage}\``}] : []),
                    ...(commandExamples ? [{ name: `Examples`, value: commandExamples }] : []),
                )
        }

        await interaction.editReply({ content: '', embeds: [helpEmbed] })
    }
}