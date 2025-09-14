import { Events, MessageReaction, User } from 'discord.js';
import { ScoringService } from '../services/ScoringService';
import { logger } from '../utils/logger';

const scoringService = new ScoringService();

export const name = Events.MessageReactionAdd;
export const once = false;

export async function execute(reaction: MessageReaction, user: User) {
  if (user.bot) return;

  try {
    if (reaction.partial) {
      await reaction.fetch();
    }

    if (reaction.message.partial) {
      await reaction.message.fetch();
    }

    const messageAuthor = reaction.message.author;
    if (messageAuthor && !messageAuthor.bot) {
      await scoringService.processReaction(messageAuthor.id, user.id);
    }
  } catch (error) {
    logger.error('Error processing reaction add event:', error);
  }
}