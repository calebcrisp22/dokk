import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from "discord.js";
import { saveInvite } from "../db.js";

export const data = new SlashCommandBuilder()
  .setName("createinvite")
  .setDescription("Create a tracked invite link");

export async function execute(interaction) {
  let invite;
  try {
    invite = await interaction.channel.createInvite({
      maxAge: 0,
      maxUses: 0,
      unique: true,
      reason: `Tracked invite created by ${interaction.user.tag}`,
    });
  } catch {
    return interaction.reply({
      content: "❌ I need the **Create Invite** permission in this channel.",
      flags: MessageFlags.Ephemeral,
    });
  }
  saveInvite(invite.code, interaction.user.id, interaction.guildId);
  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor("#5865f2")
        .setTitle("📨 Invite Created")
        .setDescription(`Your tracked invite:\n**https://discord.gg/${invite.code}**`)
        .setFooter({ text: "Use /invites to check your count" })
        .setTimestamp(),
    ],
    flags: MessageFlags.Ephemeral,
  });
}