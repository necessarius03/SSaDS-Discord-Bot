export interface ScoringConfig {
  baseMessagePoints: number;
  qualityMessageMultiplier: number;
  reactionBonusThreshold: number;
  voiceChannelPointsPerMinute: number;
  spamPenalty: number;
  ghostVoicePenalty: number;
  reportPenalty: number;
  leakPenalty: number;
}

export interface UserStats {
  totalPoints: number;
  level: number;
  experience: number;
  messagesCount: number;
  voiceMinutes: number;
  reactionsGiven: number;
  reactionsReceived: number;
  reportsReceived: number;
}

export interface BadgeRequirement {
  type: 'points' | 'messages' | 'voice' | 'reactions' | 'level' | 'custom';
  threshold?: number;
  condition?: string;
}

export interface RankingEntry {
  userId: string;
  username: string;
  displayName?: string;
  points: number;
  level: number;
  rank: number;
}