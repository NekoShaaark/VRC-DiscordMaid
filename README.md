<h1 align="center">VRChat Discord Maid<br/>
<div align="center">
   
   [![License]][license_url]
   ![NodeJs]

</div></h1>

A Discord bot that connects Discord and VRChat, providing moderation tools, user‑profile linking, and detailed server logging.

## Table of Contents
- [Features](#features)
- [Quick Start](#quick-start)
- [Commands Overview](#commands-overview)
   - [All Commands](COMMANDS.md)
- [Architecture & Tech Stack](#architecture--tech-stack)
- [License](#license)

---

## Features
- **Server Logging** – Loggable events include: Member joins/leaves, bans/kicks, timeouts, message edits/deletions, invite created/delete, VRChat link/unlink, and deletion of per-user usernotes. These mentioned events are stored in a local PostgreSQL database, and are formatted into a human-readable embed that is sent to a specified Discord channel.

- **VRChat Integration** – Users can link/unlink their VRChat profile to Discord, retrieve profile data for any member, and (moderators only) sync VRChat group roles dynamically.

- **Moderation Tools** – Kick/ban/timeout commands that optionally DM the affected user with a reason, per‑user notes, bulk log or note removal, and an automatic archival pipeline (logs become “archived” after 90 days and are permanently purged after 180 days).

- **Help & Info Commands** – `/help` for help on all commands, and `/mod logs info` for info on all loggable events (all events are searchable/filterable).

---

## Quick Start
> **TL;DR** – Clone, install dependencies, create database, configure .env file, generate database, and run.


### Step 1: Clone or download the repository
```
git clone https://github.com/NekoShaaark/VRC-DiscordMaid.git
cd VRC-DiscordMaid
```

### Step 2: Install system prerequisites & project dependencies
#### Step 2.1: Install Node.js and PostgreSQL
- Node.js: https://nodejs.org/en/download
- PostgreSQL: https://www.postgresql.org/download
> **Note: The bot requires Node ≥ 18.x, and PostgreSQL ≥ 13.**

#### Step 2.2: Install project dependencies
```
npm ci
```

### Step 3: Set up a local PostgreSQL database
#### Step 3.1: Create a dedicated database & user
Open a terminal *(or pgAdmin)* and run the following commands as the `postgres` super‑user.

**Switch to the postgres super-user:**
- Linux/macOS: *`sudo -u postgres psql`*
- Windows: *open “SQL Shell (psql)” and log in as user “postgres”*

Once you've switched to the postgres super-user and are inside psql:
```
CREATE USER vrcbot WITH PASSWORD 'your_strong_password';
CREATE DATABASE vrcbotdb OWNER vrcbot;
\q
```

**Explanation:**
- `\q` <= exits psql.
- `vrcbot` <= a non‑privileged user the bot will connect with.
- `vrcbotdb` <= the database name that will hold all tables created by Drizzle.
- `'your_strong_password` <= the password that will be used to access the database (*do not* remove the 'commas' when typing a password).

#### Step 3.2: Build the connection string
Edit the following line in your **`.env`** file *(see Step 4 for details)*:
```
DATABASE_URL=postgresql://vrcbot:your_strong_password@localhost:5432/vrcbotdb
```
> Replace `vrcbot`, `your_strong_password`, and `vrcbotdb` with the credentials you set above (if any).

### Step 4: Create relivant `.env` and `config.json` files
*(You can just rename the `.example` versions, instead of making new files).*\
Replace the placeholder values with your secret tokens and other data.

**.env Details:**
- `DISCORD_TOKEN` <= your Discord bot's token.
- `CLIENT_ID` <= your Discord bot's ID, can be grabbed from Discord or Developer Portal as Application ID.
- `GUILD_ID` <= Server ID that the bot will be in.
- `MOD_ROLE_ID` <= Role ID of the Moderator role *(can access most moderator commands)*.
- `ADMIN_ROLE_ID` <= Role ID of the Admin role *(can access all moderator and admin commands)*.
- `BOT_MANAGER_USER_ID` <= User ID of the "Bot Manager" *(user that can run every command, ignoring moderator/admin role prerequisites; only grant this to one user)*.
- `LOGGING_CHANNEL_ID` <= Channel ID where Server Logs will be sent to *(set this to a staff-only channel)*.
- `WELCOME_CHANNEL_ID` <= Channel ID where new users will be welcomed.
- `VRC_USERNAME` <= Username of VRChat bot account *(actual vrchat.com account credentials)*.
- `VRC_PASSWORD` <= Password of VRChat bot account *(actual vrchat.com account credentials)*.
- `VRC_GROUP_ID` <= Group ID of VRChat group that VRChat bot account is in *(make sure vrc bot account has admin permissions)*.
- `VRC_GROUP_BOT_ID` <= Bot Group ID of VRChat bot account *(specifically the bot account's group id, not user id)*.
- `DATABASE_URL` <= Drizzle/PostgreSQL database url string *(created in Step 3.2)*.

> **Note: Do not change anything in config.json. This file is dynamically changed.**

### Step 5: Generate Drizzle/PostgreSQL database
```
npx drizzle-kit generate
npx drizzle-kit push
```

### Step 6: Run the bot
Open the project directory in a terminal/console, and launch the bot using one of the two methods.
1. Directly with Node using:
   - `node .` <= starts bot
   - Pressing `Ctrl+C`, `Ctrl+Z`, or closing the terminal that the command was run in, will all stop the bot.

2. With PM2 (process handler) using:
   - `npm run bot-start` <= starts bot
   - `npm run bot-stop` <= stops bot

---

## Commands Overview
| Category   | Command                          | Description |
|------------|----------------------------------|-------------|
| Logging    | /mod logs info <eventType>               | Paginated embed showing logged events.
|            | /mod logs remove <logId>                 | Delete one or many logs *(comma‑separated)*.
|            | /mod logs archive                        | Trigger server logs archival task *now*.
| VRChat     | /vrchat link <url>                       | Link a Discord user to a VRChat profile.
|            | /vrchat profile <@user/url/vrcName>      | Get your linked VRChat profile, or user's profile.
|            | /vrchat group‑join                       | Info embed for joining the VRChat group.
| Moderation | /mod kick <@user> <reason>               | Kick a user *(with optional DM'd reason)*.
|            | /mod usernote add <@user> <note>         | Attach a private note to a user.
| General    | /help <command>                          | Show help embed for all or a specific command.
|            | /info                                    | Basic bot credits.

> **You can see the full list of commands in [COMMANDS.md](COMMANDS.md)**

---

## Architecture & Tech Stack
- **Runtime:** Node.js (v18+)
- **Discord library:** `discord.js` (v14)
- **VRChat API wrapper:** `@kindlyfire/vrchatapi`
- **Database:** PostgreSQL + Drizzle ORM
- **Scheduler:** `node-cron` (archival task)
- **Process manager:** `PM2` (production)

---

## License
This project is licensed under the **GNU General Public License v3.0**. See the [LICENSE](LICENSE) file for details.

[license_url]: https://www.gnu.org/licenses/gpl-3.0
[License]: https://img.shields.io/badge/License-GPLv3-blue.svg
[NodeJs]: https://img.shields.io/badge/Node.js-18%2B-success