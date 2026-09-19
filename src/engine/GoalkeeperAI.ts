import { GoalkeeperState, BallState, DifficultyLevel } from '../types/game';
import { GOAL_WIDTH, GOAL_HEIGHT } from './BallPhysics';

export class GoalkeeperAI {
  public static createGoalkeeper(difficulty: DifficultyLevel): GoalkeeperState {
    let reachRadius = 0.95;
    let reactTime = 14; // frames delay on Easy (STREET)

    if (difficulty === 'PRO') {
      reachRadius = 1.30;
      reactTime = 8;
    } else if (difficulty === 'LEGEND') {
      reachRadius = 1.65;
      reactTime = 4;
    }

    return {
      x: 0,
      z: 0.1,
      targetX: 0,
      targetZ: 0.1,
      state: 'IDLE',
      reactTime,
      reachRadius,
    };
  }

  public static update(
    gk: GoalkeeperState,
    ball: BallState,
    distToGoal: number,
    difficulty: DifficultyLevel,
    frameCount: number,
    totalGoals?: number
  ): GoalkeeperState {
    if (ball.vy <= 0 || ball.y < 1.0) {
      // Ball not shot yet
      return {
        ...gk,
        x: Math.sin(frameCount * 0.05) * 0.4, // subtle idle shuffle
        z: 0.1,
        state: 'IDLE',
      };
    }

    // Predict impact location at goal line (y = distToGoal)
    const timeToGoal = Math.max((distToGoal - ball.y) / Math.max(ball.vy, 1), 0.01);
    let predictedX = ball.x + ball.vx * timeToGoal;

    // Legend & Pro GKs account for spin/curve!
    const effectiveDifficulty = typeof totalGoals === 'number'
      ? (totalGoals >= 9 ? 'LEGEND' : totalGoals >= 4 ? 'PRO' : 'STREET')
      : difficulty;

    if (effectiveDifficulty === 'LEGEND') {
      const curveOffset = ball.spinX * 14.5 * Math.sqrt(ball.vy) * 0.5 * timeToGoal * timeToGoal;
      predictedX += curveOffset;
    } else if (effectiveDifficulty === 'PRO') {
      const curveOffset = ball.spinX * 8.0 * 0.5 * timeToGoal * timeToGoal;
      predictedX += curveOffset;
    }

    // Clamp predicted target within goal bounds + slight extra reach
    const maxGoalX = GOAL_WIDTH / 2 - 0.2;
    const clampedTargetX = Math.min(Math.max(predictedX, -maxGoalX), maxGoalX);

    let predictedZ = ball.z + ball.vz * timeToGoal - 0.5 * 9.81 * timeToGoal * timeToGoal;
    const clampedTargetZ = Math.min(Math.max(predictedZ, 0.2), GOAL_HEIGHT - 0.1);

    // Dynamic reaction time: Easy (0-3 goals) = 14 frames, Medium (4-8 goals) = 8 frames, Hard (9+ goals) = 4 frames
    const reactTime = effectiveDifficulty === 'LEGEND' ? 4 : effectiveDifficulty === 'PRO' ? 8 : 14;

    // Check if ball is in flight long enough for reaction time
    const flightFrames = Math.floor(ball.y / 0.8);
    if (flightFrames < reactTime) {
      return { ...gk, state: 'READING' };
    }

    // Dynamic dive speed: Easy (0-3 goals) = 0.12, Medium (4-8 goals) = 0.22, Hard (9+ goals) = 0.32
    const diveSpeed = effectiveDifficulty === 'LEGEND' ? 0.32 : effectiveDifficulty === 'PRO' ? 0.22 : 0.12;
    const dx = clampedTargetX - gk.x;
    const dz = clampedTargetZ - gk.z;

    const newX = gk.x + dx * diveSpeed;
    const newZ = gk.z + dz * diveSpeed;

    let newState: GoalkeeperState['state'] = 'JUMPING';
    if (dx < -0.6) {
      newState = 'DIVING_LEFT';
    } else if (dx > 0.6) {
      newState = 'DIVING_RIGHT';
    }

    if (ball.isSaved) {
      newState = 'SAVED';
    } else if (ball.isGoal) {
      newState = 'BEATEN';
    }

    return {
      ...gk,
      x: newX,
      z: newZ,
      targetX: clampedTargetX,
      targetZ: clampedTargetZ,
      state: newState,
    };
  }
}
