import { drizzle } from 'drizzle-orm/node-postgres'
import { eq } from 'drizzle-orm'
import { usersTable } from './schema.js'

const db = drizzle(process.env.DATABASE_URL)


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

export async function createUserInDB(discordUserId, discordUsername, userVRCData){
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