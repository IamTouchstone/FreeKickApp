import { FlickVector } from './BallPhysics';

export interface TouchPoint {
  x: number;
  y: number;
  time: number;
}

export class FlickController {
  private touchPath: TouchPoint[] = [];

  public onTouchStart(x: number, y: number): void {
    this.touchPath = [{ x, y, time: Date.now() }];
  }

  public onTouchMove(x: number, y: number): void {
    this.touchPath.push({ x, y, time: Date.now() });
    if (this.touchPath.length > 25) {
      this.touchPath.shift();
    }
  }

  public getTouchPath(): TouchPoint[] {
    return this.touchPath;
  }

  public calculateFlick(releaseX: number, releaseY: number): FlickVector | null {
    if (this.touchPath.length < 2) return null;

    const start = this.touchPath[0];
    const end = { x: releaseX, y: releaseY, time: Date.now() };

    const totalTimeMs = Math.max(end.time - start.time, 15); // min 15ms to avoid divide by zero
    const dx = end.x - start.x;
    const dy = end.y - start.y;

    // Must swipe upward (dy < -20px) to trigger a valid flick
    if (dy > -15) {
      return null;
    }

    const distance = Math.sqrt(dx * dx + dy * dy);
    // Normalized velocity (0.3 to 3.5)
    const rawVelocity = distance / totalTimeMs;
    const velocity = Math.min(Math.max(rawVelocity, 0.4), 3.2);

    // Calculate curve deviation: find midpoint of touch gesture and measure offset from chord line
    let curveVector = 0;
    if (this.touchPath.length >= 4) {
      const midIndex = Math.floor(this.touchPath.length / 2);
      const midPoint = this.touchPath[midIndex];

      // Projected point on chord line start->end
      const chordLenSq = dx * dx + dy * dy;
      if (chordLenSq > 0) {
        const t = ((midPoint.x - start.x) * dx + (midPoint.y - start.y) * dy) / chordLenSq;
        const projX = start.x + t * dx;
        const projY = start.y + t * dy;

        // Perpendicular offset distance (positive = right curve, negative = left curve)
        const perpX = midPoint.x - projX;
        const perpY = midPoint.y - projY;

        // Determine sign based on cross product
        const cross = dx * (midPoint.y - start.y) - dy * (midPoint.x - start.x);
        const offsetMag = Math.sqrt(perpX * perpX + perpY * perpY);

        curveVector = (cross > 0 ? 1 : -1) * Math.min(offsetMag / 45, 1.0);
      }
    }

    // Vertical elevation angle factor (0.1 to 1.0)
    const elevationFactor = Math.min(Math.abs(dy) / 350, 1.0);

    return {
      startX: start.x,
      startY: start.y,
      endX: end.x,
      endY: end.y,
      velocity,
      curveVector,
      elevationFactor,
    };
  }

  public reset(): void {
    this.touchPath = [];
  }
}
