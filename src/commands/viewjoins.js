import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from "discord.js";
import { getDb } from "../db.js";
import { isAdmin } from "../utils.js";

export const data = new SlashCommandBuilder()
  .setName("viewjoins")
  .setDescription("View invite join statistics");

export async function execute(interaction) {
  if (!isAdmin(interaction)) {
    return interaction.reply({ content: "❌ Admin permission required.", flags: MessageFlags.Ephemeral });
  }
  const db = getDb();
  const total = db.prepare("SELECT COALESCE(SUM(uses), 0) AS count FROM invites WHERE guild_id = ?").get(interaction.guildId).count;
  const tracked = db.prepare("SELECT COUNT(*) AS count FROM invites WHERE guild_id = ?").get(interaction.guildId).count;
  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor("#5865f2")
        .setTitle("📊 Join Statistics")
        .addFields(
          { name: "Tracked invites", value: String(tracked), inline: true },
          { name: "Joins through invites", value: String(total), inline: true }
        )
        .setTimestamp(),
    ],
    flags: MessageFlags.Ephemeral,
  });
}