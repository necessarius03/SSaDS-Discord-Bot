import { BadgeRarity } from '@prisma/client';
import { database } from '../utils/database';
import { logger } from '../utils/logger';
import { BadgeRequirement } from '../types';

export class BadgeService {
  async initializeDefaultBadges(): Promise<void> {
    const defaultBadges = [
      {
        name: 'First Steps',
        description: 'Sent your first message',
        icon: '👶',
        rarity: BadgeRarity.COMMON,
        requirement: JSON.stringify({ type: 'messages', threshold: 1 } as BadgeRequirement),
      },
      {
        name: 'Chatterbox',
        description: 'Sent 100 messages',
        icon: '💬',
        rarity: BadgeRarity.COMMON,
        requirement: JSON.stringify({ type: 'messages', threshold: 100 } as BadgeRequirement),
      },
      {
        name: 'Voice Active',
        description: 'Spent 60 minutes in voice channels',
        icon: '🎤',
        rarity: BadgeRarity.UNCOMMON,
        requirement: JSON.stringify({ type: 'voice', threshold: 60 } as BadgeRequirement),
      },
      {
        name: 'Rising Star',
        description: 'Reached 1000 points',
        icon: '⭐',
        rarity: BadgeRarity.UNCOMMON,
        requirement: JSON.stringify({ type: 'points', threshold: 1000 } as BadgeRequirement),
      },
      {
        name: 'Helper',
        description: 'Received 50 reactions',
        icon: '🤝',
        rarity: BadgeRarity.RARE,
        requirement: JSON.stringify({ type: 'reactions', threshold: 50 } as BadgeRequirement),
      },
      {
        name: 'Level 10',
        description: 'Reached level 10',
        icon: '🔟',
        rarity: BadgeRarity.RARE,
        requirement: JSON.stringify({ type: 'level', threshold: 10 } as BadgeRequirement),
      },
      {
        name: 'Citizen of the Month',
        description: 'Top contributor this month',
        icon: '👑',
        rarity: BadgeRarity.LEGENDARY,
        requirement: JSON.stringify({ type: 'custom', condition: 'monthly_top' } as BadgeRequirement),
      },
      {
        name: 'Veteran',
        description: 'Active member for 6 months',
        icon: '🏆',
        rarity: BadgeRarity.EPIC,
        requirement: JSON.stringify({ type: 'custom', condition: 'veteran' } as BadgeRequirement),
      },
    ];

    try {
      for (const badge of defaultBadges) {
        await database.prisma.badge.upsert({
          where: { name: badge.name },
          update: {},
          create: badge,
        });
      }
      logger.info('Default badges initialized');
    } catch (error) {
      logger.error('Error initializing badges:', error);
    }
  }

  async getBadgeByName(name: string) {
    try {
      return await database.prisma.badge.findUnique({
        where: { name },
      });
    } catch (error) {
      logger.error('Error getting badge by name:', error);
      return null;
    }
  }

  async checkAndAwardBadges(userId: string): Promise<string[]> {
    const awardedBadges: string[] = [];

    try {
      const user = await database.prisma.user.findUnique({
        where: { id: userId },
        include: { badges: { include: { badge: true } } },
      });

      if (!user) return awardedBadges;

      const badges = await database.prisma.badge.findMany({
        where: { isActive: true },
      });

      for (const badge of badges) {
        const hasBadge = user.badges.some(ub => ub.badgeId === badge.id);
        if (hasBadge) continue;

        const requirement: BadgeRequirement = JSON.parse(badge.requirement);
        
        if (this.checkRequirement(user, requirement)) {
          await database.prisma.userBadge.create({
            data: {
              userId: user.id,
              badgeId: badge.id,
            },
          });
          awardedBadges.push(badge.name);
        }
      }

      if (awardedBadges.length > 0) {
        logger.info(`Awarded badges to user ${userId}: ${awardedBadges.join(', ')}`);
      }
    } catch (error) {
      logger.error('Error checking badges:', error);
    }

    return awardedBadges;
  }

  async getUserBadges(userId: string) {
    try {
      return await database.prisma.userBadge.findMany({
        where: { userId },
        include: { badge: true },
        orderBy: { earnedAt: 'desc' },
      });
    } catch (error) {
      logger.error('Error getting user badges:', error);
      return [];
    }
  }

  async createCustomBadge(
    name: string,
    description: string,
    icon: string,
    rarity: BadgeRarity,
    requirement: BadgeRequirement
  ) {
    try {
      return await database.prisma.badge.create({
        data: {
          name,
          description,
          icon,
          rarity,
          requirement: JSON.stringify(requirement),
        },
      });
    } catch (error) {
      logger.error('Error creating custom badge:', error);
      throw error;
    }
  }

  async awardBadgeToUser(userId: string, badgeId: string, adminId?: string) {
    try {
      await database.prisma.userBadge.create({
        data: {
          userId,
          badgeId,
        },
      });
      logger.info(`Badge ${badgeId} manually awarded to user ${userId} by admin ${adminId}`);
    } catch (error) {
      logger.error('Error awarding badge:', error);
      throw error;
    }
  }

  private checkRequirement(user: any, requirement: BadgeRequirement): boolean {
    switch (requirement.type) {
      case 'points':
        return user.totalPoints >= (requirement.threshold || 0);
      case 'messages':
        return user.messagesCount >= (requirement.threshold || 0);
      case 'voice':
        return user.voiceMinutes >= (requirement.threshold || 0);
      case 'reactions':
        return user.reactionsReceived >= (requirement.threshold || 0);
      case 'level':
        return user.level >= (requirement.threshold || 0);
      case 'custom':
        return this.checkCustomRequirement(user, requirement.condition || '');
      default:
        return false;
    }
  }

  private checkCustomRequirement(user: any, condition: string): boolean {
    switch (condition) {
      case 'veteran':
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        return user.joinedAt < sixMonthsAgo;
      case 'monthly_top':
        return false;
      default:
        return false;
    }
  }
}