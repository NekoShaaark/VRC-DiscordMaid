import { VRChatApi } from '@kindlyfire/vrchatapi'
import { getConfig, updateConfig } from './configManager.js'
import dotenv from 'dotenv'
dotenv.config()

const vrcUsername = process.env.VRC_USERNAME
const vrcPassword = process.env.VRC_PASSWORD
let vrc


//handling for if a new authToken (and 2fa) is needed
export async function initializeVRC() {
    const config = await getConfig()
    vrc = new VRChatApi({
        userAgent: config.userAgent,
        authToken: config.authToken
    })
    const authResult = await vrc.auth.login(vrcUsername, vrcPassword)

    //if logs into user, continue as normal
    if(!('requiresTwoFactorAuth' in authResult.data)){
        const vrcUser = await vrc.user.get()
        console.log("Logged in as:", vrcUser.data.displayName)
        await updateConfig('new2faCodeNeeded', false)
    } 
    //otherwise, create new authToken, and prompt user to submit new 2FA code
    else{
        const vrcAgent = new VRChatApi({ userAgent: config.userAgent })
        const newAuthResult = await vrcAgent.auth.login(vrcUsername, vrcPassword)
        await updateConfig('authToken', newAuthResult.token)
        
        if('requiresTwoFactorAuth' in authResult.data){ 
            console.log('New 2fa code required!')
            await updateConfig('new2faCodeNeeded', true)
        }
    }
    return vrc
}

//returns an authenticated vrcClient
//NOTE: DO NOT USE THIS FOR AUTHORIZING, INSTEAD CREATE A NEW VRCHATAPI
export async function getVRC() {
    if(!vrc){ throw new Error('VRChat client not initialized!') }
    return vrc
}