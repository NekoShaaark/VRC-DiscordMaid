//imports
const getFiles = require('@/getFiles')
const { EmbedBuilder } = require('discord.js') 


//export
module.exports = (message) => {
    
    //variables & commands
    const commands = {}
    const categorizedCommands = {}

    const commandFiles = getFiles('commands', '.js')
    const userContent = message.content.split(' ')
    const allCommandsEmbed = new EmbedBuilder()
        .setTitle('Help Menu - All Commands')
        .setColor(0x00AE86)


    //loop through all files to find commands
    for(const command of commandFiles){
        let commandFile = require(command)
        const configName = commandFile.config.commandName
        const configCategory = (commandFile.config.category).toLowerCase()
        
        //configName = {config data}
        commands[configName] = commandFile.config
        categorizedCommands[configCategory]

        //create category if doesn't exist, then sort commands into respective categories
        if(configCategory){
            if(!categorizedCommands[configCategory]){ categorizedCommands[configCategory] = {} }
            categorizedCommands[configCategory][configName] = commandFile.config
        }
    }


    //create general help menu embed
    for(const [category, commands] of Object.entries(categorizedCommands)){
        let commandsList = ''
        
        for(const command of Object.values(commands)){
            commandsList += `• \`${command.commandName}\` — ${command.description}\n`
        }

        allCommandsEmbed.addFields({ 
            name: `__${category.charAt(0).toUpperCase() + category.slice(1)}__`,
            value: commandsList
        })
    }


    //create dynamic help menu embed
    if(userContent[1]){
        let foundCommand = {};

        //if first arg (userContent[1]) isn't a category, then search for command
        if(!categorizedCommands[userContent[1]]){
            for(const category of Object.values(categorizedCommands)){
                for(const [key, command] of Object.entries(category)){
                    foundCommand[key] = command
                    if(command.aliases){
                        for(const alias of command.aliases){
                            foundCommand[alias] = command
                        }
                    }
                }
            }
        

            //create and send dynamic (found command) embed
            const foundCommandConfig = foundCommand[userContent[1]]
            const dynamicCommandEmbed = new EmbedBuilder()
                .setTitle(`Help Menu - ${foundCommandConfig.commandName} Command`)
                .setColor(0x00AE86)
                .addFields(
                    { name: 'Description', value: foundCommandConfig.description || 'No description available.' },
                    { name: 'Example', value: foundCommandConfig.example || 'No example provided.' }
                )
            message.channel.send({ embeds: [dynamicCommandEmbed] })
        }

        //create and send other dynamic (category) embed
        else{
            const commandsInCategory = Object.values(categorizedCommands[userContent[1]])
            const dynamicCategoryEmbed = new EmbedBuilder()
                .setTitle(`Help Menu - ${userContent[1].charAt(0).toUpperCase() + userContent[1].slice(1)} Category`)
                .setColor(0x00AE86)
                .setDescription(commandsInCategory.map(cmd => `• **${cmd.name}** — ${cmd.description}`).join('\n'))
            message.channel.send({ embeds: [dynamicCategoryEmbed] })
        }
    }

    //send general (all commands) embed
    else{
        message.channel.send({ embeds: [allCommandsEmbed] })
    }
}