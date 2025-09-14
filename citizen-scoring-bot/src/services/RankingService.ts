import { database } from '../utils/database';
import { logger } from '../utils/logger';
import { RankingEntry } from '../types';

export class RankingService {
  async getLeaderboard(limit: number = 10, offset: number = 0): Promise<RankingEntry[]> {
    try {
      const users = await database.prisma.user.findMany({
        orderBy: { totalPoints: 'desc' },
        skip: offset,
        take: limit,
        select: {
          id: true,
          username: true,
          displayName: true,
          totalPoints: true,
          level: true,
        },
      });

      return users.map((user, index) => ({
        userId: user.id,
        username: user.username,
        displayName: user.displayName || undefined,
        points: user.totalPoints,
        level: user.level,
        rank: offset + index + 1,
      }));
    } catch (error) {
      logger.error('Error getting leaderboard:', error);
      return [];
    }
  }

  async getWeeklyLeaderboard(limit: number = 10): Promise<RankingEntry[]> {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const weeklyPoints = await database.prisma.pointHistory.groupBy({
        by: ['userId'],
        where: {
          createdAt: { gte: oneWeekAgo },
        },
        _sum: {
          points: true,
        },
        orderBy: {
          _sum: {
            points: 'desc',
          },
        },
        take: limit,
      });

      const userIds = weeklyPoints.map(wp => wp.userId);
      const users = await database.prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          username: true,
          displayName: true,
          level: true,
        },
      });

      const userMap = new Map(users.map(u => [u.id, u]));

      return weeklyPoints.map((wp, index) => {
        const user = userMap.get(wp.userId)!;
        return {
          userId: wp.userId,
          username: user.username,
          displayName: user.displayName || undefined,
          points: wp._sum.points || 0,
          level: user.level,
          rank: index + 1,
        };
      });
    } catch (error) {
      logger.error('Error getting weekly leaderboard:', error);
      return [];
    }
  }

  async getMonthlyLeaderboard(limit: number = 10): Promise<RankingEntry[]> {
    try {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const monthlyPoints = await database.prisma.pointHistory.groupBy({
        by: ['userId'],
        where: {
          createdAt: { gte: oneMonthAgo },
        },
        _sum: {
          points: true,
        },
        orderBy: {
          _sum: {
            points: 'desc',
          },
        },
        take: limit,
      });

      const userIds = monthlyPoints.map(mp => mp.userId);
      const users = await database.prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          username: true,
          displayName: true,
          level: true,
        },
      });

      const userMap = new Map(users.map(u => [u.id, u]));

      return monthlyPoints.map((mp, index) => {
        const user = userMap.get(mp.userId)!;
        return {
          userId: mp.userId,
          username: user.username,
          displayName: user.displayName || undefined,
          points: mp._sum.points || 0,
          level: user.level,
          rank: index + 1,
        };
      });
    } catch (error) {
      logger.error('Error getting monthly leaderboard:', error);
      return [];
    }
  }

  async getUserRankings(userId: string) {
    try {
      const [totalRank, weeklyRank, monthlyRank] = await Promise.all([
        this.getUserTotalRank(userId),
        this.getUserWeeklyRank(userId),
        this.getUserMonthlyRank(userId),
      ]);

      return {
        total: totalRank,
        weekly: weeklyRank,
        monthly: monthlyRank,
      };
    } catch (error) {
      logger.error('Error getting user rankings:', error);
      return { total: 0, weekly: 0, monthly: 0 };
    }
  }

  private async getUserTotalRank(userId: string): Promise<number> {
    const result = await database.prisma.$queryRaw<[{ rank: bigint }]>`
      SELECT COUNT(*) + 1 as rank
      FROM users
      WHERE totalPoints > (
        SELECT totalPoints
        FROM users
        WHERE id = ${userId}
      )
    `;

    return Number(result[0]?.rank || 0);
  }

  private async getUserWeeklyRank(userId: string): Promise<number> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const result = await database.prisma.$queryRaw<[{ rank: bigint }]>`
      SELECT COUNT(*) + 1 as rank
      FROM (
        SELECT userId, SUM(points) as weeklyPoints
        FROM point_histories
        WHERE createdAt >= ${oneWeekAgo}
        GROUP BY userId
      ) weekly_totals
      WHERE weeklyPoints > (
        SELECT COALESCE(SUM(points), 0)
        FROM point_histories
        WHERE userId = ${userId} AND createdAt >= ${oneWeekAgo}
      )
    `;

    return Number(result[0]?.rank || 0);
  }

  private async getUserMonthlyRank(userId: string): Promise<number> {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const result = await database.prisma.$queryRaw<[{ rank: bigint }]>`
      SELECT COUNT(*) + 1 as rank
      FROM (
        SELECT userId, SUM(points) as monthlyPoints
        FROM point_histories
        WHERE createdAt >= ${oneMonthAgo}
        GROUP BY userId
      ) monthly_totals
      WHERE monthlyPoints > (
        SELECT COALESCE(SUM(points), 0)
        FROM point_histories
        WHERE userId = ${userId} AND createdAt >= ${oneMonthAgo}
      )
    `;

    return Number(result[0]?.rank || 0);
  }

  async updateMonthlyTopContributor(): Promise<string | null> {
    try {
      const monthlyLeaderboard = await this.getMonthlyLeaderboard(1);
      
      if (monthlyLeaderboard.length === 0) return null;

      const topContributor = monthlyLeaderboard[0];
      
      const citizenBadge = await database.prisma.badge.findUnique({
        where: { name: 'Citizen of the Month' },
      });

      if (citizenBadge) {
        await database.prisma.userBadge.upsert({
          where: {
            userId_badgeId: {
              userId: topContributor.userId,
              badgeId: citizenBadge.id,
            },
          },
          update: { earnedAt: new Date() },
          create: {
            userId: topContributor.userId,
            badgeId: citizenBadge.id,
          },
        });
      }

      logger.info(`Monthly top contributor updated: ${topContributor.username}`);
      return topContributor.userId;
    } catch (error) {
      logger.error('Error updating monthly top contributor:', error);
      return null;
    }
  }
}