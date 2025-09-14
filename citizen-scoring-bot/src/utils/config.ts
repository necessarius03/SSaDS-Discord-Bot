import dotenv from 'dotenv';
import { ScoringConfig } from '../types';

dotenv.config();

export const config = {
  discord: {
    token: process.env.DISCORD_TOKEN!,
    clientId: process.env.DISCORD_CLIENT_ID!,
  },
  database: {
    url: process.env.DATABASE_URL!,
  },
  app: {
    nodeEnv: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info',
  },
  scoring: {
    baseMessagePoints: Number(process.env.BASE_MESSAGE_POINTS) || 1,
    qualityMessageMultiplier: Number(process.env.QUALITY_MESSAGE_MULTIPLIER) || 2,
    reactionBonusThreshold: Number(process.env.REACTION_BONUS_THRESHOLD) || 3,
    voiceChannelPointsPerMinute: Number(process.env.VOICE_CHANNEL_POINTS_PER_MINUTE) || 0.5,
    spamPenalty: Number(process.env.SPAM_PENALTY) || -5,
    ghostVoicePenalty: Number(process.env.GHOST_VOICE_PENALTY) || -2,
    reportPenalty: Number(process.env.REPORT_PENALTY) || -10,
    leakPenalty: Number(process.env.LEAK_PENALTY) || -50,
  } as ScoringConfig,
};

// Validate required environment variables
const requiredEnvVars = ['DISCORD_TOKEN', 'DISCORD_CLIENT_ID', 'DATABASE_URL'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}