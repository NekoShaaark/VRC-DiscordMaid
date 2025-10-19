<h1 align="center">
  VRChat Discord Maid<br>
  <small>Commands List</small>
</h1>

<div align="center">
  This document lists every slash‑command the bot provides, grouped by functionality.<br/>
  Each command includes syntax, a short description, required permissions, and an example.
</div>

---

## Commands List
| Category   | Command                                            | Description                                                               |
|------------|----------------------------------------------------|---------------------------------------------------------------------------|
| Logging    | [/mod logs info](#mod-logs-info)                   | Paginated embed of all, or specific loggable event(s).                    |
|            | [/mod logs remove](#mod-logs-remove)               | Delete one or multiple logs *(comma‑separated)*.                          |
|            | [/mod logs archive](#mod-logs-archive)             | Trigger server logs archival task *now*.                                  |
|            | [/mod logs unarchive](#mod-logs-unarchive)         | Unarchive a previously archived logged event.                             |
|            | [/mod logs view](#mod-logs-view)                   | View paginated embed of filtered logged events using filters              |
|            | [/mod logs view-all](#mod-logs-view-all)           | View paginated embed of all logged events.                                |
| VRChat     | [/vrchat link](#vrchat-link)                       | Link a Discord user to a VRChat profile.                                  |
|            | [/vrchat unlink](#vrchat-unlink)                   | Unlink a Discord user's account from their VRChat profile.                |
|            | [/vrchat profile](#vrchat-profile)                 | Get your linked VRChat profile, or user's profile.                        |
|            | [/vrchat group-join](#vrchat-group-join)           | Info embed for joining the VRChat group.                                  |
| Moderation | [/mod group-user](#mod-group-user)                 | View/Add/Remove VRChat profile's group roles *(with kick/ban options)*.   |
|            | [/mod kick](#mod-kick)                             | Kick a user *(with DM'd reason)*.                                         |
|            | [/mod ban](#mod-ban)                               | Ban a user *(with DM'd reason)*.                                          |
|            | [/mod unban](#mod-unban)                           | Unban a banned user.                                                      |
|            | [/mod timeout](#mod-timeout)                       | Give a user a timeout for a specified time.                               |
|            | [/mod untimeout](#mod-untimeout)                   | Remove a user's active timeout.                                           |
|            | [/mod usernote add](#mod-usernote-add)             | Attach a private note to a user.                                          |
|            | [/mod usernote remove](#mod-usernote-remove)       | Delete one or multiple notes *(comma‑separated)*.                         |
|            | [/mod usernote view](#mod-usernote-view)           | View paginated embed of notes on specific user.                           |
|            | [/mod usernote view-all](#mod-usernote-view-all)   | View paginated embed of all notes.                                        |
| General    | [/help](#help)                                     | View help embed for all or a specific command.                            |
|            | [/info](#info)                                     | Basic bot credits.                                                        |
|            | [/ping](#ping)                                     | Replies to the user's message with 'pong'.                                |

---

## Logging
### /mod logs info
<details>
<summary><code>/mod logs info</code> – Paginated embed of all, or specific loggable event(s).</summary>

**Category:** Moderation/Logging

**Syntax:** `/mod logs info <eventType/viewName>`

**Parameters**
- `eventType` – Event Type *(eg. MEMBER_JOIN)*.
- `viewName` – Event Type's "view name" *(eg. Member Join)*.

**Behaviour**
1. **No Event supplied** – the bot replies with a pagniated embed of all loggable Event Types, and their info.
2. **Event Type or View Name** – the bot replies with an embed of the specifc Event's info.

**Examples**
```
/mod logs info                <= shows all events
/mod logs info MEMBER_JOIN    <= using event's eventType
/mod logs info Member Join    <= using event's viewName
```
</details>


### /mod logs remove
<details>
<summary><code>/mod logs remove</code> – Delete one or multiple logs.</summary>

**Category:** Moderation/Logging

**Syntax:** `/mod logs remove <logId>`

**Parameters**
- `logId` – Log ID(s) to remove *(comma-separated for multiple)*.

**Behaviour**
1. **One Log ID** – the bot presents the user with the log's embed, and asks if they want to remove it.
2. **Multiple Valid Log IDs** – the bot presents the user with a pagniated embed of all the logs, and asks if they want to remove the provided.
3. **Multiple Invalid and Valid Log IDs** – the bot presents the user with a pagniated embed of all the valid logs, and notifies the user of the invalid logs, and asks if they want to remove the valid logs.

**Examples**
```
/mod logs remove 12                  <= one log given
/mod logs remove 34,35,36,40,42,58   <= multiple valid log given
/mod logs remove 56,124,98631,128    <= multiple valid and invalid log given
```
</details>


### /mod logs archive
<details>
<summary><code>/mod logs archive</code> – Trigger server logs archival task <i>now</i>.</summary>

**Category:** Moderation/Logging

**Syntax:** `/mod logs archive`

**Behaviour**\
The bot asks the user if they want to activate the Server Logs Archival Task NOW (instead of on its regular schedule).\
**Note: this slash-command can only be run by Administrators.**
</details>


### /mod logs unarchive
<details>
<summary><code>/mod logs unarchive</code> – Unarchive a previously archived logged event.</summary>

**Category:** Moderation/Logging

**Syntax:** `/mod logs unarchive <logId>`

**Parameters**
- `logId` – Log ID to unarchive.

**Behaviour**\
Unarchives the provided Log ID *(if it is currently archived),* and creates a "Restored At" timestamp on it.\
The unarchived log also has it's time-to-archive reset.

**Examples**
```
/mod logs unarchive 34
```
</details>


### /mod logs view
<details>
<summary><code>/mod logs view</code> – View paginated embed of filtered logged events using filters.</summary>

**Category:** Moderation/Logging

**Syntax:** `/mod logs view <user> <affectedUser> <eventType> <detail> <detailValue> <limit> <logId> <archived>`

**Parameters**
- `user` – User that used the command, or self if no other user was affected *(optional)*.
- `affectedUser` – User affected by the command *(optional)*.
- `eventType` – Type of Event to view logs of *(optional)*.
- `detail` – Filter logs by specific detail *(optional)*.
- `detailValue` – Value for the chosen detail filter *(optional, only use if `detail` parameter is selected)*.
- `limit` – How many logs to fetch *(default 25, max 200)*.
- `logId` – Log ID to view *(optional, overrides other filters)*.
- `archived` – View only archived logs *(optional)*.
- **Note: if `user` and `affectedUser` are in the same log, `user` is probably a moderator, while `affectedUser` is a normal member.**

**Behaviour**
1. **No filters supplied** – the bot will ask for at least one filter.
2. **`logId` supplied** – the bot ignores every other filter, looks up that exact log ID, and returns a single‑page embed with the full details of the matching entry *(or an error message if the ID does not exist)*.

**Examples**
```
/mod logs view user:@stinkyGoober eventType:Member Join                         <= find logs of when @stinkyGoober joined the server
/mod logs view eventtype:Member Ban detail:Reason detailvalue:Stinky limit:50   <= find first 50 logs of when an unknown moderator banned a user with the "Stinky" reason
/mod logs view user:@randomModerator affectedUser:@stinkyGoober archived:True   <= find archived logs (logs older than 90 days) of when @randomModerator committed a moderator action on @stinkyGoober
```
</details>


### /mod logs view-all
<details>
<summary><code>/mod logs view-all</code> – View paginated embed of all logged events.</summary>

**Category:** Moderation/Logging

**Syntax:** `/mod logs view-all <archived>`

**Parameters**
- `archived` – View only archived logs *(optional)*.

**Behaviour**
1. **No `archived` flag** – the bot returns a pagniated embed of all the logged events.
2. **`archived:true` flag** – the returned pagniated embed is of all the archived logged events.

**Examples**
```
/mod logs view-all                 <= view all logs
/mod logs view-all archived:true   <= view all archived logs
```
</details>



## VRChat
### /vrchat link
<details>
<summary><code>/vrchat link</code> – Link a Discord user to a VRChat profile.</summary>

**Category:** VRChat

**Syntax:** `/vrchat link <link>`

**Parameters**
- `link` – Full VRChat profile URL.

**Behaviour**\
The bot shows an embed of the provided VRChat profile *(if it exists),* and asks if the shown embed is the executioner's VRChat profile.\
After the user has confirmed, a new database entry will be created, and the user can then view their profile with the `/vrchat profile` slash-command.

**Examples**
```
/vrchat link https://vrchat.com/home/user/usr_123
```
</details>


### /vrchat unlink
<details>
<summary><code>/vrchat unlink</code> – Unlink a Discord user's account from their VRChat profile.</summary>

**Category:** VRChat

**Syntax:** `/vrchat unlink <@user/vrcLink> <reason>`

**Parameters**
- `user` – User to unlink a VRChat profile of, if not you. *(moderator-only)*.
- `reason` – Reason for unlinking user's VRChat profile *(moderator-only)*.

**Behaviour**
1. **No target supplied** – the executioner's will be shown their linked VRChat profile, and asked if they would like to unlink themselves from it. Upon accepting, they will be unlinked from it, and their database entry removed.
2. **Discord mention (`@user`)** – the bot fetches the linked VRChat ID for that Discord user *(from the local database),* asks if the executioner *(moderator)* would like to unlink the VRChat account, and unlinks it + removes database entry if accepted.
3. **VRChat URL (`vrcLink`)** – the bot extracts the user ID from the URL, displays the VRChat profile, and does the same logic as explained in 1 and 2. 

**Examples**
```
/vrchat unlink                                                              <= executioner unlinking their VRChat profile from their Discord account
/vrchat unlink @vrchatEnjoyer32 Accidentally linked wrong account           <= moderator unlinking @vrchatEnjoyer32's VRChat profile due to linking wrong account
/vrchat unlink https://vrchat.com/home/user/usr_123 Not in server anymore   <= moderator unlinking user_123's VRChat profile due to not being in the server anymore
```
</details>


### /vrchat profile
<details>
<summary><code>/vrchat profile</code> – Get your linked VRChat profile, or user's profile.</summary>

**Category:** VRChat

**Syntax:** `/vrchat profile <@user/link/vrcName> <short>`

**Parameters**
- `@user` – Discord mention *(optional)*.
- `link` – Full VRChat profile URL *(optional)*.
- `vrcName` – VRChat username *(optional)*.
- `short` – Return a shortened embed *(optional)*.

**Behaviour**
1. **No target supplied** – the bot looks up the executor’s own VRChat profile in the local database.
2. **Discord mention (`@user`)** – the bot fetches the linked VRChat ID for that Discord user *(from the local database)*.
3. **VRChat username (`vrcName`)** – the bot searches using the VRChat API for profiles with the provided name, and returns the first match.
4. **VRChat URL (`link`)** – the bot extracts the user ID from the URL and displays the VRChat profile.
5. **If the user has not linked a profile** – the bot replies with a “profile not linked yet” message.
6. **`short:true` flag** – the returned embed is a shortened version, showing only: the profile's avatar, name, and status.

**Examples**
```
/vrchat profile                                         <= executioner's own profile
/vrchat profile short:true                              <= executioner's own profile, condensed view
/vrchat profile @vrchatEnjoyer32                        <= another Discord user’s profile
/vrchat profile VRChatEnjoyer                           <= lookup by VRChat username
/vrchat profile https://vrchat.com/home/user/usr_123    <= lookup by URL
```
</details>


### /vrchat group-join
<details>
<summary><code>/vrchat group-join</code> – Info embed for joining the VRChat group.</summary>

**Category:** Moderation/Logging

**Syntax:** `/vrchat group-join`

**Behaviour**
The bot replies with an embed with information on how to join the server's VRChat Group.
</details>



## Moderation
### /mod group-user
<details>
<summary><code>/mod group-user</code> – View/Add/Remove VRChat profile's group roles *(with kick/ban options)*.</summary>

**Category:** Moderation/VRChat

**Syntax:** `/mod group-user <@user/link/vrcName>`

**Parameters**
- `@user` – Discord mention *(optional)*.
- `link` – Full VRChat profile URL *(optional)*.
- `vrcName` – VRChat username *(optional)*.

**Behaviour**
1. **Discord mention (`@user`)** – the bot fetches the linked VRChat ID for that Discord user *(from the local database)*.
2. **VRChat username (`vrcName`)** – the bot searches using the VRChat API for profiles with the provided name that are in the server's group, and returns the first match.
3. **VRChat URL (`link`)** – the bot extracts the user ID from the URL and displays the VRChat group member.
4. **Add/Remove group role** – the user can select a role from the drop-down menu, and the bot will either add/remove the selected role *(depending on if the user currently has that role or not)*.
5. **Ban/Kick group member** – the user can select "ban" or "kick" from the provided buttons, and be asked if they want to ban/kick the provided user.

**Examples**
```
/mod group-user @vrchatEnjoyer32                       <= Discord user’s profile
/mod group-user VRChatEnjoyer32                        <= lookup by VRChat username
/mod group-user https://vrchat.com/home/user/usr_123   <= lookup by URL
```
</details>


### /mod kick
<details>
<summary><code>/mod kick</code> – Kick a user *(with DM'd reason)*.</summary>

**Category:** Moderation

**Syntax:** `/mod kick <@user> <reason>`

**Parameters**
- `@user` – Discord mention.
- `reason` – Reason for kicking user.

**Behaviour**\
The bot asks if the moderator would like to kick the specified user.\
Upon kicking the user, a DM will be sent to the user with the specified reason for being kicked from the server.

**Examples**
```
/mod kick @stinkyGoober Being annoying
```
</details>


### /mod ban
<details>
<summary><code>/mod ban</code> – Ban a user *(with DM'd reason)*.</summary>

**Category:** Moderation

**Syntax:** `/mod ban <@user> <reason>`

**Parameters**
- `@user` – Discord mention.
- `reason` – Reason for banning user.

**Behaviour**\
The bot asks if the moderator would like to ban the specified user.\
Upon banning the user, a DM will be sent to the user with the specified reason for being banned from the server.

**Examples**
```
/mod ban @stinkyGoober Breaking rules
```
</details>


### /mod unban
<details>
<summary><code>/mod unban</code> – Unban a banned user.</summary>

**Category:** Moderation

**Syntax:** `/mod unban <userId>`

**Parameters**
- `userId` – Banned user's ID.

**Behaviour**\
The bot asks if the moderator would like to unban the specified user *(will show the reason why the user was previously banned)*.\
Upon unbanning the user, the user will be unbanned from the server.

**Examples**
```
/mod unban 123456789
```
</details>


### /mod timeout
<details>
<summary><code>/mod timeout</code> – Give a user a timeout for a specified time.</summary>

**Category:** Moderation

**Syntax:** `/mod timeout <@user> <minutes> <reason>`

**Parameters**
- `@user` – Discord mention.
- `minutes` – Timeout duration in minutes.
- `reason` – Reason for timing out user.

**Behaviour**\
The bot asks if the moderator would like to timeout the specified user for the specified time *(time will be converted from minutes into respective hours and days)*.\
Upon timing out the user, the user will be unable to message in the server for the specified time *(for until the timeout is removed using `/mod untimeout`)*.

**Examples**
```
/mod timeout @stinkyGoober 60 Spamming chat
```
</details>


### /mod untimeout
<details>
<summary><code>/mod untimeout</code> – Remove a user's active timeout.</summary>

**Category:** Moderation

**Syntax:** `/mod untimeout <@user>`

**Parameters**
- `@user` – Discord mention.

**Behaviour**\
The bot asks if the moderator would like to remove an imposed timeout from the specified user *(will show the reason why the user was previously timed out)*.\
Upon removing the user's timeout, the user will be able to message again in the server.

**Examples**
```
/mod untimeout @stinkyGoober
```
</details>


### /mod usernote add
<details>
<summary><code>/mod usernote add</code> – Attach a private note to a user.</summary>

**Category:** Moderation/Usernote

**Syntax:** `/mod usernote add <@user> <note>`

**Parameters**
- `@user` – Discord mention.
- `note` – Note content to add.

**Behaviour**\
The bot adds the specified note to the specified user *(only visible to moderators)*, and returns an embed with the username, note content, noteId, and note creation timestamp.

**Examples**
```
/mod usernote add @stinkyGoober This guy is really stinky
```
</details>



### /mod usernote remove
<details>
<summary><code>/mod usernote remove</code> – Delete one or multiple notes.</summary>

**Category:** Moderation/Usernote

**Syntax:** `/mod usernote remove <noteId>`

**Parameters**
- `noteId` – Note ID(s) to remove *(comma-separated for multiple)*.

**Behaviour**
1. **One Note ID** – the bot presents the user with the note's embed, and asks if they want to remove it.
2. **Multiple Valid Note IDs** – the bot presents the user with a pagniated embed of all the notes, and asks if they want to remove the provided.
3. **Multiple Invalid and Valid Note IDs** – the bot presents the user with a pagniated embed of all the valid notes, and notifies the user of the invalid notes, and asks if they want to remove the valid notes.

**Examples**
```
/mod usernote remove 12                  <= one log given
/mod usernote remove 34,35,36,40,42,58   <= multiple valid log given
/mod usernote remove 56,124,98631,128    <= multiple valid and invalid log given
```
</details>


### /mod usernote view
<details>
<summary><code>/mod usernote view</code> – View paginated embed of notes on specific user.</summary>

**Category:** Moderation/Logging

**Syntax:** `/mod usernote view <@user> <noteId>`

**Parameters**
- `@user` – Discord mention.
- `noteId` – Note ID to view *(optional, overrides Discord mention)*.

**Behaviour**
1. **Only `@user` flag** – the bot returns a pagniated embed of all the mentioned user's notes.
2. **`noteId` flag** – the bot returns an embed of the specified Note ID.

**Examples**
```
/mod usernote view @stinkyGoober   <= view all notes on user @stinkyGoober
/mod usernote view 12              <= view only noteId 12
```
</details>


### /mod usernote view-all
<details>
<summary><code>/mod usernote view-all</code> – View paginated embed of all notes.</summary>

**Category:** Moderation/Logging

**Syntax:** `/mod usernote view-all`

**Behaviour**\
The bot returns a pagniated embed of all the user notes.
</details>



## General
### /help
<details>
<summary><code>/help</code> – View help embed for all or a specific command.</summary>

**Category:** General/Utility

**Syntax:** `/help <command>`

**Parameters**
- `command` – Discord mention.

**Behaviour**
1. **No command supplied** – The bot returns an embed of all the command categories, and their descriptions.
2. **Command-group supplied** – The bot returns an embed of all the commands within' that command-group, and their descriptions.
3. **Subcommand supplied** – The bot returns an embed of the command with it's description, category, usage, and examples.

**Examples**
```
/help               <= show embed of all command categories
/help vrchat        <= show embed of all commands within' command-group
/help vrchat link   <= show embed of command details
```
</details>


### /info
<details>
<summary><code>/info</code> – Basic bot credits.</summary>

**Category:** General/Utility

**Syntax:** `/info`

**Behaviour**\
The bot returns an embed with some basic bot credits.
</details>


### /ping
<details>
<summary><code>/ping</code> – Replies to the user's message with 'pong'.</summary>

**Category:** General/Utility

**Syntax:** `/ping`

**Behaviour**\
The bot replies to the user's message with 'pong'.\ 
*Used to test if the bot is online without having to run any complex commands*.
</details>