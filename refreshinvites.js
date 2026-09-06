import { SlashCommandBuilder, MessageFlags } from "discord.js";
import { syncInvite } from "../db.js";
import { isAdmin } from "../utils.js";

export const data = new SlashCommandBuilder()
  .setName("refreshinvites")
  .setDescription("Refresh invite counts from Discord");

export async function execute(interaction) {
  if (!isAdmin(interaction)) {
    return interaction.reply({ content: "❌ Admin permission required.", flags: MessageFlags.Ephemeral });
  }
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  try {
    const invites = await interaction.guild.invites.fetch();
    for (const invite of invites.values()) syncInvite(invite.code, invite.uses ?? 0);
    await interaction.editReply({ content: `✅ Refreshed **${invites.size}** invite(s).` });
  } catch {
    await interaction.editReply({ content: "❌ I need the **Manage Guild** permission to refresh invites." });
  }
}