import { SlashCommandBuilder, MessageFlags } from "discord.js";
import { getDb } from "../db.js";
import { isAdmin } from "../utils.js";

export const data = new SlashCommandBuilder()
  .setName("resetjoins")
  .setDescription("Reset invite join counts");

export async function execute(interaction) {
  if (!isAdmin(interaction)) {
    return interaction.reply({ content: "❌ Admin permission required.", flags: MessageFlags.Ephemeral });
  }
  getDb().prepare("UPDATE invites SET uses = 0 WHERE guild_id = ?").run(interaction.guildId);
  await interaction.reply({ content: "✅ Invite join counts reset.", flags: MessageFlags.Ephemeral });
}