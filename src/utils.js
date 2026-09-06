import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import { getSettings } from "./db.js";

export const GENERATOR_NAME = process.env.BOT_DISPLAY_NAME || "Azami Generator R6";
export const GENERATOR_SHORT_NAME =
  GENERATOR_NAME.replace(/\s+Generator(?:\s+R6)?$/i, "").trim() || GENERATOR_NAME;
export const AZAMI_IMAGE_URL =
  "https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUDkj/3lYBT5X9KtGMcZHMvHGfA6/cf2c5e07ef4bc8abd1e5c49c0c7f0f38/r6s-operators-dokkaebi.jpg";
export const DOKKAEBI_CARD_URL = AZAMI_IMAGE_URL;

export function isAdmin(interaction) {
  const member = interaction.member;
  if (!member) return false;
  if (member.permissions?.has("Administrator")) return true;
  const roleName = getSettings(interaction.guildId).admin_role_name;
  return Boolean(roleName && member.roles?.cache?.some((role) => role.name === roleName));
}

export function parseDuration(value) {
  const match = String(value).trim().match(/^(\d+)\s*(d|h|m)$/i);
  if (!match) return null;
  const amount = Number(match[1]);
  const multiplier = { d: 86400, h: 3600, m: 60 }[match[2].toLowerCase()];
  return amount > 0 && amount <= 3650 ? amount * multiplier : null;
}

export function formatDuration(seconds) {
  let remaining = Math.max(0, Math.floor(Number(seconds) || 0));
  const parts = [];
  for (const [label, size] of [
    ["d", 86400],
    ["h", 3600],
    ["m", 60],
    ["s", 1],
  ]) {
    const amount = Math.floor(remaining / size);
    if (amount > 0 || (label === "s" && parts.length === 0)) {
      parts.push(`${amount}${label}`);
    }
    remaining %= size;
  }
  return parts.join(" ");
}

export function parseAccountInput(raw, tier = "free") {
  const text = raw.trim();
  if (!text) return null;
  if (text.startsWith("{")) {
    try {
      const data = JSON.parse(text);
      if (!data.credentials && !(data.email && data.password)) return null;
      return { ...data, tier };
    } catch {
      return null;
    }
  }
  const split = text.indexOf(":");
  if (split < 1 || split === text.length - 1) return null;
  const email = text.slice(0, split).trim();
  const password = text.slice(split + 1).trim();
  return { email, password, credentials: `${email}:${password}`, tier };
}

export function parseAccountLines(raw, tier) {
  return raw
    .split(/\r?\n/)
    .map((line) => parseAccountInput(line, tier))
    .filter(Boolean);
}

export function getColor(color) {
  return /^#[0-9a-f]{6}$/i.test(color ?? "") ? color : "#5865f2";
}

function list(value) {
  if (!Array.isArray(value) || value.length === 0) return "None listed";
  return value.join(", ");
}

function platformText(value) {
  const icons = {
    uplay: "🖥️",
    ubisoft: "🖥️",
    xbox: "🟢",
    playstation: "🔵",
    psn: "🔵",
    steam: "⚫",
    epic: "🟣",
  };
  if (!Array.isArray(value) || value.length === 0) return "None listed";
  return value.map((item) => `${icons[item.toLowerCase()] ?? "🔗"} ${item}`).join(" ");
}

function itemCount(value) {
  return Array.isArray(value) ? value.length : Number(value) || 0;
}

function numberText(value) {
  return value === null || value === undefined || value === ""
    ? "—"
    : Number(value).toLocaleString();
}

function accountStats(account) {
  return [
    `🟩 **Black Ices (${itemCount(account.blackIces)}):** ${list(account.blackIces)}`,
    `😺 **Elites (${itemCount(account.elites)}):** ${list(account.elites)}`,
    `🔶 **Universals (${itemCount(account.universals)}):** ${list(account.universals)}`,
    `🏆 **Ranked History (${itemCount(account.rankedHistory)}):** ${list(account.rankedHistory)}`,
  ].join("\n");
}

