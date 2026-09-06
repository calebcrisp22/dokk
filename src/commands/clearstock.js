import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} from "discord.js";
import { clearStock, getStockCount } from "../db.js";
import { isAdmin } from "../utils.js";

export const data = new SlashCommandBuilder()
  .setName("clearstock")
  .setDescription("Clear all unused accounts from a tier")
  .addStringOption((option) =>
    option
      .setName("category")
      .setDescription("Tier to clear")
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
  const count = getStockCount(tier);
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`clear_confirm_${tier}`).setLabel(`Clear ${count} accounts`).setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("clear_cancel").setLabel("Cancel").setStyle(ButtonStyle.Secondary)
  );
  await interaction.reply({
    content: `⚠️ This permanently removes **${count} unused ${tier} accounts**. Continue?`,
    components: [row],
    flags: MessageFlags.Ephemeral,
  });
  const message = await interaction.fetchReply();
  let button;
  try {
    button = await message.awaitMessageComponent({ time: 30_000 });
  } catch {
    return interaction.editReply({ content: "Timed out.", components: [] });
  }
  if (button.customId === "clear_cancel") {
    return button.update({ content: "Cancelled.", components: [] });
  }
  const result = clearStock(tier);
  await button.update({ content: `✅ Cleared **${result.changes}** ${tier} account(s).`, components: [] });
}