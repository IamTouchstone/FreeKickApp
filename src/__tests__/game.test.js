const { BallPhysics } = require('../engine/BallPhysics');
const { GoalDetector } = require('../engine/GoalDetector');
const { GoalkeeperAI } = require('../engine/GoalkeeperAI');
const { DailyChallengeManager } = require('../services/DailyChallengeManager');

console.log('--- RUNNING AUTOMATED UNIT TESTS FOR FREE-KICK MASTER ---');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`❌ FAIL: ${message}`);
  }
}

// Test 1: Initial Ball Position
const ball0 = BallPhysics.createInitialBall(20);
assert(ball0.x === 0 && ball0.y === 0, 'Initial ball should start at (0, 0)');

// Test 2: Flick Launch Vector Calculation
const flickSample = {
  startX: 200,
  startY: 600,
  endX: 230,
  endY: 200,
  velocity: 1.8,
  curveVector: 0.5,
  elevationFactor: 0.6,
};
const launchedBall = BallPhysics.launchBall(flickSample, 20);
assert(launchedBall.vy > 0, 'Launched ball should have positive forward velocity');
assert(launchedBall.vz > 0, 'Launched ball should have upward elevation velocity');
assert(launchedBall.spinX > 0, 'Launched ball should have lateral spin');

// Test 3: Physics Simulation Step
const wallState = { numDefenders: 0, distance: 9.15, defenders: [] };
const gkState = GoalkeeperAI.createGoalkeeper('PRO');
const stepResult = BallPhysics.step(launchedBall, 20, wallState, gkState, 0.016);
assert(stepResult.ball.y > launchedBall.y, 'Ball y position should advance forward');

// Test 4: Goal Detector & Scoring Evaluation
const goalBall = { ...launchedBall, x: 2.5, y: 20.1, z: 2.1, isGoal: true, spinX: 0.5 };
const scoreRes = GoalDetector.evaluateShot(goalBall, 20, wallState, 2, 'GOAL');
assert(scoreRes.isGoal === true, 'Goal evaluation should confirm goal');
assert(scoreRes.totalPoints >= 100, 'Total score should be calculated with bonuses');

// Test 5: Daily Challenge Date Determinism
const dateStr = DailyChallengeManager.getTodayDateString();
assert(typeof dateStr === 'string' && dateStr.length === 10, 'Daily challenge date string should be YYYY-MM-DD');

console.log(`\nTEST SUMMARY: ${passedTests}/${totalTests} TESTS PASSED CLEANLY.`);
