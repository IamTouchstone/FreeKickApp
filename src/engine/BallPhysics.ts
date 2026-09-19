import { BallState, Vector3D, WallState, GoalkeeperState } from '../types/game';

export const GOAL_WIDTH = 7.32; // meters
export const GOAL_HEIGHT = 2.44; // meters
export const GOAL_DEPTH = 1.8; // meters net depth
export const BALL_RADIUS = 0.11; // 11cm diameter 22cm

export interface FlickVector {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  velocity: number; // pixels per ms or normalized speed
  curveVector: number; // horizontal curvature (-1.0 left to +1.0 right)
  elevationFactor: number; // vertical angle factor (0.0 to 1.0)
}

export class BallPhysics {
  public static createInitialBall(startDistMeters: number = 20): BallState {
    return {
      x: 0,
      y: 0,
      z: 0.11,
      vx: 0,
      vy: 0,
      vz: 0,
      spinX: 0,
      spinY: 0,
      trail: [{ x: 0, y: 0, z: 0.11 }],
      isGoal: false,
      isSaved: false,
      isWallHit: false,
      isPostHit: false,
    };
  }

  /**
   * Launch ball from flick gesture params
   */
  public static launchBall(
    flick: FlickVector,
    distToGoal: number = 20
  ): BallState {
    // Map flick speed (0.4 to 3.2) to power (m/s)
    const basePower = Math.min(Math.max(flick.velocity * 16, 16), 34); // 16m/s to 34m/s

    // Horizontal direction angle (-35 deg to +35 deg)
    const horizontalAngle = ((flick.endX - flick.startX) / 180) * (Math.PI / 4);
    const clampedHAngle = Math.min(Math.max(horizontalAngle, -0.65), 0.65);

    // Elevation velocity based on flick speed & vertical swipe distance
    const elevationAngle = Math.min(
      Math.max(flick.elevationFactor * 0.52 + flick.velocity * 0.06, 0.15),
      0.72
    );
    const vz = basePower * Math.sin(elevationAngle);

    // Forward and side velocities
    const forwardPower = basePower * Math.cos(elevationAngle);
    const vx = forwardPower * Math.sin(clampedHAngle);
    const vy = forwardPower * Math.cos(clampedHAngle);

    // Lateral Spin factor for Magnus Curve (-1.0 to 1.0) with +15% automatic curve assist
    let curveVector = flick.curveVector;
    if (Math.abs(curveVector) > 0.04) {
      curveVector *= 1.15; // +15% curve assist
    } else if (Math.abs(clampedHAngle) > 0.08) {
      // Slight diagonal swipe: add automatic 15% curve assist in direction of angle
      curveVector += (clampedHAngle > 0 ? 0.15 : -0.15);
    }
    const spinX = Math.min(Math.max(curveVector * 2.5, -1.0), 1.0);
    const spinY = 0;

    return {
      x: 0,
      y: 0,
      z: 0.11, // Ball on ground
      vx,
      vy,
      vz,
      spinX,
      spinY,
      trail: [{ x: 0, y: 0, z: 0.11 }],
      isGoal: false,
      isSaved: false,
      isWallHit: false,
      isPostHit: false,
    };
  }

  /**
   * Physics simulation step (dt = 0.016s for 60fps)
   */
  public static step(
    ball: BallState,
    distToGoal: number,
    wall: WallState,
    gk: GoalkeeperState,
    dt: number = 0.016
  ): { ball: BallState; event: 'NONE' | 'GOAL' | 'SAVED' | 'WALL_HIT' | 'POST_HIT' | 'OUT' } {
    if (ball.y >= distToGoal + GOAL_DEPTH || (ball.z < 0 && ball.vy <= 0)) {
      return { ball, event: 'OUT' };
    }

    // 1. Calculate accelerations
    const gravity = -9.81;
    const airDragCoeff = 0.011; // air resistance
    const magnusCoeff = 16.5; // Lateral Magnus bending force (David Beckham curve!)

    // Magnus acceleration (perpendicular curve force)
    const magnusAx = ball.spinX * magnusCoeff * Math.sqrt(Math.max(ball.vy, 1));

    // Drag forces
    const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy + ball.vz * ball.vz);
    const dragX = -airDragCoeff * ball.vx * speed;
    const dragY = -airDragCoeff * ball.vy * speed;
    const dragZ = -airDragCoeff * ball.vz * speed;

    // Total accelerations
    const ax = magnusAx + dragX;
    const ay = dragY;
    const az = gravity + dragZ;

    // Update velocities
    let nVx = ball.vx + ax * dt;
    let nVy = ball.vy + ay * dt;
    let nVz = ball.vz + az * dt;

    // Update positions
    let nX = ball.x + nVx * dt;
    let nY = ball.y + nVy * dt;
    let nZ = ball.z + nVz * dt;

