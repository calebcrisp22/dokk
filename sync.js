import { SlashCommandBuilder, REST, Routes, MessageFlags } from "discord.js";
import { readdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { isAdmin } from "../utils.js";

const here = dirname(fileURLToPath(import.meta.url));

export const data = new SlashCommandBuilder()
  .setName("sync")
  .setDescription("Force sync slash commands globally (admin only)");

export async function execute(interaction) {
  if (!isAdmin(interaction)) {
    return interaction.reply({ content: "❌ Admin permission required.", flags: MessageFlags.Ephemeral });
  }
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const commands = [];
  for (const file of readdirSync(here).filter((file) => file.endsWith(".js"))) {
    const command = await import(pathToFileURL(join(here, file)).href);
    if (command.data) commands.push(command.data.toJSON());
  }
  try {
    const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN);
    await rest.put(Routes.applicationCommands(interaction.client.user.id), { body: commands });
    await interaction.editReply({ content: `✅ Globally synced **${commands.length}** command(s).` });
  } catch (error) {
    await interaction.editReply({ content: `❌ Sync failed: ${error.message}` });
  }
}