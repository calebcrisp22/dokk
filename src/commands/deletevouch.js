import { SlashCommandBuilder, MessageFlags } from "discord.js";
import { deleteVouch, getDb } from "../db.js";
import { isAdmin } from "../utils.js";

export const data = new SlashCommandBuilder()
  .setName("deletevouch")
  .setDescription("Delete a vouch by ID")
  .addIntegerOption((option) =>
    option.setName("id").setDescription("Vouch ID from /vouches").setRequired(true).setMinValue(1)
  );

export async function execute(interaction) {
  if (!isAdmin(interaction)) {
    return interaction.reply({ content: "❌ Admin permission required.", flags: MessageFlags.Ephemeral });
  }
  const id = interaction.options.getInteger("id");
  const result = deleteVouch(id, interaction.guildId);
  await interaction.reply({
    content: result.changes ? `✅ Deleted vouch **#${id}**.` : `❌ Vouch **#${id}** was not found.`,
    flags: MessageFlags.Ephemeral,
  });
}