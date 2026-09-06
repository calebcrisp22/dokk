import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getSettings, getStockCount } from "../db.js";

export const data = new SlashCommandBuilder()
  .setName("viewdropstock")
  .setDescription("View current drop stock");

export async function execute(interaction) {
  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(getSettings(interaction.guildId).embed_color)
        .setTitle("🎁 Drop Stock")
        .setDescription(`**${getStockCount("drop")}** account(s) ready for the next drop.`)
        .setFooter({ text: "Use /dropstart to launch an event" })
        .setTimestamp(),
    ],
  });
}