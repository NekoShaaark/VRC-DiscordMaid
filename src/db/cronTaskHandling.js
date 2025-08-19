import cron from 'node-cron'
import { runServerLogArchivalTask } from './serverLogArchival.js'

//run cron task daily at 2am
export function scheduleCronServerLogArchivalTask(){
    cron.schedule("0 2 * * *", async () => {
        console.log("[CRON] [ServerLogArchivalTask] Running Server Logs archival task...")
        await runServerLogArchivalTask()
        console.log("[CRON] [ServerLogArchivalTask] Archival task complete.")
    })
}