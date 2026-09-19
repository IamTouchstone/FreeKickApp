import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserSettings, UserStats } from '../types/game';

const STORAGE_KEYS = {
  STATS: '@freekick_master_stats',
  SETTINGS: '@freekick_master_settings',
  CHALLENGES: '@freekick_master_challenges',
  DAILY: '@freekick_master_daily',
};

const DEFAULT_SETTINGS: UserSettings = {
  soundEnabled: true,
  musicEnabled: true,
  hapticsEnabled: true,
  stadium: 'NIGHT',
  ballSkin: 'CLASSIC',
};

const DEFAULT_STATS: UserStats = {
  highScore: 0,
  bestCombo: 0,
  totalGoals: 0,
  totalShots: 0,
  challengesCompleted: 0,
};

export class SaveManager {
  public static async loadStats(): Promise<UserStats> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.STATS);
      if (!data) return DEFAULT_STATS;
      const parsed = JSON.parse(data);
      return typeof parsed === 'object' && parsed !== null ? { ...DEFAULT_STATS, ...parsed } : DEFAULT_STATS;
    } catch (e) {
      console.warn('Failed to load stats', e);
      return DEFAULT_STATS;
    }
  }

  public static async saveStats(stats: UserStats): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
    } catch (e) {
      console.warn('Failed to save stats', e);
    }
  }

  public static async updateStats(
    newScore: number,
    combo: number,
    isGoal: boolean
  ): Promise<UserStats> {
    const current = await this.loadStats();
    const updated: UserStats = {
      highScore: Math.max(current.highScore || 0, newScore || 0),
      bestCombo: Math.max(current.bestCombo || 0, combo || 0),
      totalGoals: (current.totalGoals || 0) + (isGoal ? 1 : 0),
      totalShots: (current.totalShots || 0) + 1,
      challengesCompleted: current.challengesCompleted || 0,
    };
    await this.saveStats(updated);
    return updated;
  }

  public static async loadSettings(): Promise<UserSettings> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) return DEFAULT_SETTINGS;
      const parsed = JSON.parse(data);
      return typeof parsed === 'object' && parsed !== null ? { ...DEFAULT_SETTINGS, ...parsed } : DEFAULT_SETTINGS;
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  }

  public static async saveSettings(settings: UserSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings', e);
    }
  }

  public static async loadCompletedChallenges(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CHALLENGES);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  public static async saveCompletedChallenge(challengeId: string): Promise<string[]> {
    const list = await this.loadCompletedChallenges();
    const safeList = Array.isArray(list) ? list : [];
    if (!safeList.includes(challengeId)) {
      safeList.push(challengeId);
      await AsyncStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(safeList));

      const stats = await this.loadStats();
      stats.challengesCompleted = safeList.length;
      await this.saveStats(stats);
    }
    return safeList;
  }

  public static async loadDailyChallengeState(): Promise<any> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.DAILY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  public static async saveDailyChallengeState(state: any): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DAILY, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save daily challenge', e);
    }
  }

  public static async resetAllData(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (e) {
      console.warn('Failed to clear async storage', e);
    }
  }
}
