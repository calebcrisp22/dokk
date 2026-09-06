import { SlashCommandBuilder, MessageFlags } from "discord.js";
import { isAdmin } from "../utils.js";
import { activeDrops } from "./dropstart.js";

export const data = new SlashCommandBuilder()
  .setName("dropstop")
  .setDescription("Stop the active drop");

export async function execute(interaction) {
  if (!isAdmin(interaction)) {
    return interaction.reply({ content: "❌ Admin permission required.", flags: MessageFlags.Ephemeral });
  }
  const active = activeDrops.get(interaction.guildId);
  if (!active) {
    return interaction.reply({ content: "❌ No active drop.", flags: MessageFlags.Ephemeral });
  }
  active.collector.stop("admin_stopped");
  activeDrops.delete(interaction.guildId);
  await interaction.reply({ content: "✅ Active drop stopped.", flags: MessageFlags.Ephemeral });
}