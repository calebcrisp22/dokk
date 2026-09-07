import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { setSetting } from "../db.js";
import { isAdmin } from "../utils.js";

export const data = new SlashCommandBuilder()
  .setName("setimage")
  .setDescription("Set the default image used in generator embeds")
  .addStringOption((option) =>
    option
      .setName("url")
      .setDescription("Direct image URL (https://...)")
      .setRequired(false)
  )
  .addAttachmentOption((option) =>
    option
      .setName("file")
      .setDescription("Upload an image to use in generator embeds")
      .setRequired(false)
  );

export async function execute(interaction) {
  if (!isAdmin(interaction)) {
    return interaction.reply({
      content: "❌ Admin permission required.",
      flags: MessageFlags.Ephemeral,
    });
  }

  const url = interaction.options.getString("url")?.trim();
  const file = interaction.options.getAttachment("file");
  const imageUrl = url || file?.url;

  if (!imageUrl) {
    return interaction.reply({
      content: "❌ Provide an image URL or upload an image file.",
      flags: MessageFlags.Ephemeral,
    });
  }

  try {
    const parsed = new URL(imageUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Unsupported protocol");
  } catch {
    return interaction.reply({
      content: "❌ Use a valid `http://` or `https://` image URL.",
      flags: MessageFlags.Ephemeral,
    });
  }

  setSetting(interaction.guildId, "embed_image_url", imageUrl);
  return interaction.reply({
    content: "✅ The default generator embed image was updated.",
    flags: MessageFlags.Ephemeral,
  });
}