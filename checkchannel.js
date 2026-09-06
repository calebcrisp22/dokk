import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from "discord.js";
import { getSettings } from "../db.js";
import { isAdmin } from "../utils.js";

export const data = new SlashCommandBuilder()
  .setName("checkchannel")
  .setDescription("Check the configured bot channels");

export async function execute(interaction) {
  if (!isAdmin(interaction)) {
    return interaction.reply({ content: "❌ Admin permission required.", flags: MessageFlags.Ephemeral });
  }
  const settings = getSettings(interaction.guildId);
  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(settings.embed_color)
        .setTitle("🔧 Channel Configuration")
        .addFields(
          { name: "Free generation", value: settings.gen_channel_id ? `<#${settings.gen_channel_id}>` : "Not set", inline: true },
          { name: "Premium generation", value: settings.premium_channel_id ? `<#${settings.premium_channel_id}>` : "Not set", inline: true },
          { name: "Generation logs", value: settings.log_channel_id ? `<#${settings.log_channel_id}>` : "Same as command channel", inline: true }
        )
        .setTimestamp(),
    ],
    flags: MessageFlags.Ephemeral,
  });
}