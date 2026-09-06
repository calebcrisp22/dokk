import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getSettings, getStockCount } from "../db.js";

export const data = new SlashCommandBuilder()
  .setName("viewstock")
  .setDescription("View current free and premium stock");

export async function execute(interaction) {
  const settings = getSettings(interaction.guildId);
  const embed = new EmbedBuilder()
    .setColor(settings.embed_color)
    .setTitle("📦 Azami Generator Stock")
    .setDescription("Current account availability")
    .addFields(
      { name: "🆓 Free", value: `**${getStockCount("free")}** accounts`, inline: true },
      { name: "💎 Premium", value: `**${getStockCount("premium")}** accounts`, inline: true }
    )
    .setFooter({ text: settings.footer_text })
    .setTimestamp();
  await interaction.reply({ embeds: [embed] });
}