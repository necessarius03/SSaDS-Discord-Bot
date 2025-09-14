import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';
import { RankingService } from '../services/RankingService';

const rankingService = new RankingService();

export const data = new SlashCommandBuilder()
  .setName('leaderboard')
  .setDescription('View the citizen scoring leaderboard')
  .addStringOption(option =>
    option.setName('period')
      .setDescription('Time period for the leaderboard')
      .setRequired(false)
      .addChoices(
        { name: 'All Time', value: 'all' },
        { name: 'Weekly', value: 'weekly' },
        { name: 'Monthly', value: 'monthly' }
      )
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    await interaction.deferReply();

    const period = interaction.options.getString('period') || 'all';
    let rankings;
    let title;

    switch (period) {
      case 'weekly':
        rankings = await rankingService.getWeeklyLeaderboard(10);
        title = '🏆 Weekly Leaderboard';
        break;
      case 'monthly':
        rankings = await rankingService.getMonthlyLeaderboard(10);
        title = '🏆 Monthly Leaderboard';
        break;
      default:
        rankings = await rankingService.getLeaderboard(10);
        title = '🏆 All-Time Leaderboard';
        break;
    }

    if (rankings.length === 0) {
      await interaction.editReply('No rankings found for this period.');
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setColor(0x00AE86)
      .setTimestamp();

    const description = rankings
      .map((entry, index) => {
        const medal = index < 3 ? ['🥇', '🥈', '🥉'][index] : `**${entry.rank}.**`;
        const displayName = entry.displayName || entry.username;
        return `${medal} ${displayName} - ${entry.points.toLocaleString()} pts (Lv.${entry.level})`;
      })
      .join('\n');

    embed.setDescription(description);

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error executing leaderboard command:', error);
    if (interaction.deferred) {
      await interaction.editReply('An error occurred while fetching the leaderboard.');
    } else {
      await interaction.reply('An error occurred while fetching the leaderboard.');
    }
  }
}