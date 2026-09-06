import {
  SlashCommandBuilder,
  MessageFlags,
} from "discord.js";
import {
  addClaim,
  getCooldown,
  getSettings,
  hasActiveSubscription,
  popAccount,
  setCooldown,
} from "../db.js";
import {
  accountButtons,
  buildAccountEmbed,
  isAdmin,
  lockerCardAttachment,
} from "../utils.js";

export const data = new SlashCommandBuilder()
  .setName("generate")
  .setDescription("Generate a Rainbow Six Siege account")
  .addStringOption((option) =>
    option
      .setName("category")
      .setDescription("Account category")
      .setRequired(true)
      .addChoices(
        { name: "Free", value: "free" },
        { name: "Premium", value: "premium" }
      )
  );

export async function execute(interaction) {
  const tier = interaction.options.getString("category");
  const settings = getSettings(interaction.guildId);
  const channelId =
    tier === "premium" ? settings.premium_channel_id : settings.gen_channel_id;

  if (channelId && interaction.channelId !== channelId && !isAdmin(interaction)) {
    return interaction.reply({
      content: `❌ Please use this command in <#${channelId}>.`,
      flags: MessageFlags.Ephemeral,
    });
  }
  if (tier === "premium" && !hasActiveSubscription(interaction.user.id, interaction.guildId)) {
    return interaction.reply({
      content: "❌ You need an active **Premium** subscription to use this category.",
      flags: MessageFlags.Ephemeral,
    });
  }

  const remaining = getCooldown(interaction.user.id, interaction.guildId, tier);
  if (remaining > 0) {
    return interaction.reply({
      content: `⏰ Cooldown: **${remaining}s** remaining.`,
      flags: MessageFlags.Ephemeral,
    });
  }

  const account = popAccount(tier);
  if (!account) {
    return interaction.reply({
      content: `❌ No **${tier}** accounts are available right now.`,
      flags: MessageFlags.Ephemeral,
    });
  }

  // Keep the acknowledgement public so everyone in the generate channel sees
  // Discord's temporary "thinking" state while the account is being delivered.
  await interaction.deferReply();
  const cooldown =
    tier === "premium" ? settings.premium_cooldown_seconds : settings.cooldown_seconds;
  setCooldown(interaction.user.id, interaction.guildId, tier, cooldown);
  addClaim(interaction.user.id, interaction.guildId, account.id, tier);

  try {
    const dm = await interaction.user.createDM();
    const card = account.skin_link ? null : lockerCardAttachment(account);
    const dmPayload = {
      components: accountButtons(account.id),
    };
    if (card) {
      dmPayload.embeds = [
        buildAccountEmbed(account, settings, false, 0, "", `attachment://${card.name}`),
      ];
      dmPayload.files = [card];
    } else {
      dmPayload.embeds = [buildAccountEmbed(account, settings, false)];
    }
    const dmMessage = await dm.send(dmPayload);

    const collector = dmMessage.createMessageComponentCollector({ time: 900_000 });
    collector.on("collect", async (button) => {
      if (button.user.id !== interaction.user.id) {
        return button.reply({
          content: "This account message belongs to another user.",
          flags: MessageFlags.Ephemeral,
        });
      }
      if (button.customId.startsWith(`account_copy_${account.id}`)) {
        return button.reply({
          content: `\`\`\`\n${account.credentials}\n\`\`\``,
          flags: MessageFlags.Ephemeral,
        });
      }
    });

    const publicCard = account.skin_link ? null : lockerCardAttachment(account);
    const publicEmbed = buildAccountEmbed(
      account,
      settings,
      true,
      0,
      `<@${interaction.user.id}>`,
      publicCard ? `attachment://${publicCard.name}` : account.skin_link
    );
    await interaction.editReply({
      content: "",
      embeds: [publicEmbed],
      ...(publicCard ? { files: [publicCard] } : {}),
    });
  } catch {
    await interaction.editReply({
      content: "❌ I couldn't send the DM. Enable DMs from server members and try again.",
    });
  }
}