    // Ground bounce check
    if (nZ < BALL_RADIUS) {
      nZ = BALL_RADIUS;
      nVz = -nVz * 0.4;
      nVx *= 0.85;
      nVy *= 0.85;
    }

    let event: 'NONE' | 'GOAL' | 'SAVED' | 'WALL_HIT' | 'POST_HIT' | 'OUT' = 'NONE';

    // 2. Wall Collision Check (Wall is at y = wall.distance ~ 9.15m)
    const wallDist = (wall && typeof wall.distance === 'number') ? wall.distance : 9.15;
    const defendersList = (wall && Array.isArray(wall.defenders)) ? wall.defenders : [];

    if (!ball.isWallHit && Math.abs(nY - wallDist) < 0.38 && nY < wallDist + 0.38) {
      const numDef = defendersList.length || wall.numDefenders || 4;
      const wallWidth = numDef * 0.52; // 52cm width per defender
      const wallLeft = -wallWidth / 2;
      const wallRight = wallWidth / 2;

      if (nX >= wallLeft && nX <= wallRight) {
        // Wall height check: 1.80m standing, up to 2.10m jumping
        const isAnyJumping = defendersList.some(d => d && d.jumping);
        const wallHeight = isAnyJumping ? 2.10 : 1.80;

        // Ball goes OVER the wall if height nZ > wallHeight (e.g. nZ > 1.95m)
        if (nZ <= wallHeight) {
          // BUG 3 Fix: If shot has curve > 0.20, reduce wall block chance to 40% (allows curving past wall!)
          const hasCurve = Math.abs(ball.spinX) > 0.20;
          const blockRoll = Math.random();

          if (!hasCurve || blockRoll < 0.40) {
            // HIT WALL!
            nVy = -nVy * 0.25;
            nVx = (Math.random() - 0.5) * 6;
            nVz = Math.abs(nVz) * 0.5 + 2;
            ball.isWallHit = true;
            event = 'WALL_HIT';
          }
        }
      }
    }

    // 3. Goalkeeper Collision Check
    if (!ball.isSaved && Math.abs(nY - (distToGoal - 0.3)) < 0.8) {
      const distToGk = Math.sqrt(
        (nX - gk.x) * (nX - gk.x) + (nZ - gk.z) * (nZ - gk.z)
      );
      if (distToGk <= gk.reachRadius) {
        // GK SAVED SHOT!
        nVy = -nVy * 0.3;
        nVx = (nX - gk.x) > 0 ? 5 : -5;
        nVz = 3;
        ball.isSaved = true;
        event = 'SAVED';
      }
    }

    // 4. Goal Frame / Net Collision Check
    const goalLeft = -GOAL_WIDTH / 2;
    const goalRight = GOAL_WIDTH / 2;
    const goalTop = GOAL_HEIGHT;

    if (nY >= distToGoal && nY < distToGoal + GOAL_DEPTH) {
      const isNearLeftPost = Math.abs(nX - goalLeft) < 0.22 && nZ <= goalTop + 0.15;
      const isNearRightPost = Math.abs(nX - goalRight) < 0.22 && nZ <= goalTop + 0.15;
      const isNearCrossbar = Math.abs(nZ - goalTop) < 0.22 && nX >= goalLeft - 0.2 && nX <= goalRight + 0.2;

      if (!ball.isPostHit && (isNearLeftPost || isNearRightPost || isNearCrossbar)) {
        nVy = -nVy * 0.4;
        nVx = isNearLeftPost ? 6 : isNearRightPost ? -6 : nVx;
        nVz = isNearCrossbar ? -Math.abs(nVz) * 0.6 : nVz;
        ball.isPostHit = true;
        event = 'POST_HIT';
      } else if (!ball.isGoal && !ball.isSaved && !ball.isWallHit) {
        if (nX > goalLeft + BALL_RADIUS && nX < goalRight - BALL_RADIUS && nZ > 0 && nZ < goalTop - BALL_RADIUS) {
          ball.isGoal = true;
          event = 'GOAL';
          nVx *= 0.3;
          nVy *= 0.15;
          nVz *= 0.3;
        } else if (nY >= distToGoal + 0.3 && !ball.isGoal) {
          event = 'OUT';
        }
      }
    }

    // Green trajectory trail (keep up to 35 recent points for clear green path)
    const currentTrail = Array.isArray(ball.trail) ? ball.trail : [];
    const newTrail = [...currentTrail, { x: nX, y: nY, z: nZ }];
    if (newTrail.length > 35) {
      newTrail.shift();
    }

    const updatedBall: BallState = {
      ...ball,
      x: nX,
      y: nY,
      z: nZ,
      vx: nVx,
      vy: nVy,
      vz: nVz,
      trail: newTrail,
    };

    return { ball: updatedBall, event };
  }
}
