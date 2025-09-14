import { Message, GuildMember } from 'discord.js';
import { PointCategory } from '@prisma/client';
import { database } from '../utils/database';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import { UserService } from './UserService';

export class ScoringService {
  private userService: UserService;
  private spamTracker: Map<string, { count: number; lastMessage: number }> = new Map();

  constructor() {
    this.userService = new UserService();
  }

  async awardPoints(
    userId: string,
    points: number,
    reason: string,
    category: PointCategory,
    adminId?: string
  ): Promise<void> {
    try {
      await database.prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error('User not found');

        const newTotalPoints = Math.max(0, user.totalPoints + points);
        const newExperience = Math.max(0, user.experience + (points > 0 ? points : 0));
        const newLevel = this.userService.calculateLevel(newExperience);

        await tx.user.update({
          where: { id: userId },
          data: {
            totalPoints: newTotalPoints,
            experience: newExperience,
            level: newLevel,
            lastActive: new Date(),
          },
        });

        await tx.pointHistory.create({
          data: {
            userId,
            points,
            reason,
            category,
            adminId,
          },
        });
      });

      logger.info(`Awarded ${points} points to user ${userId} for: ${reason}`);
    } catch (error) {
      logger.error('Error awarding points:', error);
      throw error;
    }
  }

  async processMessage(message: Message): Promise<void> {
    if (message.author.bot) return;

    try {
      await this.userService.ensureUserExists(message.author);

      if (this.isSpam(message)) {
        await this.awardPoints(
          message.author.id,
          config.scoring.spamPenalty,
          'Spam detection',
          PointCategory.SPAM_PENALTY
        );
        return;
      }

      const isQualityMessage = this.isQualityMessage(message);
      const points = isQualityMessage
        ? config.scoring.baseMessagePoints * config.scoring.qualityMessageMultiplier
        : config.scoring.baseMessagePoints;

      await this.awardPoints(
        message.author.id,
        points,
        isQualityMessage ? 'Quality message' : 'Regular message',
        isQualityMessage ? PointCategory.QUALITY_MESSAGE : PointCategory.MESSAGE
      );

      await database.prisma.user.update({
        where: { id: message.author.id },
        data: {
          messagesCount: { increment: 1 },
        },
      });
    } catch (error) {
      logger.error('Error processing message:', error);
    }
  }

  async processReaction(messageAuthorId: string, reactorId: string): Promise<void> {
    if (messageAuthorId === reactorId) return;

    try {
      await this.userService.ensureUserExists({ id: reactorId } as any);
      await this.userService.ensureUserExists({ id: messageAuthorId } as any);

      const reactionCount = await this.getMessageReactionCount(messageAuthorId);
      
      if (reactionCount >= config.scoring.reactionBonusThreshold) {
        await this.awardPoints(
          messageAuthorId,
          2,
          `Reaction bonus (${reactionCount} reactions)`,
          PointCategory.REACTION_BONUS
        );
      }

      await database.prisma.user.update({
        where: { id: reactorId },
        data: { reactionsGiven: { increment: 1 } },
      });

      await database.prisma.user.update({
        where: { id: messageAuthorId },
        data: { reactionsReceived: { increment: 1 } },
      });
    } catch (error) {
      logger.error('Error processing reaction:', error);
    }
  }

  async processVoiceActivity(userId: string, minutes: number): Promise<void> {
    try {
      const points = Math.floor(minutes * config.scoring.voiceChannelPointsPerMinute);
      
      if (points > 0) {
        await this.awardPoints(
          userId,
          points,
          `Voice activity (${minutes} minutes)`,
          PointCategory.VOICE_ACTIVITY
        );

        await database.prisma.user.update({
          where: { id: userId },
          data: {
            voiceMinutes: { increment: minutes },
          },
        });
      }
    } catch (error) {
      logger.error('Error processing voice activity:', error);
    }
  }

  async penalizeUser(
    userId: string,
    penalty: number,
    reason: string,
    category: PointCategory,
    adminId?: string
  ): Promise<void> {
    await this.awardPoints(userId, -Math.abs(penalty), reason, category, adminId);
  }

  private isSpam(message: Message): boolean {
    const userId = message.author.id;
    const now = Date.now();
    const tracker = this.spamTracker.get(userId) || { count: 0, lastMessage: 0 };

    if (now - tracker.lastMessage < 1000) {
      tracker.count++;
    } else {
      tracker.count = 1;
    }

    tracker.lastMessage = now;
    this.spamTracker.set(userId, tracker);

    return tracker.count > 3;
  }

  private isQualityMessage(message: Message): boolean {
    const content = message.content.trim();
    
    return (
      content.length > 100 ||
      message.attachments.size > 0 ||
      message.embeds.length > 0 ||
      content.includes('http') ||
      content.split(' ').length > 20
    );
  }

  private async getMessageReactionCount(userId: string): Promise<number> {
    const user = await database.prisma.user.findUnique({
      where: { id: userId },
      select: { reactionsReceived: true },
    });
    return user?.reactionsReceived || 0;
  }
}