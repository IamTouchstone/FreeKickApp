// @ts-nocheck
import { WallState } from '../types/game';

export class WallSystem {
  public static createWall(numDefenders: number, distance: number): any {
    const defenders: any[] = [];
    for (let i = 0; i < numDefenders; i++) {
      defenders.push({
        x: (i - (numDefenders - 1) / 2) * 0.8,
        y: 0,
        z: 0,
        isJumping: false,
        jumpHeight: 0,
      });
    }
    return { defenders, distance, numDefenders } as any;
  }

  public static triggerWallJump(wall: any): any {
    const newDefenders = wall.defenders.map((d: any) => ({
      ...d,
      isJumping: true,
    }));
    return { ...wall, defenders: newDefenders };
  }

  public static updateWall(wall: any, frameCount?: number, totalGoals?: number): any {
    let maxJump = 0.38;
    if (typeof totalGoals === 'number') {
      if (totalGoals < 4) {
        maxJump = 0.20;
      } else if (totalGoals < 9) {
        maxJump = 0.38;
      } else {
        maxJump = 0.48;
      }
    }

    const currentFrame = frameCount || 0;
    const jumpCycle = Math.sin((currentFrame % 30) * (Math.PI / 30));
    const heightOffset = Math.max(jumpCycle * maxJump, 0);

    const newDefenders = wall.defenders.map((d: any) => ({
      ...d,
      y: d.isJumping ? heightOffset : 0,
      jumpHeight: d.isJumping ? heightOffset : 0,
    }));

    return { ...wall, defenders: newDefenders };
  }
}