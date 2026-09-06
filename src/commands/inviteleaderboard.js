import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getInviteLeaderboard } from "../db.js";

export const data = new SlashCommandBuilder()
  .setName("inviteleaderboard")
  .setDescription("View the invite leaderboard");

export async function execute(interaction) {
  const medals = ["🥇", "🥈", "🥉"];
  const rows = getInviteLeaderboard(interaction.guildId);
  const description = rows.length
    ? rows.map((row, index) => `${medals[index] ?? `**${index + 1}.**`} <@${row.owner_id}> — **${row.total}** invite(s)`).join("\n")
    : "No tracked invites yet. Use `/createinvite` to get started.";
  await interaction.reply({
    embeds: [new EmbedBuilder().setColor("#5865f2").setTitle("📨 Invite Leaderboard").setDescription(description).setTimestamp()],
  });
}