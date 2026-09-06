import "dotenv/config";
import { Client, Collection, GatewayIntentBits, Events } from "discord.js";
import { readdirSync } from "fs";
import { fileURLToPath, pathToFileURL } from "url";
import { dirname, join } from "path";
import { getTrackedInvites, syncInvite } from "./db.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const botDisplayName = process.env.BOT_DISPLAY_NAME || "Azami Generator R6";

// ── Client Setup ──────────────────────────────────────────────────────────────

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
  ],
});

client.commands = new Collection();
const inviteCache = new Map();

async function fetchGuildInvites(guild) {
  try {
    const invites = await guild.invites.fetch();
    return new Map([...invites.values()].map((invite) => [invite.code, invite.uses ?? 0]));
  } catch (error) {
    console.warn(`⚠️  Could not fetch invites for ${guild.name}: ${error.message}`);
    return null;
  }
}

async function cacheGuildInvites(guild) {
  const invites = await fetchGuildInvites(guild);
  if (invites) inviteCache.set(guild.id, invites);
  return invites;
}

// ── Load Commands ─────────────────────────────────────────────────────────────

const commandsPath = join(__dirname, "commands");
const commandFiles = readdirSync(commandsPath).filter((f) => f.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = pathToFileURL(join(commandsPath, file)).href;
  const command = await import(filePath);
  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
    console.log(`✅ Loaded command: /${command.data.name}`);
  } else {
    console.warn(`⚠️  Skipping ${file} — missing data or execute export`);
  }
}

// ── Events ────────────────────────────────────────────────────────────────────

client.once(Events.ClientReady, async (c) => {
  if (c.user.username !== botDisplayName) {
    await c.user.setUsername(botDisplayName).catch((error) => {
      console.warn(`⚠️  Could not set bot display name: ${error.message}`);
    });
  }
  console.log(`\n🤖 Logged in as ${c.user.tag}`);
  console.log(`📡 Serving ${c.guilds.cache.size} guild(s)\n`);
  await Promise.all(c.guilds.cache.map((guild) => cacheGuildInvites(guild)));
});

client.on(Events.GuildCreate, (guild) => {
  cacheGuildInvites(guild);
});

client.on(Events.InviteCreate, (invite) => {
  const cached = inviteCache.get(invite.guild?.id);
  if (cached) cached.set(invite.code, invite.uses ?? 0);
});

client.on(Events.GuildMemberAdd, async (member) => {
  const previous = inviteCache.get(member.guild.id) ?? new Map();
  const current = await fetchGuildInvites(member.guild);
  if (!current) return;

  const trackedCodes = new Set(
    getTrackedInvites(member.guild.id).map((invite) => invite.invite_code)
  );
  let usedInvite = null;
  for (const [code, uses] of current) {
    if (!trackedCodes.has(code)) continue;
    const delta = uses - (previous.get(code) ?? 0);
    if (delta > 0 && (!usedInvite || delta > usedInvite.delta)) {
      usedInvite = { code, delta };
    }
    syncInvite(code, uses);
  }
  inviteCache.set(member.guild.id, current);

  if (usedInvite) {
    console.log(`📨 Tracked invite ${usedInvite.code} was used by ${member.user.tag}`);
  }
});

// Handle slash commands
client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (err) {
      console.error(`Error in /${interaction.commandName}:`, err);
      const payload = {
        content: "❌ An error occurred while running this command.",
        flags: 64, // ephemeral
      };
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(payload).catch(() => {});
      } else {
        await interaction.reply(payload).catch(() => {});
      }
    }
  }
});

// ── Login ─────────────────────────────────────────────────────────────────────

if (!process.env.DISCORD_BOT_TOKEN) {
  console.error("❌ DISCORD_BOT_TOKEN is not set in your .env file!");
  process.exit(1);
}

client.login(process.env.DISCORD_BOT_TOKEN);
