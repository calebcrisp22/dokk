import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getSettings, getStockCount } from "../db.js";
import { activeDrops } from "./dropstart.js";

export const data = new SlashCommandBuilder()
  .setName("dropstatus")
  .setDescription("Check drop status");

export async function execute(interaction) {
  const active = activeDrops.get(interaction.guildId);
  const embed = new EmbedBuilder()
    .setColor(getSettings(interaction.guildId).embed_color)
    .setTitle("🎁 Drop Status")
    .addFields(
      { name: "Active", value: active ? "✅ Running" : "❌ None", inline: true },
      { name: "Drop Stock", value: `**${getStockCount("drop")}**`, inline: true }
    )
    .setTimestamp();
  if (active) {
    embed.addFields(
      { name: "Claimed", value: `${active.claimed.size}/${active.slots}`, inline: true },
      { name: "Channel", value: `<#${active.message.channelId}>`, inline: true }
    );
  }
  await interaction.reply({ embeds: [embed] });
}