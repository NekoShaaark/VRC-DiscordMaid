<h1 align="center">
  VRChat Discord Maid<br>
  <small>Commands List <i>[WIP]</i></small>
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
|            | [/mod logs remove](#mod-logs-remove)               | Delete one or many logs *(comma‑separated)*.                              |
|            | [/mod logs archive](#mod-logs-archive)             | Trigger server logs archival task *now*.                                  |
|            | [/mod logs unarchive](#mod-logs-unarchive)         | Unarchive a previously archived logged event.                             |
|            | [/mod logs view](#mod-logs-view)                   | Show paginated embed of filtered logged events.                           |
|            | [/mod logs view-all](#mod-logs-view-all)           | Show paginated embed of all logged events.                                |
| VRChat     | [/vrchat link](#vrchat-link)                       | Link a Discord user to a VRChat profile.                                  |
|            | [/vrchat unlink](#vrchat-unlink)                   | Unlink a Discord user's account from their VRChat profile.                |
|            | [/vrchat profile](#vrchat-profile)                 | Get your linked VRChat profile, or user's profile.                        |
|            | [/vrchat group-join](#vrchat-group-join)           | Info embed for joining the VRChat group.                                  |
| Moderation | [/mod group-user](#mod-group-user)                 | View/Add/Remove VRChat profile's group roles *(with kick/ban options)*.   |
|            | [/mod kick](#mod-kick)                             | Kick a user *(with optional DM'd reason)*.                                |
|            | [/mod ban](#mod-ban)                               | Ban a user *(with optional DM'd reason)*.                                 |
|            | [/mod unban](#mod-unban)                           | Unban a banned user.                                                      |
|            | [/mod timeout](#mod-timeout)                       | Give a user a timeout for a specified time.                               |
|            | [/mod untimeout](#mod-untimeout)                   | Remove a user's active timeout.                                           |
|            | [/mod usernote add](#mod-usernote-add)             | Attach a private note to a user.                                          |
|            | [/mod usernote remove](#mod-usernote-remove)       | Remove note from user using Note ID.                                      |
|            | [/mod usernote view](#mod-usernote-view)           | Show paginated embed of notes on specific user.                           |
|            | [/mod usernote view-all](#mod-usernote-view-all)   | Show paginated embed of all notes.                                        |
| General    | [/help](#help)                                     | Show help embed for all or a specific command.                            |
|            | [/info](#info)                                     | Basic bot credits.                                                        |
|            | [/ping](#ping)                                     | Replies to the user's message with 'pong'.                                |

---

## VRChat
### /vrchat profile
<details>
<summary><code>/vrchat profile</code> – Get your linked VRChat profile, or user's profile.</summary>

**Category:** VRChat

**Syntax:** `/vrchat profile <@user/link/vrcName> <short>`

**Parameters**
- `@user` – Discord mention *(optional)*.
- `link` – Full VRChat profile URL *(optional)*.
- `vrcName` – VRChat username *(optional)*.
- `short:true` – Return a shortened embed *(optional)*.

**Permissions**
- No special permissions; any member may invoke.

**Behaviour**
1. **No target supplied** – the bot looks up the executor’s own VRChat profile in the local database.  
2. **Discord mention (`@user`)** – the bot fetches the linked VRChat ID for that Discord user *(from the local database)*.  
3. **VRChat username (`vrcName`)** – the bot searches using the VRChat API for profiles with the provided name, and returns the first match.  
4. **Full URL (`link`)** – the bot extracts the user ID from the URL and displays the profile.  
5. **If the user has not linked a profile** – the bot replies with a “profile not linked yet” message.  
6. **`short:true` flag** – the returned embed is a shortened version, showing only: the profile's avatar, name, and status.

**Examples**
```
/vrchat profile                                         <= my own profile
/vrchat profile short:true                              <= my own profile, condensed view
/vrchat profile @vrchatEnjoyer32                        <= another Discord user’s profile
/vrchat profile VRChatEnjoyer                           <= lookup by VRChat username
/vrchat profile https://vrchat.com/home/user/usr_123    <= lookup by URL
```
</details>
