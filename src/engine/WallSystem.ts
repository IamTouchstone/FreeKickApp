import { WallState, WallDefender, DifficultyLevel } from '../types/game';

export class WallSystem {
  public static createWall(numDefenders: number = 4, distance: number = 9.15): WallState {
    const defenders: WallDefender[] = [];
    const widthPerDefender = 0.55;
    const startX = -((numDefenders - 1) * widthPerDefender) / 2;

    for (let i = 0; i < numDefenders; i++) {
      defenders.push({
        id: i,
        x: startX + i * widthPerDefender,
        heightOffset: 0,
        jumping: false,
      });
    }

    return {
      numDefenders,
      distance,
      defenders,
    };
  }

  public static triggerWallJump(wall: WallState): WallState {
    return {
      ...wall,
      defenders: wall.defenders.map(d => ({
        ...d,
        jumping: true,
      })),
    };
  }

  public static updateWall(
    wall: WallState,
    frameCount: number,
    totalGoals?: number
  ): WallState {
    const isJumping = wall.defenders.some(d => d.jumping);
    if (!isJumping) return wall;

    // Dynamic jump height: Easy (0-3 goals) jumps low (0.20m), Medium (4-8 goals) jumps higher (0.38m), Hard (9+ goals) jumps high (0.48m)
    let maxJump = 0.38;
    if (typeof totalGoals === 'number') {
      if (totalGoals < 4) maxJump = 0.20;
      else if (totalGoals < 9) maxJump = 0.38;
      else maxJump = 0.48;
    }

    const jumpCycle = Math.sin((frameCount % 30) * (Math.PI / 30));
    const heightOffset = Math.max(jumpCycle * maxJump, 0);

    return {
      ...wall,
      defenders: wall.defenders.map(d => ({
        ...d,
        heightOffset,
      })),
    };
  }
}
