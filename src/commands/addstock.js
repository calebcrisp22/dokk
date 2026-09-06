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
  );

export async function execute(interaction) {
  if (!isAdmin(interaction)) {
    return interaction.reply({ content: "❌ Admin permission required.", flags: MessageFlags.Ephemeral });
  }
  const tier = interaction.options.getString("category");
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