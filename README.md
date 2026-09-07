# Dokkabi Rainbow Six Siege Account Generator

A standalone Discord bot for distributing Rainbow Six Siege accounts with the
Dokkabi Generator R6 presentation from the reference screenshots. It includes free and Premium
stock, private account delivery, timed drops, invite tracking, subscriptions,
vouches, configurable channels, and admin controls.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your environment file:

   ```bash
   cp .env.example .env
   ```

   Fill in:

   - `DISCORD_BOT_TOKEN` — bot token from the Discord Developer Portal
   - `CLIENT_ID` — application ID
   - `GUILD_ID` — optional server ID for instant test command registration
   - `BOT_DISPLAY_NAME` — optional Discord bot name; defaults to `Dokkabi Generator R6`

3. Register the slash commands:

   ```bash
   npm run deploy
   ```

4. Start the bot:

   ```bash
   npm start
   ```

   Guild registration is immediate. Global registration can take Discord up to
   an hour to appear. Admins can use `/sync` to register the commands globally.

## Commands

### Account and member commands

| Command | Description |
| --- | --- |
| `/generate` | Generate a free or Premium Rainbow Six Siege account |
| `/viewstock` | View available free and Premium stock |
| `/checksub` | Check your Premium subscription |
| `/invites` | View your tracked invite count |
| `/createinvite` | Create a tracked invite link |
| `/vouch` | Leave a vouch for the bot |
| `/vouches` | View recent vouches |

### Admin commands

| Command | Description |
| --- | --- |
| `/addstock` | Add an account to free or Premium stock |
| `/clearstock` | Remove unused free or Premium stock |
| `/edit` | Customize the Dokkabi Generator embed appearance |
| `/setsubscription` | Grant Premium access for a number of days |
| `/setchannel` | Configure free or Premium generation channels |
| `/setcooldown` | Configure generation cooldowns |
| `/dropcooldown` | Configure the drop cooldown |
| `/adddropstock` | Add an account to drop stock |
| `/viewdropstock` | View the drop stock |
| `/cleardropstock` | Remove all unused drop stock |
| `/dropstart` | Start a timed account drop |
| `/dropstop` | Stop the active drop |
| `/dropstatus` | View the active drop and stock status |
| `/messages` | DM an announcement to previous claimers |
| `/checkchannel` | Check the configured generation channels |
| `/inviteleaderboard` | View the tracked invite leaderboard |
| `/refreshinvites` | Refresh tracked invite counts from Discord |
| `/viewjoins` | View tracked invite join statistics |
| `/resetjoins` | Reset tracked invite counts |
| `/deletevouch` | Delete a vouch by ID |
| `/sync` | Register the slash commands globally |

All admin commands require Discord Administrator permission or the configured
admin role.

## Stock formats

### Simple account format

For `/addstock` and `/adddropstock`, use one account per command:

```text
email@example.com:Password123
```

The password may contain additional colons; the first colon separates the
email from the password.

### Full account JSON

Use JSON when you want to show richer Rainbow Six account details:

```json
{
  "email": "player@example.com",
  "password": "Password123",
  "username": "DokkabiMain",
  "level": 178,
  "linkedPlatforms": ["Ubisoft", "Xbox", "Steam"],
  "renown": 125000,
  "r6credits": 2670,
  "blackIces": ["R4-C", "MP5"],
  "elites": ["Dokkaebi", "Jäger"],
  "universals": ["Disruptor"],
  "rankedHistory": ["Emerald", "Diamond"],
  "skinLink": "https://your-image-host.example/r6-card.png"
}
```

The bot also accepts the snake_case equivalents used by older stock files,
such as `linked_platforms`, `black_ices`, and `ranked_history`. If only
`credentials` is supplied, use the value `email@example.com:Password123`.

When `/generate` is used in the configured generation channel, everyone sees
the bot's temporary Discord “thinking” state. The same public message is then
replaced with an embed naming the member who generated the account and showing
safe account metadata without exposing credentials. Full account details are
sent only to the claimant by DM. If `skinLink` is present, Discord displays that
account image in the DM; otherwise the bot generates an Dokkabi R6 locker-card SVG.

## Invite tracking

Use `/createinvite` to create links that are attributed to the member who
created them. The bot refreshes tracked links when members join and compares
Discord's invite-use counts to its cached values. `/refreshinvites` can be used
by an admin after reconnecting the bot or whenever counts need to be synchronized.

Enable the **Server Members Intent** in the Discord Developer Portal. The
invite commands also require **Manage Server** for invite fetching and
**Create Invite** in the channel where `/createinvite` is used.

## Discord permissions and intents

Recommended bot permissions:

- View Channels
- Send Messages
- Embed Links
- Attach Files
- Use Application Commands
- Create Invite
- Manage Server (for invite refresh and join tracking)

Enable these privileged intents:

- Server Members Intent
- Message Content Intent is not required

## Storage and safety

The bot stores data in a local SQLite database at `bot.db`, created
automatically on first start. The database, `.env`, and dependencies are
excluded from Git. Never commit real account credentials, bot tokens, or
environment files to a public repository.