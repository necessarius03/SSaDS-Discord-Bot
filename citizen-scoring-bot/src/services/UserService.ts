import { User as DiscordUser } from 'discord.js';
import { database } from '../utils/database';
import { logger } from '../utils/logger';
import { UserStats } from '../types';

export class UserService {
  async ensureUserExists(discordUser: DiscordUser): Promise<void> {
    try {
      await database.prisma.user.upsert({
        where: { id: discordUser.id },
        update: {
          username: discordUser.username,
          discriminator: discordUser.discriminator || '0',
          displayName: discordUser.displayName,
          lastActive: new Date(),
        },
        create: {
          id: discordUser.id,
          username: discordUser.username,
          discriminator: discordUser.discriminator || '0',
          displayName: discordUser.displayName,
        },
      });
    } catch (error) {
      logger.error('Error ensuring user exists:', error);
      throw error;
    }
  }

  async getUserStats(userId: string): Promise<UserStats | null> {
    try {
      const user = await database.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) return null;

      return {
        totalPoints: user.totalPoints,
        level: user.level,
        experience: user.experience,
        messagesCount: user.messagesCount,
        voiceMinutes: user.voiceMinutes,
        reactionsGiven: user.reactionsGiven,
        reactionsReceived: user.reactionsReceived,
        reportsReceived: user.reportsReceived,
      };
    } catch (error) {
      logger.error('Error getting user stats:', error);
      throw error;
    }
  }

  async updateUserStats(userId: string, stats: Partial<UserStats>): Promise<void> {
    try {
      await database.prisma.user.update({
        where: { id: userId },
        data: {
          ...stats,
          lastActive: new Date(),
        },
      });
    } catch (error) {
      logger.error('Error updating user stats:', error);
      throw error;
    }
  }

  async getUserRank(userId: string): Promise<number> {
    try {
      const userRank = await database.prisma.$queryRaw<[{ rank: bigint }]>`
        SELECT COUNT(*) + 1 as rank
        FROM users
        WHERE totalPoints > (
          SELECT totalPoints
          FROM users
          WHERE id = ${userId}
        )
      `;

      return Number(userRank[0]?.rank || 0);
    } catch (error) {
      logger.error('Error getting user rank:', error);
      throw error;
    }
  }

  async getTopUsers(limit: number = 10) {
    try {
      return await database.prisma.user.findMany({
        orderBy: { totalPoints: 'desc' },
        take: limit,
        select: {
          id: true,
          username: true,
          displayName: true,
          totalPoints: true,
          level: true,
        },
      });
    } catch (error) {
      logger.error('Error getting top users:', error);
      throw error;
    }
  }

  calculateLevel(experience: number): number {
    return Math.floor(Math.sqrt(experience / 100)) + 1;
  }

  calculateExperienceForNextLevel(level: number): number {
    return level * level * 100;
  }
}