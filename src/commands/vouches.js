import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getVouches } from "../db.js";

export const data = new SlashCommandBuilder()
  .setName("vouches")
  .setDescription("View recent vouches");

export async function execute(interaction) {
  const rows = getVouches(interaction.guildId);
  const description = rows.length
    ? rows.map((row) => `**#${row.id}** <@${row.user_id}>\n> ${row.message}`).join("\n\n")
    : "No vouches yet. Use `/vouch` to add one.";
  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor("#57f287")
        .setTitle("⭐ Azami Generator Vouches")
        .setDescription(description)
        .setFooter({ text: "Admins can remove an entry with /deletevouch <id>" })
        .setTimestamp(),
    ],
  });
}