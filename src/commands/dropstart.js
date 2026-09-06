import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  MessageFlags,
} from "discord.js";
import { addAccount, getSettings, getStockCount, popAccount, setSetting } from "../db.js";
import { AZAMI_IMAGE_URL, accountButtons, buildAccountEmbed, isAdmin, lockerCardAttachment } from "../utils.js";

export const activeDrops = new Map();

export const data = new SlashCommandBuilder()
  .setName("dropstart")
  .setDescription("Start a drop event")
  .addIntegerOption((option) =>
    option.setName("slots").setDescription("Number of accounts to drop").setMinValue(1)
  )
  .addIntegerOption((option) =>
    option.setName("seconds").setDescription("Event duration").setMinValue(10).setMaxValue(600)
  );

export async function execute(interaction) {
  if (!isAdmin(interaction)) {
    return interaction.reply({ content: "❌ Admin permission required.", flags: MessageFlags.Ephemeral });
  }
  if (activeDrops.has(interaction.guildId)) {
    return interaction.reply({ content: "❌ A drop is already active.", flags: MessageFlags.Ephemeral });
  }
  const settings = getSettings(interaction.guildId);
  const now = Math.floor(Date.now() / 1000);
  const wait = now - settings.last_drop_at;
  if (settings.drop_cooldown_seconds > wait) {
    return interaction.reply({
      content: `⏰ Drop cooldown: wait **${settings.drop_cooldown_seconds - wait}s**.`,
      flags: MessageFlags.Ephemeral,
    });
  }
  const slots = Math.min(
    interaction.options.getInteger("slots") ?? getStockCount("drop"),
    getStockCount("drop")
  );
  const seconds = interaction.options.getInteger("seconds") ?? 60;
  if (!slots) {
    return interaction.reply({ content: "❌ Drop stock is empty. Use `/adddropstock` first.", flags: MessageFlags.Ephemeral });
  }
  const embed = new EmbedBuilder()
    .setColor("#5865f2")
    .setTitle("🎁 Azami Account Drop")
    .setDescription(`**${slots}** account(s) are available. First come, first served.`)
    .addFields(
      { name: "Available", value: `${slots}`, inline: true },
      { name: "Duration", value: `${seconds}s`, inline: true }
    )
    .setImage(AZAMI_IMAGE_URL)
    .setFooter({ text: settings.footer_text });
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("drop_claim").setLabel("🎁 Claim Account").setStyle(ButtonStyle.Success)
  );
  const message = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
  const claimed = new Set();
  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: seconds * 1000,
  });
  activeDrops.set(interaction.guildId, { collector, message, claimed, slots });
  setSetting(interaction.guildId, "last_drop_at", now);
  collector.on("collect", async (button) => {
    if (claimed.has(button.user.id)) {
      return button.reply({ content: "You already claimed this drop.", flags: MessageFlags.Ephemeral });
    }
    if (claimed.size >= slots) {
      return button.reply({ content: "All accounts have been claimed.", flags: MessageFlags.Ephemeral });
    }
    const account = popAccount("drop");
    if (!account) return button.reply({ content: "Drop stock is empty.", flags: MessageFlags.Ephemeral });
    try {
      const dm = await button.user.createDM();
      await dm.send({ embeds: [buildAccountEmbed(account, settings)] });
      claimed.add(button.user.id);
      await button.reply({ content: "✅ Account sent to your DMs.", flags: MessageFlags.Ephemeral });
    } catch {
      addAccount({ ...account, tier: "drop" });
      await button.reply({ content: "❌ Enable DMs from server members and try again.", flags: MessageFlags.Ephemeral });
    }
  });
  collector.on("end", async () => {
    activeDrops.delete(interaction.guildId);
    await message.edit({
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("drop_ended")
            .setLabel(`Drop ended • ${claimed.size}/${slots} claimed`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true)
        ),
      ],
    }).catch(() => {});
  });
}