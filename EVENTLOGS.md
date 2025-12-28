<h1 align="center">
  VRChat Discord Maid<br>
  <small>Loggable Server Events</small>
</h1>

<div align="center">
  This document lists every Server Event Log the bot can create and log; logs are saved to configured local database.<br/>
  Each log includes a short description, related details, and view examples.
</div>

---

## Loggable Server Events
| Server Event                                     | Description                                                                     |
|--------------------------------------------------|---------------------------------------------------------------------------------|
| [Member Join](#member-join)                      | User joins the server.                                                          |
| [Member Leave](#member-leave)                    | User leaves the server.                                                         |
| [Member Kick](#member-kick)                      | Moderator kicks a user from the server.                                         |
| [Member Ban](#member-ban)                        | Moderator bans a user from the server.                                          |
| [Member Unban](#member-unban)                    | Moderator unbans a user from the server.                                        |
| [Timeout Add](#timeout-add)                      | Moderator gives a user a timeout.                                               |
| [Timeout Remove](#timeout-remove)                | Moderator removes a user's timeout (untimeout).                                 |
| [Message Edited](#message-edited)                | User edits one of their messages (bots are ignored).                            |
| [Message Deleted](#message-deleted)              | User, or moderator, deletes a message (bots are ignored).                       |
| [Message Bulk Deleted](#message-bulk-deleted)    | Moderator bulk deletes multiple messages.                                       |
| [Invite Created](#invite-created)                | User creates an invite.                                                         |
| [Invite Deleted](#invite-deleted)                | Moderator deletes an invite (no log for when an invite expires).                |
| [VRChat Linked](#vrchat-linked)                  | User links their VRChat profile to their Discord account.                       |
| [VRChat Unlinked](#vrchat-unlinked)              | User, or moderator, unlinks their VRChat profile from their Discord account.    |
| [Usernote Deleted](#usernote-deleted)            | Moderator deletes a Usernote.                                                   |

---

### Member Join
<details>
<summary><code>MEMBER_JOIN</code> – Server Log for when a user joins the server.</summary>

**Related Details**
- `User` – User that joined.
- `Account Created At` – Date the user's account was created.

**View Examples**
```
/mod logs view user:@discordUser  eventType:Member Join                                    <= view all logs of @discordUser joining the server
/mod logs view eventType:Member Join  detail:Account Created At  detailValue:23/12/2024    <= view all logs of users joining on 23/12/2024
```
</details>


### Member Leave
<details>
<summary><code>MEMBER_LEAVE</code> – Server Log for when a user leaves the server.</summary>

**Related Details**
- `User` – User that left.
- `Account Created At` – Date the user's account was created.

**View Examples**
```
/mod logs view user:@discordUser  eventType:Member Leave                                    <= view all logs of @discordUser leaving the server
/mod logs view eventType:Member Leave  detail:Account Created At  detailValue:14/09/2025    <= view all logs of users leaving on 14/09/2025
```
</details>


### Member Kick
<details>
<summary><code>MEMBER_KICK</code> – Server Log for when a moderator kicks a user from the server.</summary>

**Related Details**
- `User` – Moderator that kicked the affected user.
- `Affected User` – User that was kicked.
- `Reason` – Reason for affected user being kicked.

**View Examples**
```
/mod logs view user:@discordUser  affectedUser:@affectedUser  eventType:Member Kick    <= view all logs of @discordUser kicking @affectedUser from the server
/mod logs view eventType:Member Kick  detail:Reason  detailValue:Stinky                <= view all logs of users being kicked on with reason "Stinky"
```
</details>


### Member Ban
<details>
<summary><code>MEMBER_BAN</code> – Server Log for when a moderator bans a user from the server.</summary>

**Related Details**
- `User` – Moderator that banned the affected user.
- `Affected User` – User that was banned.
- `Reason` – Reason for affected user being banned.

**View Examples**
```
/mod logs view user:@discordUser  affectedUser:@affectedUser  eventType:Member Ban    <= view all logs of @discordUser banning @affectedUser from the server
/mod logs view eventType:Member Ban  detail:Reason  detailValue:Stinky                <= view all logs of users being banned on with reason "Stinky"
```
</details>


### Member Unban
<details>
<summary><code>MEMBER_UNBAN</code> – Server Log for when a moderator unbans a user from the server.</summary>

**Related Details**
- `User` – Moderator that unbanned the affected user.
- `Affected User` – User that was unbanned.
- `Reason` – Reason for affected user being unbanned.

**View Examples**
```
/mod logs view user:@discordUser  affectedUser:@affectedUser  eventType:Member Unban    <= view all logs of @discordUser unbanning @affectedUser from the server
/mod logs view eventType:Member Unban  detail:Reason  detailValue:Not stinky anymore    <= view all logs of users being kicked on with reason "Not stinky anymore"
```
</details>


### Timeout Add
<details>
<summary><code>MEMBER_TIMEOUT_ADD</code> – Server Log for when a moderator gives a user a timeout.</summary>

**Related Details**
- `User` – Moderator that gave the affected user a timeout.
- `Affected User` – User that was given a timeout.
- `Timeout Length` – Length of the timeout.
- `Reason` – Reason for affected user being timed-out.

**View Examples**
```
/mod logs view user:@discordUser  affectedUser:@affectedUser  eventType:Timeout Add  detail:Timeout Length  detailValue:20 minutes    <= view all logs of @discordUser giving @affectedUser a timeout for 20 minutes
/mod logs view eventType:Timeout Add  detail:Reason  detailValue:Stinky                                                               <= view all logs of users being timed-out with reason "Stinky"
```
</details>


### Timeout Remove
<details>
<summary><code>MEMBER_TIMEOUT_ADD</code> – Server Log for when a moderator removes a user's timeout (untimeout).</summary>

**Related Details**
- `User` – Moderator that removed the affected user's timeout.
- `Affected User` – User that was freed early from given timeout.
- `Timeout Remaining` – Amount of time remaining when timeout was removed.
- `Reason` – Reason for removing affected user's timeout early.

**View Examples**
```
/mod logs view user:@discordUser  affectedUser:@affectedUser  eventType:Timeout Remove  detail:Timeout Remaining  detailValue:5 minutes    <= view all logs of @discordUser removing @affectedUser's timeout early, with having 5 minutes remaining on their timeout
/mod logs view eventType:Timeout Remove  detail:Reason  detailValue:Not stinky anymore                                                     <= view all logs of users having their timeout removed early with reason "Not stinky anymore"
```
</details>


### Message Edited
<details>
<summary><code>MESSAGE_EDIT</code> – Server Log for when a user edits one of their messages (bots are ignored).</summary>

**Related Details**
- `User` – Owner of edited message.
- `Original Message` – Message before being edited.
- `Edited Message` – Message after being edited.

**View Examples**
```
/mod logs view user:@discordUser eventType:Message Edited  detail:Original Message  detailValue:Stik    <= view all logs of @discordUser's original message of "Stik"
/mod logs view eventType:Message Edited  detail:Edited Message  detailValue:Stinky                      <= view all logs of users editing their message(s) to be "Stinky"
```
</details>


### Message Deleted
<details>
<summary><code>MESSAGE_DELETE</code> – Server Log for when a user, or moderator, deletes a message (bots are ignored).</summary>

**Related Details**
- `User` – Moderator or Owner that deleted the message.
- `Affected User` – Owner of the deleted message (if not deleted by moderator).
- `Deleted Message` – Content of the deleted message.

**View Examples**
```
/mod logs view user:@discordUser  affectedUser:@affectedUser  eventType:Message Deleted  detail:Deleted Message  detailValue:Stinky    <= view all logs of @discordUser (moderator) deleting @affectedUser's (normal user/message owner) message of "Stinky"
/mod logs view eventType:Message Deleted  detail:Deleted Message  detailValue:Stinky                                                   <= view all logs of users deleted messages containing "Stinky"
```
</details>


### Message Bulk Deleted
<details>
<summary><code>MESSAGE_DELETE_BULK</code> – Server Log for when a moderator bulk deletes multiple messages.</summary>

**Note**
Use LogID when viewing Log to include file if it doesn't appear.

**Related Details**
- `User` – Moderator or Bot that bulk deleted the messages.
- `Bulk Deleted Messages File` – File name containing bulk deleted messages.
- `Bulk Deleted Messages Preview` – Preview of bulk deleted messages.
- `Bulk Deleted Messages Amount` – Amount of messages that were bulk deleted.

**View Examples**
```
/mod logs view user:@discordUser  eventType:Deleted Message  detail:Bulk Deleted Messages File Name  detailValue:bulkDelete32.txt    <= view all logs of @discordUser (moderator or bot) bulk deleting messages with bulk deleted messages file name of "bulkDelete32.txt"
/mod logs view eventType:Deleted Message  detail:Bulk Deleted Messages Amount  detailValue:12                                        <= view all logs of bulk deleted messages containing exactly 12 deleted messages
```
</details>


### Invite Created
<details>
<summary><code>INVITE_CREATE</code> – Server Log for when a user creates an invite.</summary>

**Related Details**
- `User` – User that created the invite.
- `Invite Code` – Code of created invite.
- `Invite Channel` – Directed channel of invite (defaulted to Welcome channel).
- `Invite Length` – When invite will expire.
- `Invite Max Uses` – How many uses the invite has (defaulted to unlimited).
- `Invite Temporary` – If invite gives temporary membership (used in survey-locked servers, can ignore).

**View Examples**
```
/mod logs view user:@discordUser  eventType:Invite Created  detail:Invite Length  detailValue:7 days    <= view all logs of @discordUser creating an invite that expires (has length of) in 7 days
/mod logs view eventType:Invite Created  detail:Invite Max Uses  detailValue:Unlimited                  <= view all logs of users that created an invite with unlimited uses
```
</details>


### Invite Deleted
<details>
<summary><code>INVITE_DELETE</code> – Server Log for when a moderator deletes an invite (no log for when an invite expires).</summary>

**Related Details**
- `User` – Moderator that deleted the invite.
- `Invite Code` – Code of created invite.
- `Invite Channel` – Directed channel of invite (defaulted to Welcome channel).

**View Examples**
```
/mod logs view user:@discordUser  eventType:Invite Deleted  detail:Invite Code  detailValue:xxxxxxx    <= view all logs of @discordUser deleting an invite that has a code of xxxxxxx
/mod logs view eventType:Invite Deleted  detail:Invite Channel  detailValue:channelName                <= view all logs of users that deleted an invite to channelName channel
```
</details>


### VRChat Linked
<details>
<summary><code>VRC_LINKED</code> – Server Log for when a user links their VRChat profile to their Discord account.</summary>

**Related Details**
- `User` – User that linked their VRChat profile to their Discord account.
- `VRChat User ID` – User ID of linked VRChat profile.

**View Examples**
```
/mod logs view user:@discordUser  eventType:VRChat Linked                                                              <= view all logs of @discordUser linking their VRChat profile to their Discord account
/mod logs view eventType:VRChat Linked  detail:VRChat User ID  detailValue:usr_00000000-0000-0000-0000-000000000000    <= view all logs of users that linked their Discord account to their VRChat profile with VRC User ID of "usr_00000000-0000-0000-0000-000000000000"
```
</details>


### VRChat Unlinked
<details>
<summary><code>VRC_UNLINKED</code> – Server Log for when a user, or moderator, unlinks their VRChat profile from their Discord account.</summary>

**Related Details**
- `User` – User or moderator that unlinked their (or another user's) VRChat profile to/from their Discord account.
- `Affected User` – User that unlinked their VRChat profile to their Discord account (if not unlinked by moderator).
- `VRChat User ID` – User ID of linked VRChat profile.

**View Examples**
```
/mod logs view user:@moderator  affectedUser:@discordUser  eventType:VRChat Unlinked                                     <= view all logs of @moderator unlinking @discordUser's VRChat profile from their Discord account
/mod logs view eventType:VRChat Unlinked  detail:VRChat User ID  detailValue:usr_00000000-0000-0000-0000-000000000000    <= view all logs of users that unlinked their Discord account to their VRChat profile with VRC User ID of "usr_00000000-0000-0000-0000-000000000000"
```
</details>


### Usernote Deleted
<details>
<summary><code>NOTE_DELETED</code> – Server Log for when a moderator deletes a Usernote.</summary>

**Related Details**
- `User` – Moderator that deleted user's Usernote.
- `Affected User` – User of the deleted Usernote.
- `Usernote ID` – ID of deleted Usernote.
- `Usernote Note` – Note content of deleted Usernote.

**View Examples**
```
/mod logs view user:@moderator  affectedUser:@discordUser  eventType:Usernote Deleted  detail:Usernote ID  detailValue:73    <= view all logs of @discordUser's usernotes that @moderator deleted, with a usernote id of 73
/mod logs view eventType:Usernote Deleted  detail:Usernote Note  detailValue:Stinky                                          <= view all logs of deleted usernotes that contain "Stinky"
```
</details>