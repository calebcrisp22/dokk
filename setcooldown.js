import { SlashCommandBuilder, MessageFlags } from "discord.js";
import { setSetting } from "../db.js";
import { isAdmin } from "../utils.js";

export const data = new SlashCommandBuilder()
  .setName("setcooldown")
  .setDescription("Set cooldown for free or premium generation")
  .addStringOption((option) =>
    option
      .setName("category")
      .setDescription("Generation category")
      .setRequired(true)
      .addChoices(
        { name: "Free", value: "cooldown_seconds" },
        { name: "Premium", value: "premium_cooldown_seconds" }
      )
  )
  .addIntegerOption((option) =>
    option.setName("seconds").setDescription("Cooldown seconds").setRequired(true).setMinValue(0).setMaxValue(86400)
  );

export async function execute(interaction) {
  if (!isAdmin(interaction)) {
    return interaction.reply({ content: "❌ Admin permission required.", flags: MessageFlags.Ephemeral });
  }
  const category = interaction.options.getString("category");
  const seconds = interaction.options.getInteger("seconds");
  setSetting(interaction.guildId, category, seconds);
  await interaction.reply({
    content: `✅ ${category === "cooldown_seconds" ? "Free" : "Premium"} cooldown set to **${seconds}s**.`,
    flags: MessageFlags.Ephemeral,
  });
}