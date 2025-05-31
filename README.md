# Maid Project Plans:

## Logging
- [ ] Make logs of activities in the Server.
- [ ] Retrieve all logs of a specific User.
- [ ] Keep track of changes within' the Server _(could be stored in the database, or on a Server channel)_ including: 
   - [ ] Member joins/leaves/is kicked/is banned.
   - [ ] Role change of a member (removing/adding).

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
- [ ] Kicking/ban any user with custom message.
   - [ ] _(optional)_ Send mp4 file to banned user _(might be against Discord TOS)_.
- [ ] Make notes on specified user(s).

## General
- [ ] Welcome new users with custom message(s). _eg. `Please give our newest guest, @username, a warm welcome.`_


# Dependencies:
[VRChat API](https://vrchat.community): Interacting with the VRChat system. <br/>
[@kindlyfire/vrchatapi](https://www.npmjs.com/package/@kindlyfire/vrchatapi): Easy interaction and implementation of VRChat's API via Javascript. <br/>
[PostgreSQL](https://www.npmjs.com/package/pg): SQL-based database handling. <br/>
[Drizzle](https://orm.drizzle.team): ORM allowing easy interaction and implementation with PostgreSQL.