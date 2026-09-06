import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from "discord.js";
import { getSettings, setSetting } from "../db.js";
import { isAdmin } from "../utils.js";

export const data = new SlashCommandBuilder()
  .setName("dropcooldown")
  .setDescription("Set the cooldown between drops")
  .addIntegerOption((option) =>
    option.setName("seconds").setDescription("Seconds between drops").setRequired(true).setMinValue(0).setMaxValue(86400)
  );

export async function execute(interaction) {
  if (!isAdmin(interaction)) {
    return interaction.reply({ content: "❌ Admin permission required.", flags: MessageFlags.Ephemeral });
  }
  const seconds = interaction.options.getInteger("seconds");
  setSetting(interaction.guildId, "drop_cooldown_seconds", seconds);
  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(getSettings(interaction.guildId).embed_color)
        .setTitle("⏱️ Drop Cooldown Updated")
        .setDescription(seconds ? `A new drop can start every **${seconds}s**.` : "Drop cooldown disabled.")
        .setTimestamp(),
    ],
    flags: MessageFlags.Ephemeral,
  });
}