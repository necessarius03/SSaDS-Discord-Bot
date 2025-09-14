import { Events, Client } from 'discord.js';
import { BadgeService } from '../services/BadgeService';
import { logger } from '../utils/logger';
import cron from 'node-cron';
import { RankingService } from '../services/RankingService';

const badgeService = new BadgeService();
const rankingService = new RankingService();

export const name = Events.ClientReady;
export const once = true;

export async function execute(client: Client) {
  logger.info(`Bot ready! Logged in as ${client.user?.tag}`);

  try {
    await badgeService.initializeDefaultBadges();
    logger.info('Default badges initialized');
  } catch (error) {
    logger.error('Error initializing default badges:', error);
  }

  cron.schedule('0 0 1 * *', async () => {
    try {
      const topContributor = await rankingService.updateMonthlyTopContributor();
      if (topContributor) {
        logger.info(`Monthly top contributor badge awarded to user: ${topContributor}`);
      }
    } catch (error) {
      logger.error('Error updating monthly top contributor:', error);
    }
  }, {
    timezone: 'UTC'
  });

  logger.info('Scheduled tasks initialized');
}