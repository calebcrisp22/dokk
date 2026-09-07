import {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  MessageFlags,
} from "discord.js";
import { addAccount, getStockCount } from "../db.js";
import { isAdmin, parseAccountInput, parseStockFile } from "../utils.js";

export const data = new SlashCommandBuilder()
  .setName("addstock")
  .setDescription("Add one account to free or premium stock")
  .addStringOption((option) =>
    option
      .setName("category")
      .setDescription("Stock category")
      .setRequired(true)
      .addChoices(
        { name: "Free", value: "free" },
        { name: "Premium", value: "premium" }
      )
  )
  .addAttachmentOption((option) =>
    option
      .setName("file")
      .setDescription("JSON, CSV, or TXT file containing one or more accounts")
      .setRequired(false)
  );

export async function execute(interaction) {
  if (!isAdmin(interaction)) {
    return interaction.reply({ content: "❌ Admin permission required.", flags: MessageFlags.Ephemeral });
  }
  const tier = interaction.options.getString("category");
  const attachment = interaction.options.getAttachment("file");

  if (attachment) {
    const filename = attachment.name ?? "stock.txt";
    if (!/\.(json|csv|txt)$/i.test(filename)) {
      return interaction.reply({
        content: "❌ Upload a `.json`, `.csv`, or `.txt` stock file.",
        flags: MessageFlags.Ephemeral,
      });
    }
    if (attachment.size && attachment.size > 5 * 1024 * 1024) {
      return interaction.reply({
        content: "❌ Stock files must be 5 MB or smaller.",
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    try {
      const response = await fetch(attachment.url);
      if (!response.ok) throw new Error(`Download failed with status ${response.status}`);
      const imported = parseStockFile(await response.text(), tier, filename);
      if (!imported.accounts.length) {
        return interaction.editReply({
          content: "❌ No valid accounts were found. Use JSON objects, CSV rows, or one `email:password` per line.",
        });
      }
      for (const account of imported.accounts) addAccount(account);
      const skipped = imported.invalid + (imported.truncated ? 1 : 0);
      return interaction.editReply({
        content: [
          `✅ Imported **${imported.accounts.length}** account(s) into **${tier}** stock.`,
          skipped ? `Skipped **${skipped}** invalid or extra record(s).` : "",
          `Total available: **${getStockCount(tier)}**.`,
        ].filter(Boolean).join(" "),
      });
    } catch (error) {
      console.error("Stock file import failed:", error);
      return interaction.editReply({
        content: "❌ I could not read that stock file. Check that it is valid JSON, CSV, or TXT.",
      });
    }
  }

  const modal = new ModalBuilder().setCustomId(`addstock_${tier}`).setTitle(`Add ${tier} account`);
  const input = new TextInputBuilder()
    .setCustomId("account")
    .setLabel("JSON or email:password")
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('{"credentials":"email:pass","username":"Player",...}')
    .setRequired(true);
  modal.addComponents(new ActionRowBuilder().addComponents(input));
  await interaction.showModal(modal);
  let submitted;
  try {
    submitted = await interaction.awaitModalSubmit({ time: 300_000 });
  } catch {
    return;
  }
  const account = parseAccountInput(submitted.fields.getTextInputValue("account"), tier);
  if (!account) {
    return submitted.reply({ content: "❌ Invalid account format.", flags: MessageFlags.Ephemeral });
  }
  addAccount(account);
  await submitted.reply({
    content: `✅ Added account to **${tier}** stock. Total: **${getStockCount(tier)}**.`,
    flags: MessageFlags.Ephemeral,
  });
}