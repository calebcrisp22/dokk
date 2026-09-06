import { SlashCommandBuilder, MessageFlags } from "discord.js";
import { grantSubscription } from "../db.js";
import { isAdmin, parseDuration, subscriptionEmbed } from "../utils.js";

export const data = new SlashCommandBuilder()
  .setName("setsubscription")
  .setDescription("Grant a premium subscription")
  .addUserOption((option) =>
    option.setName("user").setDescription("User to grant access to").setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("duration")
      .setDescription("Duration such as 11d, 12h, or 30d")
      .setRequired(true)
  );

export async function execute(interaction) {
  if (!isAdmin(interaction)) {
    return interaction.reply({ content: "❌ Admin permission required.", flags: MessageFlags.Ephemeral });
  }
  const duration = interaction.options.getString("duration");
  const seconds = parseDuration(duration);
  if (!seconds) {
    return interaction.reply({ content: "❌ Use a duration such as `11d`, `12h`, or `30m`.", flags: MessageFlags.Ephemeral });
  }
  const days = seconds / 86400;
  const expiresAt = grantSubscription(
    interaction.options.getUser("user").id,
    interaction.guildId,
    days,
    interaction.user.username
  );
  const target = interaction.options.getUser("user");
  try {
    await target.send({
      embeds: [subscriptionEmbed(duration, interaction.user.username)],
    });
  } catch {
    // Access remains active even when DMs are closed.
  }
  await interaction.reply({
    content: `✅ Premium subscription granted to ${target} until <t:${expiresAt}:F>.`,
    flags: MessageFlags.Ephemeral,
  });
}