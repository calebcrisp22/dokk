import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from "discord.js";
import { addVouch } from "../db.js";

export const data = new SlashCommandBuilder()
  .setName("vouch")
  .setDescription("Leave a vouch for Azami Generator")
  .addStringOption((option) =>
    option.setName("message").setDescription("Your vouch").setRequired(true).setMaxLength(500)
  );

export async function execute(interaction) {
  const message = interaction.options.getString("message");
  addVouch(interaction.user.id, interaction.guildId, message);
  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor("#57f287")
        .setTitle("⭐ Vouch Submitted")
        .setDescription(`> ${message}`)
        .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp(),
    ],
  });
}