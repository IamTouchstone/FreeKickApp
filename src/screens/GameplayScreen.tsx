import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
  Dimensions,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  GamePhase,
  DifficultyLevel,
  BallState,
  GoalkeeperState,
  WallState,
  ShotResult,
  StadiumTheme,
  WeatherType,
  BallSkin,
} from '../types/game';
import { BallPhysics, GOAL_WIDTH } from '../engine/BallPhysics';
import { GoalkeeperAI } from '../engine/GoalkeeperAI';
import { WallSystem } from '../engine/WallSystem';
import { FlickController, TouchPoint } from '../engine/FlickController';
import { GoalDetector } from '../engine/GoalDetector';
import { GameplayViewport } from '../components/GameplayViewport';
import { GoalResultModal } from '../components/GoalResultModal';
import { MissResultModal } from '../components/MissResultModal';
import { SaveManager } from '../services/SaveManager';
import { AudioManager } from '../services/AudioManager';
import { HapticsManager } from '../services/HapticsManager';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface GameplayScreenProps {
  onNavigate: (phase: GamePhase, params?: any) => void;
  routeParams?: any;
}

export const GameplayScreen: React.FC<GameplayScreenProps> = ({
  onNavigate,
  routeParams,
}) => {
  // Game Configuration Parameters
  const difficulty: DifficultyLevel = routeParams?.difficulty || 'PRO';
  const distToGoal: number = routeParams?.distToGoal || 20;
  const numDefenders: number = routeParams?.wallSize !== undefined ? routeParams.wallSize : 4;
  const stadium: StadiumTheme = routeParams?.stadium || 'NIGHT';
  const weather: WeatherType = routeParams?.weather || 'CLEAR';
  const ballSkin: BallSkin = routeParams?.ballSkin || 'CLASSIC';

  // Game State
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(1);
  const [totalGoals, setTotalGoals] = useState<number>(0);
  const [shotCount, setShotCount] = useState<number>(0);
  const [isAiming, setIsAiming] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Engines & Controllers
  const flickController = useRef(new FlickController()).current;
  const [ball, setBall] = useState<BallState>(BallPhysics.createInitialBall(distToGoal));
  const [goalkeeper, setGoalkeeper] = useState<GoalkeeperState>(
    GoalkeeperAI.createGoalkeeper(difficulty)
  );
  const [wall, setWall] = useState<WallState>(
    WallSystem.createWall(numDefenders, 9.15)
  );
  const [touchPath, setTouchPath] = useState<TouchPoint[]>([]);

  // Modals & Result State
  const [resultModalVisible, setResultModalVisible] = useState<boolean>(false);
  const [shotResult, setShotResult] = useState<ShotResult | null>(null);

  // Animation Loop Ref
  const animFrameRef = useRef<number | null>(null);
  const frameCountRef = useRef<number>(0);
  const shotStateRef = useRef<'AIMING' | 'FLICKED' | 'RESULT_TRIGGERED'>('AIMING');

  useEffect(() => {
    const loop = () => {
      frameCountRef.current += 1;
      updateGameStep();
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [ball, goalkeeper, wall]);

  // PanResponder gesture listener for finger flicking on football
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => shotStateRef.current === 'AIMING',
      onPanResponderGrant: (evt) => {
        if (shotStateRef.current !== 'AIMING') return;
        const { pageX, pageY } = evt.nativeEvent;
        flickController.onTouchStart(pageX, pageY);
        setIsAiming(true);
        setTouchPath(Array.from(flickController.getTouchPath() || []));
      },
      onPanResponderMove: (evt) => {
        if (shotStateRef.current !== 'AIMING') return;
        const { pageX, pageY } = evt.nativeEvent;
        flickController.onTouchMove(pageX, pageY);
        setTouchPath(Array.from(flickController.getTouchPath() || []));
      },
      onPanResponderRelease: (evt) => {
        if (shotStateRef.current !== 'AIMING') return;
        const { pageX, pageY } = evt.nativeEvent;
        setIsAiming(false);

        const flick = flickController.calculateFlick(pageX, pageY);
        if (flick) {
          shotStateRef.current = 'FLICKED';
          AudioManager.playKick();
          HapticsManager.kick();

          const launchedBall = BallPhysics.launchBall(flick, distToGoal);
          setBall(launchedBall);

          // Trigger Wall Jump
          setWall(prev => WallSystem.triggerWallJump(prev));
        }
      },
    })
  ).current;

  // 60 FPS Game Loop Step
  const updateGameStep = () => {
    if (shotStateRef.current !== 'FLICKED' || isPaused) return;

    // 1. Step Ball Physics
    const physRes = BallPhysics.step(ball, distToGoal, wall, goalkeeper, 0.016);
    setBall(physRes.ball);

    // 2. Step Goalkeeper AI (dynamic speed based on goals scored)
    const newGk = GoalkeeperAI.update(
      goalkeeper,
      physRes.ball,
      distToGoal,
      difficulty,
      frameCountRef.current,
      totalGoals
    );
    setGoalkeeper(newGk);

    // 3. Step Wall Defenders Animation (dynamic jump height based on goals scored)
    const newWall = WallSystem.updateWall(wall, frameCountRef.current, totalGoals);
    setWall(newWall);

    // 4. Handle Collision & Result Events
    if (physRes.event !== 'NONE' && shotStateRef.current === 'FLICKED') {
      if (physRes.event === 'WALL_HIT') {
        AudioManager.playWallHit();
        HapticsManager.wallHit();
        triggerShotResult(physRes.ball, physRes.event);
      } else if (physRes.event === 'POST_HIT') {
        AudioManager.playPostHit();
        HapticsManager.postHit();
        triggerShotResult(physRes.ball, physRes.event);
      } else if (physRes.event === 'SAVED') {
        AudioManager.playSave();
        HapticsManager.save();
        triggerShotResult(physRes.ball, physRes.event);
      } else if (physRes.event === 'GOAL') {
        AudioManager.playGoalCheer();
        AudioManager.playNetSound();
        HapticsManager.goal();
        triggerShotResult(physRes.ball, physRes.event);
      } else if (physRes.event === 'OUT') {
        triggerShotResult(physRes.ball, physRes.event);
      }
    }
  };

  const triggerShotResult = (
    finalBall: BallState,
    shotEvent: 'GOAL' | 'SAVED' | 'WALL_HIT' | 'POST_HIT' | 'OUT'
  ) => {
    shotStateRef.current = 'RESULT_TRIGGERED';

    setTimeout(() => {
      const result = GoalDetector.evaluateShot(
        finalBall,
        distToGoal,
        wall,
        combo,
        shotEvent
      );
      setShotResult(result);

      if (result.isGoal) {
        setTotalGoals(prev => prev + 1);
        const newScore = score + result.totalPoints;
        const newCombo = combo + 1;
        setScore(newScore);
        setCombo(newCombo);
        if (newCombo > 1) {
          AudioManager.playCombo();
        }
        SaveManager.updateStats(newScore, newCombo, true);
      } else {
        setCombo(1); // Reset combo on miss
        SaveManager.updateStats(score, combo, false);
      }

      setShotCount(prev => prev + 1);
      setResultModalVisible(true);
    }, 450);
  };

  // INSTANT RETRY Reset (<30ms) with Dynamic Difficulty Progression:
  // Easy (0-3 goals): Wall jumps low, keeper dives slow
  // Medium (4-8 goals): Wall jumps higher, keeper faster
  // Hard (9+ goals): 5-man wall, keeper super save
  const handleInstantRetry = () => {
    setResultModalVisible(false);
    setShotResult(null);
    flickController.reset();
    setTouchPath([]);

    const dynamicDifficulty: DifficultyLevel =
      totalGoals >= 9 ? 'LEGEND' : totalGoals >= 4 ? 'PRO' : 'STREET';
    const dynamicDefenders = totalGoals >= 9 ? 5 : numDefenders;

    setBall(BallPhysics.createInitialBall(distToGoal));
    setGoalkeeper(GoalkeeperAI.createGoalkeeper(dynamicDifficulty));
    setWall(WallSystem.createWall(dynamicDefenders, 9.15));

    shotStateRef.current = 'AIMING';
  };

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {/* 2.5D Viewport Engine */}
      <GameplayViewport
        ball={ball}
        goalkeeper={goalkeeper}
        wall={wall}
        distToGoal={distToGoal}
        stadium={stadium}
        weather={weather}
        ballSkin={ballSkin}
        touchPath={touchPath}
        isAiming={isAiming}
        frameCount={frameCountRef.current}
      />

      {/* Top HUD Overlay */}
      <View style={styles.hudHeader}>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>SCORE</Text>
          <Text style={styles.scoreValue}>{score.toLocaleString()}</Text>
        </View>

        {combo > 1 && (
          <View style={styles.comboBox}>
            <Ionicons name="flame" size={16} color="#ff6b00" />
            <Text style={styles.comboText}>COMBO {combo}X</Text>
          </View>
        )}

        <View style={styles.rightHud}>
          <View style={styles.infoBadge}>
            <Text style={styles.infoBadgeText}>{distToGoal}M</Text>
          </View>

          <TouchableOpacity
            style={styles.pauseBtn}
            onPress={() => {
              AudioManager.playButton();
              setIsPaused(true);
            }}
          >
            <Ionicons name="pause" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Touch Flick Callout Banner (shown when aiming) */}
      {shotStateRef.current === 'AIMING' && (
        <View style={styles.flickGuideBanner}>
          <Ionicons name="hand-left" size={20} color="#ccff00" />
          <Text style={styles.flickGuideText}>SWIPE FINGER UP TO FLICK SHOT</Text>
        </View>
      )}

      {/* Goal Result Modal */}
      <GoalResultModal
        visible={resultModalVisible && (shotResult?.isGoal ?? false)}
        result={shotResult}
        score={score}
        combo={combo}
        onRetry={handleInstantRetry}
        onHome={() => onNavigate('HOME')}
      />

      {/* Miss Result Modal */}
      <MissResultModal
        visible={resultModalVisible && !(shotResult?.isGoal ?? true)}
        result={shotResult}
        score={score}
        onRetry={handleInstantRetry}
        onHome={() => onNavigate('HOME')}
      />

      {/* Pause Menu Modal */}
      <Modal visible={isPaused} transparent animationType="fade">
        <View style={styles.pauseOverlay}>
          <View style={styles.pauseCard}>
            <Text style={styles.pauseTitle}>PAUSED</Text>

            <TouchableOpacity
              style={styles.pauseOptionBtn}
              onPress={() => {
                AudioManager.playButton();
                setIsPaused(false);
              }}
            >
              <Text style={styles.pauseOptionText}>RESUME</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pauseOptionBtn}
              onPress={handleInstantRetry}
            >
              <Text style={styles.pauseOptionText}>RESTART MATCH</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.pauseOptionBtn, { backgroundColor: '#d90429' }]}
              onPress={() => {
                AudioManager.playButton();
                setIsPaused(false);
                onNavigate('HOME');
              }}
            >
              <Text style={[styles.pauseOptionText, { color: '#ffffff' }]}>QUIT TO MENU</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#08121e',
  },
  hudHeader: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  scoreBox: {
    backgroundColor: 'rgba(8, 18, 30, 0.85)',
    borderColor: '#ccff00',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  scoreLabel: {
    color: '#a0aec0',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  scoreValue: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
  },
  comboBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 0, 0.25)',
    borderColor: '#ff6b00',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  comboText: {
    color: '#ff6b00',
    fontSize: 13,
    fontWeight: '900',
  },
  rightHud: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  infoBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  pauseBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flickGuideBanner: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(8, 18, 30, 0.85)',
    borderColor: '#ccff00',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  flickGuideText: {
    color: '#ccff00',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  pauseOverlay: {
    flex: 1,
    backgroundColor: 'rgba(8, 18, 30, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  pauseCard: {
    width: '100%',
    backgroundColor: '#101c24',
    borderColor: '#ccff00',
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  pauseTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 10,
  },
  pauseOptionBtn: {
    width: '100%',
    backgroundColor: '#ccff00',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  pauseOptionText: {
    color: '#08121e',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
});
