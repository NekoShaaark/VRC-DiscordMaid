# VRChat Discord Maid Project
Discord Bot created for a freelancing project. <br/>
This project includes integration with the VRChat's API, and has some Community moderation systems. A full list of features, and their slash-commands can be found below. <br/>
To make use of this project, please replace the ".env.example" and "config.json.example" files with their respective non-example files, and replace their example data with your data. <br/>
**Please note that this project is protected by a GNU General Public License.**

# Features
## Logging
- Store changes/events within' a local database as a "Server Log", and creates a copy of said-log in specified a Discord server's channel. Events that are logged include: 
   - Member joins/leaves/is kicked/is banned/is unbanned.
   - Member has timeout applied or removed _(and who applied/removed it, with how much time was applied/how much was left when it was removed)_.
   - Message is edited/deleted/mass-deleted _(with edited/deleted content (mass-deleted has file attachment, and are deleted when related log is removed))_.
   - Invite is created/deleted _(and who created/deleted it)_.
   - VRChat profile is linked/unlinked _(and who linked/unlinked the profile, including if a moderator unlinked it, with a reason)_.
   - User Note is deleted _(and who deleted it)_.
- `/mod logs info <eventType/viewName>` for a paged embed to show all Events that are logged as a "Server Log" _(provide no argument)_, or specified Event, with view name, description, related details, and view examples _(how to filter with the specific Event Type)_.
- `/mod logs remove <logId>` to remove log using log's Id _(mass-remove logs by providing logIds seperated by a comma)_.
- `/mod logs view <arguments>` to fetch/filter all logs of a specific User/Affected User/Event Type/Details _(all arguments and types can be found in-project)_.
- `/mod logs view-all` to fetch all logs with no filtering _(will provide a pagination embed that can be manually paged through)_.
- Archives old logs after existing for 90 days, then deletes those "archived" logs after 90 days _(180 days of being alive)_.
   - `/mod logs archive` to run automatic archival task NOW, instead of on above-mentioned schedule.
   - `/mod logs unarchive <logId>` to "unarchive" currently archived logs.
   - `/mod logs view/view-all archived:true` to view currently archived logs.

## VRChat
- Link/Unlink your VRChat profile to your Discord account _(stores userdata in local database)_ with: 
   - `/vrchat link https://vrchat.com/home/user/usr_123` to link your VRChat profile to your Discord account.
   - `/vrchat unlink @discordUser/vrchatLink/vrchatUsername` to unlink a user's VRChat profile _(for moderators)_, or provide no arguments to unlink yours.
- View a user's VRChat profile with the following commands:
   - `/vrchat profile` to view your currently linked VRChat account _(if your account is linked with the bot's database)_.
   - `/vrchat profile @discordUsername` to view a user's linked VRChat account _(if pinged user has linked thier accounts)_.
   - `/vrchat profile https://vrchat.com/home/user/usr_123` to view a user's VRChat account via link.
   - `/vrchat profile vrchatUsername` to view a user's VRChat via plain text username/displayName.
- `/vrchat group-join` shows a simple embed with info on joining the VRChat Group.
- `/mod group-user @discordUser/vrchatLink/vrchatUsername` slash-command to add/remove a VRChat member's roles witin' the Server's Group.
- Kick/ban VRChat member from Server's Group with buttons provided by above slash-command.

## Moderation
- `/mod kick/ban/timeout <@discordUser> <reason>` to kick/ban/timeout provided user with reason.
   - Sends a DM with provided reason for ban/kick to banned/kicked user.
- Add/Remove/View notes on specified users.
   - `/mod usernote add <@discordUser> <note>` to add Usernote to a provided user.
   - `/mod usernote remove <noteId>` to remove Usernote using note's Id _(mass-remove notes by providing noteIds seperated by a comma)_.
   - `/mod usernote view <@discordUser/noteId>` to view specific note, or all notes on provided user.
   - `/mod usernote view-all` to fetch all notes with no filtering _(will provide a pagination embed that can be manually paged through)_.

## General
- Welcomes new users with a custom welcome message, eg. `Please give our newest guest, @username, a warm welcome!`.
- `/help <command>` for a help menu to show all _(provide no argument)_, or specified command/subcommand with command description, category, usage, and example(s).
- `/info` shows a simple embed with basic bot credits.


# Dependencies
[Discord.js](https://www.npmjs.com/package/discord.js): Interacting with Discord's Bot system. <br/>
[VRChat API](https://vrchat.community): Interacting with the VRChat system. <br/>
[@kindlyfire/vrchatapi](https://www.npmjs.com/package/@kindlyfire/vrchatapi): Easy interaction and implementation of VRChat's API via Javascript. <br/>
[Axios](https://www.npmjs.com/package/axios): Dependency of @kindlyfire/vrchatapi. <br/>
[dotenv](https://www.npmjs.com/package/dotenv): Storing and fetching client secrets. <br/>
[PostgreSQL](https://www.npmjs.com/package/pg): SQL-based database handling. <br/>
[Drizzle](https://orm.drizzle.team): ORM allowing easy interaction and implementation with PostgreSQL. <br/>
[Node Cron](https://www.npmjs.com/package/node-cron): Node-based Crontab process for scheduling tasks. <br/>
[PM2](https://www.npmjs.com/package/pm2): Process Manager for automatic starting/restart handling.
