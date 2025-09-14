import { Events, VoiceState } from 'discord.js';
import { ScoringService } from '../services/ScoringService';
import { logger } from '../utils/logger';

const scoringService = new ScoringService();
const voiceSessions = new Map<string, { joinTime: number, channelId: string }>();

export const name = Events.VoiceStateUpdate;
export const once = false;

export async function execute(oldState: VoiceState, newState: VoiceState) {
  if (!newState.member || newState.member.user.bot) return;

  const userId = newState.member.id;

  try {
    if (!oldState.channel && newState.channel) {
      voiceSessions.set(userId, {
        joinTime: Date.now(),
        channelId: newState.channel.id,
      });
    }
    
    else if (oldState.channel && !newState.channel) {
      const session = voiceSessions.get(userId);
      if (session) {
        const duration = Math.floor((Date.now() - session.joinTime) / (1000 * 60));
        
        if (duration > 0) {
          await scoringService.processVoiceActivity(userId, duration);
        }
        
        voiceSessions.delete(userId);
      }
    }
    
    else if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
      const session = voiceSessions.get(userId);
      if (session) {
        const duration = Math.floor((Date.now() - session.joinTime) / (1000 * 60));
        
        if (duration > 0) {
          await scoringService.processVoiceActivity(userId, duration);
        }
        
        voiceSessions.set(userId, {
          joinTime: Date.now(),
          channelId: newState.channel.id,
        });
      }
    }
  } catch (error) {
    logger.error('Error processing voice state update:', error);
  }
}