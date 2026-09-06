import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from "discord.js";
import { getSubscription } from "../db.js";
import { formatDuration, isAdmin } from "../utils.js";

export const data = new SlashCommandBuilder()
  .setName("checksub")
  .setDescription("Check a premium subscription")
  .addUserOption((option) => option.setName("user").setDescription("User to check"));

export async function execute(interaction) {
  const target = interaction.options.getUser("user") ?? interaction.user;
  if (target.id !== interaction.user.id && !isAdmin(interaction)) {
    return interaction.reply({ content: "❌ You can only check your own subscription.", flags: MessageFlags.Ephemeral });
  }
  const subscription = getSubscription(target.id, interaction.guildId);
  const remaining = (subscription?.expires_at ?? 0) - Math.floor(Date.now() / 1000);
  if (!subscription || remaining <= 0) {
    return interaction.reply({
      embeds: [new EmbedBuilder().setColor("#ed4245").setTitle("No Active Subscription").setDescription(`${target} does not have active Premium access.`)],
      flags: MessageFlags.Ephemeral,
    });
  }
  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor("#5865f2")
        .setTitle("💎 Premium Subscription")
        .addFields(
          { name: "User", value: `${target}`, inline: true },
          { name: "Time Left", value: formatDuration(remaining), inline: true },
          { name: "Expires", value: `<t:${subscription.expires_at}:F>` },
          { name: "Granted By", value: subscription.granted_by }
        )
        .setTimestamp(),
    ],
    flags: MessageFlags.Ephemeral,
  });
}