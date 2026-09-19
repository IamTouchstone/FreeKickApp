import { DailyChallengeState, DifficultyLevel, StadiumTheme, WeatherType } from '../types/game';
import { SaveManager } from './SaveManager';

export class DailyChallengeManager {
  public static getTodayDateString(): string {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  public static async getDailyChallenge(): Promise<{
    challenge: DailyChallengeState;
    difficulty: DifficultyLevel;
    wallSize: number;
    stadium: StadiumTheme;
    weather: WeatherType;
  }> {
    const todayStr = this.getTodayDateString();
    const saved = await SaveManager.loadDailyChallengeState();

    if (saved && saved.dateString === todayStr) {
      return {
        challenge: saved,
        difficulty: saved.difficulty || 'PRO',
        wallSize: saved.wallSize || 3,
        stadium: saved.stadium || 'NIGHT',
        weather: saved.weather || 'CLEAR',
      };
    }

    // Deterministic seed based on date string YYYY-MM-DD
    let hash = 0;
    for (let i = 0; i < todayStr.length; i++) {
      hash = (hash << 5) - hash + todayStr.charCodeAt(i);
      hash |= 0;
    }
    const seed = Math.abs(hash);

    const difficulties: DifficultyLevel[] = ['STREET', 'PRO', 'LEGEND'];
    const stadiums: StadiumTheme[] = ['NIGHT', 'DAY', 'STREET', 'AFRICAN'];
    const weathers: WeatherType[] = ['CLEAR', 'RAIN'];

    const diff = difficulties[seed % difficulties.length];
    const stadium = stadiums[(seed >> 2) % stadiums.length];
    const weather = weathers[(seed >> 4) % weathers.length];
    const wallSize = 2 + (seed % 4); // 2 to 5 defenders
    const targetGoals = 3 + (seed % 3); // 3 to 5 goals
    const maxAttempts = targetGoals + 2; // e.g. 3 goals in 5 attempts

    const titles = [
      'Daily Free-Kick Master',
      'Daily Curve Challenge',
      'Daily Precision Duel',
      'Daily Wall Conqueror',
      'Daily Top-Corner King',
    ];
    const title = titles[seed % titles.length];
    const description = `Score ${targetGoals} goals in ${maxAttempts} attempts! (${diff} difficulty, ${wallSize}-man wall)`;

    const newChallenge: DailyChallengeState & {
      difficulty: DifficultyLevel;
      wallSize: number;
      stadium: StadiumTheme;
      weather: WeatherType;
    } = {
      dateString: todayStr,
      title,
      description,
      targetGoals,
      maxAttempts,
      currentGoals: 0,
      attemptsUsed: 0,
      completed: false,
      rewardPoints: 500,
      rewardClaimed: false,
      difficulty: diff,
      wallSize,
      stadium,
      weather,
    };

    await SaveManager.saveDailyChallengeState(newChallenge);

    return {
      challenge: newChallenge,
      difficulty: diff,
      wallSize,
      stadium,
      weather,
    };
  }

  public static async recordShotResult(isGoal: boolean): Promise<DailyChallengeState> {
    const data = await this.getDailyChallenge();
    const c = data.challenge;

    if (c.completed || c.attemptsUsed >= c.maxAttempts) {
      return c;
    }

    c.attemptsUsed += 1;
    if (isGoal) {
      c.currentGoals += 1;
    }

    if (c.currentGoals >= c.targetGoals) {
      c.completed = true;
    }

    await SaveManager.saveDailyChallengeState(c);
    return c;
  }
}
