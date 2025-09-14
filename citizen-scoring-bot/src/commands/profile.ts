import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';
import { UserService } from '../services/UserService';
import { BadgeService } from '../services/BadgeService';
import { RankingService } from '../services/RankingService';

const userService = new UserService();
const badgeService = new BadgeService();
const rankingService = new RankingService();

export const data = new SlashCommandBuilder()
  .setName('profile')
  .setDescription('View your citizen profile or another user\'s profile')
  .addUserOption(option =>
    option.setName('user')
      .setDescription('The user whose profile to view')
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    await interaction.deferReply();

    const targetUser = interaction.options.getUser('user') || interaction.user;
    await userService.ensureUserExists(targetUser);

    const [stats, badges, rankings] = await Promise.all([
      userService.getUserStats(targetUser.id),
      badgeService.getUserBadges(targetUser.id),
      rankingService.getUserRankings(targetUser.id),
    ]);

    if (!stats) {
      await interaction.editReply('User not found in the database.');
      return;
    }

    const nextLevelExp = userService.calculateExperienceForNextLevel(stats.level);
    const progressToNext = stats.experience - userService.calculateExperienceForNextLevel(stats.level - 1);
    const expNeededForNext = nextLevelExp - userService.calculateExperienceForNextLevel(stats.level - 1);
    
    const embed = new EmbedBuilder()
      .setTitle(`${targetUser.displayName || targetUser.username}'s Citizen Profile`)
      .setThumbnail(targetUser.displayAvatarURL())
      .setColor(0x00AE86)
      .addFields([
        {
          name: '📊 Stats',
          value: [
            `**Points:** ${stats.totalPoints.toLocaleString()}`,
            `**Level:** ${stats.level}`,
            `**Experience:** ${stats.experience.toLocaleString()}`,
            `**Progress to Level ${stats.level + 1}:** ${progressToNext}/${expNeededForNext} XP`,
          ].join('\n'),
          inline: true,
        },
        {
          name: '🏆 Rankings',
          value: [
            `**Overall:** #${rankings.total}`,
            `**Weekly:** #${rankings.weekly}`,
            `**Monthly:** #${rankings.monthly}`,
          ].join('\n'),
          inline: true,
        },
        {
          name: '💬 Activity',
          value: [
            `**Messages:** ${stats.messagesCount.toLocaleString()}`,
            `**Voice Minutes:** ${stats.voiceMinutes.toLocaleString()}`,
            `**Reactions Given:** ${stats.reactionsGiven.toLocaleString()}`,
            `**Reactions Received:** ${stats.reactionsReceived.toLocaleString()}`,
          ].join('\n'),
          inline: false,
        },
      ]);

    if (badges.length > 0) {
      const badgeText = badges
        .slice(0, 10)
        .map(ub => `${ub.badge.icon} ${ub.badge.name}`)
        .join(' • ');
      
      embed.addFields([{
        name: `🎖️ Badges (${badges.length})`,
        value: badgeText + (badges.length > 10 ? ` and ${badges.length - 10} more...` : ''),
        inline: false,
      }]);
    }

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error executing profile command:', error);
    if (interaction.deferred) {
      await interaction.editReply('An error occurred while fetching the profile.');
    } else {
      await interaction.reply('An error occurred while fetching the profile.');
    }
  }
}