export function buildAccountEmbed(
  account,
  settings,
  publicView = false,
  page = 0,
  claimedBy = "",
  imageReference = ""
) {
  const username = account.username ?? "Rainbow Six Account";
  const image = imageReference || account.skin_link || AZAMI_IMAGE_URL;
  const embed = new EmbedBuilder()
    .setColor(getColor(settings.embed_color))
    .setAuthor({ name: publicView ? GENERATOR_NAME : GENERATOR_SHORT_NAME })
    .setTitle(publicView ? "✅ Account Generated" : `Generated Account - ${username}`)
    .setDescription(
      publicView
        ? `${claimedBy || "A member"} generated an account.\n📩 Full account details were sent by DM.`
        : "Keep these account details private."
    )
    .setImage(image);

  if (publicView) {
    return embed.addFields(
      {
        name: "Category",
        value: account.tier === "premium" ? "💎 Premium" : "🟢 Free",
        inline: true,
      },
      { name: "Username", value: username, inline: true },
      { name: "Level", value: account.level ? String(account.level) : "Not listed", inline: true }
    );
  }

  return embed.addFields(
    { name: "Username ➡️", value: username, inline: false },
    { name: "Level ➡️", value: account.level ? String(account.level) : "Not listed", inline: false },
    {
      name: "Linked Platforms ➡️",
      value: platformText(account.linkedPlatforms ?? account.linked_platforms),
      inline: false,
    },
    {
      name: "💰 Currency ➡️",
      value: `🪙 ${numberText(account.renown)}  •  💳 ${numberText(account.r6credits)}`,
      inline: false,
    },
    { name: "🎮 Inventory:", value: accountStats(account), inline: false },
    {
      name: "Login Credentials:",
      value: `\`\`\`\n${account.credentials}\n\`\`\``,
      inline: false,
    },
    { name: "Skin Link:", value: account.skin_link ?? "Not listed", inline: false }
  );
}

export function accountButtons(accountId) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`account_copy_${accountId}`)
        .setLabel("📧 Copy Email:Pass")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setLabel("❓ How to Link")
        .setStyle(ButtonStyle.Link)
        .setURL("https://www.ubisoft.com/en-us/help/account/article/linking-your-ubisoft-account/000064420")
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("Upgrade Premium ↗")
        .setStyle(ButtonStyle.Link)
        .setURL("https://discord.com/channels/@me")
    ),
  ];
}

export function subscriptionEmbed(durationText, grantedBy) {
  return new EmbedBuilder()
    .setColor("#5865f2")
    .setTitle("💎 Premium Subscription Activated!")
    .setDescription("You now have **Premium** access to the account generator!")
    .addFields(
      { name: "⏰ Duration", value: durationText, inline: true },
      { name: "⌛ Time Left", value: durationText, inline: true },
      {
        name: "📝 How to use",
        value: "Use `/generate` and choose the **Premium** category.",
        inline: false,
      }
    )
    .setFooter({ text: `Granted by ${grantedBy}` })
    .setTimestamp();
}

export function lockerCardAttachment(account) {
  const skinNames = [
    ...(account.blackIces ?? []),
    ...(account.elites ?? []),
    ...(account.universals ?? []),
  ].slice(0, 3);
  const tiles = skinNames
    .map(
      (skin, index) => `
        <rect x="${18 + index * 126}" y="70" width="114" height="88" rx="4" fill="${["#b58d2d", "#d8dce2", "#bd42d3"][index]}" />
        <text x="${24 + index * 126}" y="146" fill="#fff" font-family="Arial" font-size="10" font-weight="700">${String(skin).slice(0, 17)}</text>`
    )
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="270">
    <rect width="500" height="270" rx="16" fill="#121118"/>
    <rect x="18" y="18" width="78" height="42" fill="#3b3a40"/>
    <text x="25" y="43" fill="#ddd" font-family="Arial" font-size="10">Locker</text>
    <text x="106" y="54" fill="#fff" font-family="Arial" font-size="43" font-weight="900">${Math.max(1, skinNames.length)}</text>
    <text x="106" y="82" fill="#fff" font-family="Arial" font-size="23" font-weight="800">Locker</text>
    ${tiles || '<text x="24" y="112" fill="#aaa" font-family="Arial" font-size="16">No visual items listed</text>'}
    <line x1="18" y1="180" x2="482" y2="180" stroke="#3e3b48"/>
    <text x="24" y="214" fill="#fff" font-family="Arial" font-size="20" font-weight="800">${GENERATOR_SHORT_NAME.slice(0, 18).toUpperCase()}</text>
    <text x="24" y="241" fill="#bcb8c7" font-family="Arial" font-size="13">${String(account.username || "Generated account").slice(0, 42)}</text>
  </svg>`;
  return new AttachmentBuilder(Buffer.from(svg), {
    name: `azami-locker-${account.id}.svg`,
  });
}