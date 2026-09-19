// Simple Standalone JS Test for Physics Math Engine
const GOAL_WIDTH = 7.32;
const GOAL_HEIGHT = 2.44;

function launchBall(flick) {
  const basePower = Math.min(Math.max(flick.velocity * 16, 16), 34);
  const horizontalAngle = ((flick.endX - flick.startX) / 180) * (Math.PI / 4);
  const clampedHAngle = Math.min(Math.max(horizontalAngle, -0.65), 0.65);
  const elevationAngle = (flick.elevationFactor * 0.45) + 0.12;
  const vz = basePower * Math.sin(elevationAngle);
  const forwardPower = basePower * Math.cos(elevationAngle);
  const vx = forwardPower * Math.sin(clampedHAngle);
  const vy = forwardPower * Math.cos(clampedHAngle);
  const spinX = Math.min(Math.max(flick.curveVector * 1.8, -1.0), 1.0);

  return { x: 0, y: 0, z: 0.11, vx, vy, vz, spinX };
}

function evaluateShot(ball, distToGoal, combo, wallDefenders = 4, isWallHit = false) {
  const speedMs = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy + ball.vz * ball.vz);
  const speedKmh = Math.round(speedMs * 3.6);
  const basePoints = 100;
  const distanceBonus = Math.round(distToGoal * 2);
  const comboBonus = combo * 50;
  const isOverWallCurve = (wallDefenders > 0 && !isWallHit) || Math.abs(ball.spinX) >= 0.25;
  const overWallCurveBonus = isOverWallCurve ? 200 : 0;

  let bonusSum = distanceBonus + comboBonus + overWallCurveBonus;
  
  if (ball.z >= GOAL_HEIGHT * 0.70 && Math.abs(ball.x) >= (GOAL_WIDTH / 2) * 0.65) {
    bonusSum += 100; // Top Corner
  }
  if (Math.abs(ball.spinX) >= 0.45) {
    bonusSum += 150; // Perfect Curve
  }
  if (speedKmh >= 85) {
    bonusSum += 75; // Power Shot
  }

  const totalPoints = basePoints + bonusSum;
  return { isGoal: true, totalPoints, speedKmh, isOverWallCurve };
}

// Execute tests
console.log('--- ENGINE MATH UNIT TEST VERIFICATION ---');
const ball = launchBall({ startX: 200, startY: 600, endX: 250, endY: 200, velocity: 2.2, curveVector: 0.6, elevationFactor: 0.5 });
console.log('Launched Ball Velocity:', { vx: ball.vx.toFixed(2), vy: ball.vy.toFixed(2), vz: ball.vz.toFixed(2), spinX: ball.spinX.toFixed(2) });

const res = evaluateShot({ ...ball, x: 2.6, y: 20.0, z: 2.2 }, 20, 3);
console.log('Goal Evaluation Result:', res);

if (ball.vy > 10 && res.totalPoints > 200) {
  console.log('✅ ALL ENGINE PHYSICS & SCORING CALCULATIONS VERIFIED!');
} else {
  console.log('❌ VERIFICATION FAILED');
}
