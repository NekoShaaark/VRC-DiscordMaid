# Maid Project Plans:

## Logging
- [x] Fetch/filter all logs of a specific User/Affected User/Event Type/Details _(messages or actions that User did)_.
- [x] Archive old logs every x months, then delete those "archived" logs after x months _(can "unarchive" and view logs if wanted)_.
- [ ] Keep track of changes within' the Server _(stored in database, and copy of log on a Server channel)_ including: 
   - [x] Member joins/leaves/is kicked/is banned/is unbanned.
   - [x] Member has timeout applied or removed (and who applied/removed it, with how much time was applied/how much was left when it was removed).
   - [ ] Role change of a member (adding/removing, and who did it).
   - [ ] Message is edited/deleted (with edited/deleted content). **<= might not need this**
   - [x] Invite is created/deleted (and who created/deleted it).
   - [x] VRChat profile is linked/unlinked (and who linked/unlinked the profile, including if a moderator unlinked it, with a reason).
   - [ ] User Note is created/deleted (and who created/deleted it). **<= might not need this**

## VRChat
- [x] Display any VRChat user's profile.
- [x] Link/Unlink user's VRChat profile to Discord account _(uses database to store userdata),_ use with `/vrchat link` and `/vrchat unlink` commands.
- [x] To view a user's account use the following commands:
   - [x] `/vrchat profile` to view your currently linked VRChat account _(if your account is linked with the bot's database)_.
   - [x] `/vrchat profile @discordUsername` to view a user's linked VRChat account _(if pinged user has linked thier accounts)_.
   - [x] `/vrchat profile https://vrchat.com/home/user/usr_123` to view a user's VRChat account via link.
   - [x] `/vrchat profile vrchatUsername` to view a user's VRChat via plain text username/displayName.
- [ ] Capabilities of changing a VRChat member's roles witin' the Server's Group.
- [ ] _(optional)_ Remove VRChat member from Server's Group.
- [ ] Send invite link to in-game Group _(need more info on this)_.

## Moderation
- [x] Kick/ban/timeout any user with reason _(then send message in logging channel)_.
   - [ ] _(optional)_ Send mp4 file (or reason for ban/kick) to banned user _(might be against Discord TOS)_.
- [x] Add/Remove/View notes on specified users including:
   - [x] Mass-remove notes via array of Note IDs.
   - [x] Log notes into logging channel.

## General
- [x] Welcome new users with custom message(s). _eg. `Please give our newest guest, @username, a warm welcome.`_
- [ ] Help menu for all commands/subcommands, with categorizes, examples individual command info.


# Dependencies:
[Discord.js](https://www.npmjs.com/package/discord.js): Interacting with Discord's Bot system. <br/>
[VRChat API](https://vrchat.community): Interacting with the VRChat system. <br/>
[@kindlyfire/vrchatapi](https://www.npmjs.com/package/@kindlyfire/vrchatapi): Easy interaction and implementation of VRChat's API via Javascript. <br/>
[Axios](https://www.npmjs.com/package/axios): Dependency of @kindlyfire/vrchatapi. <br/>
[dotenv](https://www.npmjs.com/package/dotenv): Storing and fetching client secrets. <br/>
[PostgreSQL](https://www.npmjs.com/package/pg): SQL-based database handling. <br/>
[Drizzle](https://orm.drizzle.team): ORM allowing easy interaction and implementation with PostgreSQL. <br/>
[Node Cron](https://www.npmjs.com/package/node-cron): Node-based Crontab process for scheduling tasks.