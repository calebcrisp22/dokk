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
  .setName("cleardropstock")
  .setDescription("Clear all unused drop stock");

export async function execute(interaction) {
  if (!isAdmin(interaction)) {
    return interaction.reply({ content: "❌ Admin permission required.", flags: MessageFlags.Ephemeral });
  }
  const count = getStockCount("drop");
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("drop_clear_confirm").setLabel(`Clear ${count} accounts`).setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("drop_clear_cancel").setLabel("Cancel").setStyle(ButtonStyle.Secondary)
  );
  await interaction.reply({
    content: `⚠️ Remove **${count}** unused drop account(s)?`,
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
  if (button.customId === "drop_clear_cancel") {
    return button.update({ content: "Cancelled.", components: [] });
  }
  const result = clearStock("drop");
  await button.update({ content: `✅ Cleared **${result.changes}** drop account(s).`, components: [] });
}