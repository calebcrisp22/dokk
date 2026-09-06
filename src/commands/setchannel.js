import { SlashCommandBuilder, MessageFlags } from "discord.js";
import { setSetting } from "../db.js";
import { isAdmin } from "../utils.js";

export const data = new SlashCommandBuilder()
  .setName("setchannel")
  .setDescription("Set the channel for free or premium generation")
  .addStringOption((option) =>
    option
      .setName("category")
      .setDescription("Generation category")
      .setRequired(true)
      .addChoices(
        { name: "Free", value: "gen_channel_id" },
        { name: "Premium", value: "premium_channel_id" }
      )
  )
  .addChannelOption((option) =>
    option.setName("channel").setDescription("Channel to use").setRequired(true)
  );

export async function execute(interaction) {
  if (!isAdmin(interaction)) {
    return interaction.reply({ content: "❌ Admin permission required.", flags: MessageFlags.Ephemeral });
  }
  const category = interaction.options.getString("category");
  const channel = interaction.options.getChannel("channel");
  setSetting(interaction.guildId, category, channel.id);
  await interaction.reply({
    content: `✅ ${category === "gen_channel_id" ? "Free" : "Premium"} generation channel set to ${channel}.`,
    flags: MessageFlags.Ephemeral,
  });
}