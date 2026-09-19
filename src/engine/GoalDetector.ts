import { BallState, ShotResult, ShotClassification, WallState } from '../types/game';
import { GOAL_WIDTH, GOAL_HEIGHT } from './BallPhysics';

export class GoalDetector {
  public static evaluateShot(
    ball: BallState,
    distToGoal: number,
    wall: WallState,
    combo: number,
    shotEvent: 'GOAL' | 'SAVED' | 'WALL_HIT' | 'POST_HIT' | 'OUT'
  ): ShotResult {
    // Shot speed in km/h
    const speedMs = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy + ball.vz * ball.vz);
    const speedKmh = Math.round(speedMs * 3.6);
    const curveDegrees = Math.round(Math.abs(ball.spinX) * 45);

    if (shotEvent === 'WALL_HIT' || ball.isWallHit) {
      return {
        isGoal: false,
        classification: 'WALL_BLOCKED',
        basePoints: 0,
        bonuses: [],
        totalPoints: 0,
        speedKmh,
        curveDegrees,
        message: 'BLOCKED BY THE WALL!',
      };
    }

    if (shotEvent === 'SAVED' || ball.isSaved) {
      return {
        isGoal: false,
        classification: 'GK_SAVED',
        basePoints: 0,
        bonuses: [],
        totalPoints: 0,
        speedKmh,
        curveDegrees,
        message: 'GREAT SAVE BY THE GOALKEEPER!',
      };
    }

    if (shotEvent === 'POST_HIT' || ball.isPostHit) {
      return {
        isGoal: false,
        classification: 'POST_REBOUND',
        basePoints: 0,
        bonuses: [],
        totalPoints: 0,
        speedKmh,
        curveDegrees,
        message: 'OFF THE POST!',
      };
    }

    if (!ball.isGoal && shotEvent === 'OUT') {
      return {
        isGoal: false,
        classification: 'OFF_TARGET',
        basePoints: 0,
        bonuses: [],
        totalPoints: 0,
        speedKmh,
        curveDegrees,
        message: 'SO CLOSE! OFF TARGET!',
      };
    }

    // --- GOAL DETECTED! ---
    const basePoints = 100;
    const distanceBonus = Math.round(distToGoal * 2);
    const comboBonus = combo * 50;

    // Check curve over wall / clear wall
    const isOverWallCurve = (wall.numDefenders > 0 && !ball.isWallHit) || Math.abs(ball.spinX) >= 0.25;
    const overWallCurveBonus = isOverWallCurve ? 200 : 0;

    const bonuses: { label: string; points: number }[] = [
      { label: 'DISTANCE BONUS', points: distanceBonus },
      { label: 'COMBO BONUS', points: comboBonus },
    ];

    if (isOverWallCurve) {
      bonuses.push({ label: 'CURVE OVER WALL!', points: 200 });
    }

    let isTopCorner = false;
    let isPerfectCurve = false;
    let isPowerShot = false;
    let isLongRange = false;

    // 1. Top Corner Check (upper 30% height and outer 35% width)
    const absX = Math.abs(ball.x);
    if (ball.z >= GOAL_HEIGHT * 0.70 && absX >= (GOAL_WIDTH / 2) * 0.65) {
      isTopCorner = true;
      bonuses.push({ label: 'TOP CORNER!', points: 100 });
    }

    // 2. Perfect Curve Check
    if (Math.abs(ball.spinX) >= 0.45) {
      isPerfectCurve = true;
      bonuses.push({ label: 'PERFECT BEND!', points: 150 });
    }

    // 3. Power Shot Check (>85 km/h)
    if (speedKmh >= 85) {
      isPowerShot = true;
      bonuses.push({ label: 'POWER SHOT!', points: 75 });
    }

    // 4. Long Range Check (>21m)
    if (distToGoal >= 21) {
      isLongRange = true;
      bonuses.push({ label: 'LONG DISTANCE!', points: 100 });
    }

    // Sum points: Base 100 + (distance * 2) + (combo * 50) + (curve over wall 200) + extra bonuses
    const bonusPointsSum = bonuses.reduce((acc, b) => acc + b.points, 0);
    const totalPoints = basePoints + bonusPointsSum;

    // Primary classification label
    let classification: ShotClassification = 'GOAL';
    let message = 'GOAL!';

    if (isTopCorner) {
      classification = 'TOP_CORNER';
      message = 'WORLD CLASS TOP CORNER!';
    } else if (isPerfectCurve) {
      classification = 'PERFECT_CURVE';
      message = 'MAGNIFICENT BECKHAM BEND!';
    } else if (isPowerShot) {
      classification = 'POWER_SHOT';
      message = 'THUNDERBOLT GOAL!';
    } else if (isLongRange) {
      classification = 'LONG_RANGE';
      message = 'LONG RANGE SPECTACULAR!';
    } else if (isOverWallCurve) {
      classification = 'GOAL';
      message = 'CURVED PERFECTLY OVER THE WALL!';
    }

    return {
      isGoal: true,
      classification,
      basePoints,
      bonuses,
      totalPoints,
      speedKmh,
      curveDegrees,
      message,
    };
  }
}
