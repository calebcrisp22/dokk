import {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  MessageFlags,
} from "discord.js";
import { getDb } from "../db.js";
import { isAdmin } from "../utils.js";

export const data = new SlashCommandBuilder()
  .setName("messages")
  .setDescription("Send an announcement DM to previous claimers");

export async function execute(interaction) {
  if (!isAdmin(interaction)) {
    return interaction.reply({ content: "❌ Admin permission required.", flags: MessageFlags.Ephemeral });
  }
  const modal = new ModalBuilder().setCustomId("announcement_modal").setTitle("Dokkabi Generator Announcement");
  const title = new TextInputBuilder().setCustomId("title").setLabel("Title").setStyle(TextInputStyle.Short).setRequired(true);
  const body = new TextInputBuilder().setCustomId("body").setLabel("Message").setStyle(TextInputStyle.Paragraph).setMaxLength(1800).setRequired(true);
  modal.addComponents(new ActionRowBuilder().addComponents(title), new ActionRowBuilder().addComponents(body));
  await interaction.showModal(modal);
  let submitted;
  try {
    submitted = await interaction.awaitModalSubmit({ time: 300_000 });
  } catch {
    return;
  }
  await submitted.reply({ content: "📨 Sending announcement DMs...", flags: MessageFlags.Ephemeral });
  const users = getDb()
    .prepare("SELECT DISTINCT user_id FROM claims WHERE guild_id = ?")
    .all(interaction.guildId);
  const embed = new EmbedBuilder()
    .setColor("#5865f2")
    .setTitle(submitted.fields.getTextInputValue("title"))
    .setDescription(submitted.fields.getTextInputValue("body"))
    .setFooter({ text: `Sent by ${interaction.user.username}` })
    .setTimestamp();
  let sent = 0;
  let failed = 0;
  for (const row of users) {
    try {
      await (await interaction.client.users.fetch(row.user_id)).send({ embeds: [embed] });
      sent++;
    } catch {
      failed++;
    }
  }
  await submitted.editReply({ content: `✅ Sent: **${sent}** • Failed: **${failed}**` });
}