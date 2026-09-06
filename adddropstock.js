import {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  MessageFlags,
} from "discord.js";
import { addAccount, getStockCount } from "../db.js";
import { isAdmin, parseAccountInput } from "../utils.js";

export const data = new SlashCommandBuilder()
  .setName("adddropstock")
  .setDescription("Add an account to drop stock");

export async function execute(interaction) {
  if (!isAdmin(interaction)) {
    return interaction.reply({ content: "❌ Admin permission required.", flags: MessageFlags.Ephemeral });
  }
  const modal = new ModalBuilder().setCustomId("add_drop_account").setTitle("Add Drop Account");
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
  const account = parseAccountInput(submitted.fields.getTextInputValue("account"), "drop");
  if (!account) {
    return submitted.reply({ content: "❌ Invalid account format.", flags: MessageFlags.Ephemeral });
  }
  addAccount(account);
  await submitted.reply({
    content: `✅ Added to drop stock. Total: **${getStockCount("drop")}**.`,
    flags: MessageFlags.Ephemeral,
  });
}