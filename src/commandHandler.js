//imports
const fs = require('fs')
const getFiles = require('@/getFiles')


//export
module.exports = (client) => {
    const commands = {}
    var commandNames = []
    const prefix = process.env.PREFIX
    const commandFiles = getFiles('commands', '.js')
    const cooldowns = new Map()

    //loop through all command files and 
    for(const command of commandFiles){
        let commandFile = require(command)
        
        //config check
        if(!commandFile.config){
            console.log('Config object not found')
            return
        }
        
        //register commandName and aliases to commandFile(s)
        else{
            const commandName = commandFile.config.commandName
            const commandAliases = commandFile.config.aliases
            
            commandNames.push(commandName)
            commands[commandName] = commandFile
            for(alias in commandAliases){ 
                commands[commandFile.config.aliases[alias]] = commandFile 
            }
        }
    }
    console.log("Loaded Commands: ", commandNames)

    //prefix checking
    client.on('messageCreate', (message) => {
        if(message.author.bot || !message.content.startsWith(prefix)){ return }

        const now = Date.now()
        const args = message.content.slice(prefix.length).split(/ +/)
        const commandName = args.shift().toLowerCase()
        const command = commands[commandName]
        if(!command){ return }

        //create cooldown in map, if command doesn't have one already
        if(!cooldowns.has(commandName)){ cooldowns.set(commandName, new Map()) }
        const timestamps = cooldowns.get(commandName)
        const cooldownAmount = (command.config.cooldown.timeLimit || 3) * 1000 //default 3s

        if(timestamps.has(message.author.id)) {
        const expirationTime = timestamps.get(message.author.id) + cooldownAmount

            if(now < expirationTime) {
                const timeLeft = ((expirationTime - now) / 1000).toFixed(1)
                return message.reply(`Command is on cooldown, please wait ${timeLeft}s before reusing the \`${commandName}\` command.`)
            }
        }

        // Set timestamp for this user
        timestamps.set(message.author.id, now)

        // Remove cooldown after it's expired
        setTimeout(() => timestamps.delete(message.author.id), cooldownAmount)


        try{ command.callback(message, ...args) } 
        catch(error){ console.error('ERROR:', error) }
    })
}