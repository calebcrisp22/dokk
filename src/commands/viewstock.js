import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getSettings, getStockCount } from "../db.js";
import { DOKKABI_IMAGE_URL } from "../utils.js";

export const data = new SlashCommandBuilder()
  .setName("viewstock")
  .setDescription("View current free and premium stock");

export async function execute(interaction) {
  const settings = getSettings(interaction.guildId);
  const embed = new EmbedBuilder()
    .setColor(settings.embed_color)
    .setTitle("📦 Dokkabi Generator Stock")
    .setDescription("Current account availability")
    .addFields(
      { name: "🆓 Free", value: `**${getStockCount("free")}** accounts`, inline: true },
      { name: "💎 Premium", value: `**${getStockCount("premium")}** accounts`, inline: true }
    )
    .setImage(settings.embed_image_url || DOKKABI_IMAGE_URL)
    .setFooter({ text: settings.footer_text })
    .setTimestamp();
  await interaction.reply({ embeds: [embed] });
}