import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getInvitesForUser } from "../db.js";

export const data = new SlashCommandBuilder()
  .setName("invites")
  .setDescription("View your invite count")
  .addUserOption((option) =>
    option.setName("user").setDescription("Check another user")
  );

export async function execute(interaction) {
  const user = interaction.options.getUser("user") ?? interaction.user;
  const total = getInvitesForUser(user.id, interaction.guildId);
  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor("#5865f2")
        .setTitle("📨 Invite Count")
        .setDescription(`${user} has **${total}** tracked invite(s).`)
        .setTimestamp(),
    ],
  });
}