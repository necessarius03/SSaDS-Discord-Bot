import { Events, Message } from 'discord.js';
import { ScoringService } from '../services/ScoringService';
import { BadgeService } from '../services/BadgeService';
import { logger } from '../utils/logger';

const scoringService = new ScoringService();
const badgeService = new BadgeService();

export const name = Events.MessageCreate;
export const once = false;

export async function execute(message: Message) {
  if (message.author.bot || !message.guild) return;

  try {
    await scoringService.processMessage(message);
    
    const newBadges = await badgeService.checkAndAwardBadges(message.author.id);
    
    if (newBadges.length > 0) {
      const badgeText = newBadges.map(badge => `🎖️ **${badge}**`).join(', ');
      await message.reply({
        content: `Congratulations! You earned new badge(s): ${badgeText}`,
        allowedMentions: { repliedUser: false },
      });
    }
  } catch (error) {
    logger.error('Error processing message create event:', error);
  }
}