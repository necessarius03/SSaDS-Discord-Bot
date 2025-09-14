import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { ScoringService } from '../services/ScoringService';
import { BadgeService } from '../services/BadgeService';
import { UserService } from '../services/UserService';
import { database } from '../utils/database';
import { PointCategory } from '@prisma/client';

const scoringService = new ScoringService();
const badgeService = new BadgeService();
const userService = new UserService();

export const data = new SlashCommandBuilder()
  .setName('admin')
  .setDescription('Admin commands for citizen scoring system')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand(subcommand =>
    subcommand
      .setName('adjust-points')
      .setDescription('Manually adjust a user\'s points')
      .addUserOption(option =>
        option.setName('user')
          .setDescription('The user to adjust points for')
          .setRequired(true)
      )
      .addIntegerOption(option =>
        option.setName('points')
          .setDescription('Points to add (negative to subtract)')
          .setRequired(true)
      )
      .addStringOption(option =>
        option.setName('reason')
          .setDescription('Reason for adjustment')
          .setRequired(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('award-badge')
      .setDescription('Award a badge to a user')
      .addUserOption(option =>
        option.setName('user')
          .setDescription('The user to award the badge to')
          .setRequired(true)
      )
      .addStringOption(option =>
        option.setName('badge')
          .setDescription('The badge name to award')
          .setRequired(true)
          .setAutocomplete(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('user-history')
      .setDescription('View a user\'s point history')
      .addUserOption(option =>
        option.setName('user')
          .setDescription('The user to view history for')
          .setRequired(true)
      )
      .addIntegerOption(option =>
        option.setName('limit')
          .setDescription('Number of recent entries to show (default: 10)')
          .setRequired(false)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('server-stats')
      .setDescription('View server statistics')
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    await interaction.deferReply({ ephemeral: true });

    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'adjust-points':
        await handleAdjustPoints(interaction);
        break;
      case 'award-badge':
        await handleAwardBadge(interaction);
        break;
      case 'user-history':
        await handleUserHistory(interaction);
        break;
      case 'server-stats':
        await handleServerStats(interaction);
        break;
    }
  } catch (error) {
    console.error('Error executing admin command:', error);
    if (interaction.deferred) {
      await interaction.editReply('An error occurred while executing the command.');
    } else {
      await interaction.reply('An error occurred while executing the command.');
    }
  }
}

async function handleAdjustPoints(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser('user', true);
  const points = interaction.options.getInteger('points', true);
  const reason = interaction.options.getString('reason', true);

  await userService.ensureUserExists(user);
  
  await scoringService.awardPoints(
    user.id,
    points,
    reason,
    PointCategory.ADMIN_ADJUSTMENT,
    interaction.user.id
  );

  const embed = new EmbedBuilder()
    .setTitle('✅ Points Adjusted')
    .setColor(points > 0 ? 0x00FF00 : 0xFF0000)
    .addFields([
      { name: 'User', value: user.displayName || user.username, inline: true },
      { name: 'Points', value: points.toString(), inline: true },
      { name: 'Reason', value: reason, inline: false },
    ])
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

async function handleAwardBadge(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser('user', true);
  const badgeName = interaction.options.getString('badge', true);

  await userService.ensureUserExists(user);

  const badge = await badgeService.getBadgeByName(badgeName);
  if (!badge) {
    await interaction.editReply('Badge not found.');
    return;
  }

  await badgeService.awardBadgeToUser(user.id, badge.id, interaction.user.id);

  const embed = new EmbedBuilder()
    .setTitle('🎖️ Badge Awarded')
    .setColor(0x00AE86)
    .addFields([
      { name: 'User', value: user.displayName || user.username, inline: true },
      { name: 'Badge', value: `${badge.icon} ${badge.name}`, inline: true },
    ])
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

async function handleUserHistory(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser('user', true);
  const limit = interaction.options.getInteger('limit') || 10;

  const history = await getUserPointHistory(user.id, limit);
  
  if (history.length === 0) {
    await interaction.editReply('No point history found for this user.');
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(`📊 Point History for ${user.displayName || user.username}`)
    .setColor(0x00AE86)
    .setTimestamp();

  const description = history
    .map(entry => {
      const date = new Date(entry.createdAt).toLocaleDateString();
      const sign = entry.points > 0 ? '+' : '';
      return `${sign}${entry.points} pts - ${entry.reason} (${date})`;
    })
    .join('\n');

  embed.setDescription(description);

  await interaction.editReply({ embeds: [embed] });
}

async function handleServerStats(interaction: ChatInputCommandInteraction) {
  const stats = await getServerStats();

  const embed = new EmbedBuilder()
    .setTitle('📈 Server Statistics')
    .setColor(0x00AE86)
    .addFields([
      { name: 'Total Users', value: stats.totalUsers.toString(), inline: true },
      { name: 'Active Users (7 days)', value: stats.activeUsers.toString(), inline: true },
      { name: 'Total Points Awarded', value: stats.totalPoints.toLocaleString(), inline: true },
      { name: 'Messages Tracked', value: stats.totalMessages.toLocaleString(), inline: true },
      { name: 'Voice Minutes', value: stats.totalVoiceMinutes.toLocaleString(), inline: true },
      { name: 'Badges Awarded', value: stats.totalBadges.toString(), inline: true },
    ])
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

async function getServerStats() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [
    totalUsers,
    activeUsers,
    totalPointsResult,
    totalMessagesResult,
    totalVoiceMinutesResult,
    totalBadges,
  ] = await Promise.all([
    database.prisma.user.count(),
    database.prisma.user.count({
      where: { lastActive: { gte: sevenDaysAgo } },
    }),
    database.prisma.user.aggregate({ _sum: { totalPoints: true } }),
    database.prisma.user.aggregate({ _sum: { messagesCount: true } }),
    database.prisma.user.aggregate({ _sum: { voiceMinutes: true } }),
    database.prisma.userBadge.count(),
  ]);

  return {
    totalUsers,
    activeUsers,
    totalPoints: totalPointsResult._sum.totalPoints || 0,
    totalMessages: totalMessagesResult._sum.messagesCount || 0,
    totalVoiceMinutes: totalVoiceMinutesResult._sum.voiceMinutes || 0,
    totalBadges,
  };
}

async function getUserPointHistory(userId: string, limit: number) {
  return database.prisma.pointHistory.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}