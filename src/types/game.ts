export type DifficultyLevel = 'STREET' | 'PRO' | 'LEGEND';
export type StadiumTheme = 'NIGHT' | 'DAY' | 'STREET' | 'AFRICAN';
export type WeatherType = 'CLEAR' | 'RAIN';
export type BallSkin = 'CLASSIC' | 'PRO' | 'GOLD';

export type GamePhase =
  | 'SPLASH'
  | 'HOME'
  | 'MODE_SELECT'
  | 'GAMEPLAY'
  | 'GOAL_RESULT'
  | 'MISS_RESULT'
  | 'DAILY_CHALLENGE'
  | 'CHALLENGES'
  | 'LEADERBOARD'
  | 'SETTINGS';

export type ShotStatus =
  | 'AIMING'
  | 'FLICKED'
  | 'IN_FLIGHT'
  | 'GOAL'
  | 'MISS'
  | 'SAVED'
  | 'POST_HIT'
  | 'WALL_HIT';

export type ShotClassification =
  | 'GOAL'
  | 'TOP_CORNER'
  | 'PERFECT_CURVE'
  | 'POWER_SHOT'
  | 'LONG_RANGE'
  | 'WALL_BLOCKED'
  | 'GK_SAVED'
  | 'POST_REBOUND'
  | 'OFF_TARGET';

export interface Vector3D {
  x: number; // Horizontal: -6m (left post) to +6m (right post)
  y: number; // Distance: 0m (penalty/freekick spot) to 25m (back of net)
  z: number; // Elevation: 0m (pitch) to 4m+
}

export interface BallState extends Vector3D {
  vx: number;
  vy: number;
  vz: number;
  spinX: number; // Lateral Magnus spin (-1.0 to 1.0)
  spinY: number; // Vertical topspin/backspin
  trail: { x: number; y: number; z: number }[];
  isGoal: boolean;
  isSaved: boolean;
  isWallHit: boolean;
  isPostHit: boolean;
}

export interface GoalkeeperState {
  x: number; // position relative to goal center (goal width is 7.32m -> -3.66 to +3.66)
  z: number; // height (0 to 2.44m)
  targetX: number;
  targetZ: number;
  state: 'IDLE' | 'READING' | 'DIVING_LEFT' | 'DIVING_RIGHT' | 'JUMPING' | 'SAVED' | 'BEATEN';
  reactTime: number; // frames before diving
  reachRadius: number; // max save reach radius
}

export interface WallDefender {
  id: number;
  x: number; // meters from center
  heightOffset: number; // jump height
  jumping: boolean;
}

export interface WallState {
  numDefenders: number;
  distance: number; // distance in meters from ball start (default 9.15m)
  defenders: WallDefender[];
}

export interface ShotResult {
  isGoal: boolean;
  classification: ShotClassification;
  basePoints: number;
  bonuses: { label: string; points: number }[];
  totalPoints: number;
  speedKmh: number;
  curveDegrees: number;
  message: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: DifficultyLevel;
  targetGoals: number;
  maxAttempts: number;
  wallSize: number;
  stadium: StadiumTheme;
  weather: WeatherType;
  requiresCurve?: boolean;
  requiresTopCorner?: boolean;
  stars: number;
  completed: boolean;
}

export interface DailyChallengeState {
  dateString: string; // YYYY-MM-DD
  title: string;
  description: string;
  targetGoals: number;
  maxAttempts: number;
  currentGoals: number;
  attemptsUsed: number;
  completed: boolean;
  rewardPoints: number;
  rewardClaimed: boolean;
}

export interface UserSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  hapticsEnabled: boolean;
  stadium: StadiumTheme;
  ballSkin: BallSkin;
}

export interface UserStats {
  highScore: number;
  bestCombo: number;
  totalGoals: number;
  totalShots: number;
  challengesCompleted: number;
}
