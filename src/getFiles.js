//imports
const fs = require('fs')
const path = require('path')

const getFiles = (dir, suffix) => {
    const resolvedDir = path.isAbsolute(dir) ? dir : path.resolve(__dirname, dir)
    const files = fs.readdirSync(resolvedDir, { withFileTypes: true })
    let foundFiles = []

    for(const file of files){
        if(file.isDirectory()){
            foundFiles = [
                ...foundFiles,
                ...getFiles(`${resolvedDir}/${file.name}`, suffix),
            ]
        } 
        else if(file.name.endsWith(suffix)){
            foundFiles.push(`${resolvedDir}/${file.name}`)
        }
    }
    //return array of found files in given directory (ending with given suffix)
    return foundFiles
}

module.exports = getFiles