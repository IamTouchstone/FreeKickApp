import { DifficultyLevel, GoalkeeperState, BallState } from '../types/game';
// FLICK MASTER v1.1 - Bernie Upgrade
// Try 1-2: Beast keeper, Try 3-4: Tired keeper + wrong dive

export class GoalkeeperAI {
  public static createGoalkeeper(difficulty: DifficultyLevel, attemptNumber: number = 1): GoalkeeperState {
    let reachRadius = 0.95;
    let reactTime = 14;

    if (difficulty === 'PRO') {
      reachRadius = 1.30;
      reactTime = 8;
    } else if (difficulty === 'LEGEND') {
      reachRadius = 1.65;
      reactTime = 4;
    }

    // BERNIE UPGRADE v1.1 - Keeper gets tired!
    if (attemptNumber === 3) {
      reachRadius = reachRadius * 0.65; // 35% weaker
      reactTime = reactTime + 6; // Slower
    } else if (attemptNumber >= 4) {
      reachRadius = reachRadius * 0.40; // 60% weaker = YOU SCORE
      reactTime = reactTime + 10;
    }

    return {
      x: 0,
      z: 0.1,
      targetX: 0,
      targetZ: 0.1,
      state: 'IDLE' as const,
      reactTime,
      reachRadius,
      // @ts-ignore - store attempt for wrong dive logic
      attemptNumber,
    };
  }

  public static update(gk: GoalkeeperState, ball: BallState, _dist?: any, _diff?: any, _frame?: any, _goals?: any): GoalkeeperState {
    // 40% chance keeper dives WRONG WAY on try 3-4
    // @ts-ignore
    const attempt = gk.attemptNumber || 1;
    if (attempt >= 3 && Math.random() < 0.015) { // small chance per frame
      if (Math.random() < 0.5) {
        gk.targetX = -ball.x * 1.8; // WRONG DIVE!
        gk.targetZ = ball.z;
      }
    }

    // Your original tracking logic continues here...
    const dx = ball.x - gk.x;
    const dz = ball.z - gk.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < gk.reachRadius) {
      gk.targetX = ball.x;
      gk.targetZ = ball.z;
    }

    // Smooth movement
    gk.x += (gk.targetX - gk.x) * 0.15;
    gk.z += (gk.targetZ - gk.z) * 0.15;

    return gk;
  }
}
