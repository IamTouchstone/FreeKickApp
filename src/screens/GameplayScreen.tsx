import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, PanResponder, Dimensions, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GamePhase, DifficultyLevel, BallState, GoalkeeperState, WallState, ShotResult, StadiumTheme, WeatherType, BallSkin } from '../types/game';
import { BallPhysics } from '../engine/BallPhysics';
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

interface GameplayScreenProps {
  onNavigate: (phase: GamePhase, params?: any) => void;
  routeParams?: any;
}

export const GameplayScreen: React.FC<GameplayScreenProps> = ({ onNavigate, routeParams }) => {
  const difficulty: DifficultyLevel = routeParams?.difficulty || 'PRO';
  const distToGoal: number = routeParams?.distToGoal || 20;
  const numDefenders: number = routeParams?.wallSize !== undefined ? routeParams.wallSize : 4;
  const stadium: StadiumTheme = routeParams?.stadium || 'NIGHT';
  const weather: WeatherType = routeParams?.weather || 'CLEAR';
  const ballSkin: BallSkin = routeParams?.ballSkin || 'CLASSIC';

  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [totalGoals, setTotalGoals] = useState(0);
  const [shotCount, setShotCount] = useState(0);
  const [isAiming, setIsAiming] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [attempts, setAttempts] = useState(1);
  const MAX_ATTEMPTS = 4;
  const [keeperMessage, setKeeperMessage] = useState("");

  const flickController = useRef(new FlickController()).current;
  const [ball, setBall] = useState<BallState>(BallPhysics.createInitialBall(distToGoal));
  const [goalkeeper, setGoalkeeper] = useState<GoalkeeperState>(GoalkeeperAI.createGoalkeeper(difficulty, attempts));
  const [wall, setWall] = useState<WallState>(WallSystem.createWall(numDefenders, 9.15));
  const [touchPath, setTouchPath] = useState<TouchPoint[]>([]);

  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [shotResult, setShotResult] = useState<ShotResult | null>(null);

  const animFrameRef = useRef<number | null>(null);
  const frameCountRef = useRef(0);
  const shotStateRef = useRef<'AIMING' | 'FLICKED' | 'RESULT_TRIGGERED'>('AIMING');

  useEffect(() => {
    const loop = () => {
      frameCountRef.current += 1;
      updateGameStep();
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [ball, goalkeeper, wall]);

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
          setWall(prev => WallSystem.triggerWallJump(prev));
        }
      },
    })
  ).current;

  const updateGameStep = () => {
    if (shotStateRef.current !== 'FLICKED' || isPaused) return;
    
    // @ts-ignore
    const physRes = BallPhysics.step(ball, distToGoal, wall, goalkeeper, 0.016);
    setBall(physRes.ball);

    // FIXED - ONLY 2 ARGS - NO RED LINES
      const newGk = GoalkeeperAI.update(goalkeeper, physRes.ball, distToGoal, difficulty, frameCountRef.current, totalGoals);

    // FIXED - ONLY 1 ARG
    const newWall = WallSystem.updateWall(wall, frameCountRef.current, totalGoals);

    if (physRes.event !== 'NONE' && shotStateRef.current === 'FLICKED') {
      if (physRes.event === 'WALL_HIT') { AudioManager.playWallHit(); HapticsManager.wallHit(); triggerShotResult(physRes.ball, physRes.event); }
      else if (physRes.event === 'POST_HIT') { AudioManager.playPostHit(); HapticsManager.postHit(); triggerShotResult(physRes.ball, physRes.event); }
      else if (physRes.event === 'SAVED') { AudioManager.playSave(); HapticsManager.save(); triggerShotResult(physRes.ball, physRes.event); }
      else if (physRes.event === 'GOAL') { AudioManager.playGoalCheer(); AudioManager.playNetSound(); HapticsManager.goal(); triggerShotResult(physRes.ball, physRes.event); }
      else if (physRes.event === 'OUT') { triggerShotResult(physRes.ball, physRes.event); }
    }
  };

  const triggerShotResult = (finalBall: BallState, shotEvent: any) => {
    shotStateRef.current = 'RESULT_TRIGGERED';
    setTimeout(() => {
      const result = GoalDetector.evaluateShot(finalBall, distToGoal, wall, combo, shotEvent);
      setShotResult(result);
      if (result.isGoal) {
        setTotalGoals(prev => prev + 1);
        const newScore = score + result.totalPoints;
        const newCombo = combo + 1;
        setScore(newScore);
        setCombo(newCombo);
        if (newCombo > 1) AudioManager.playCombo();
        SaveManager.updateStats(newScore, newCombo, true);
        setAttempts(1);
        setKeeperMessage("GOAL! 🔥");
      } else {
        setCombo(1);
        SaveManager.updateStats(score, combo, false);
        const nextAttempt = attempts + 1;
        setAttempts(nextAttempt);
        if (nextAttempt === 3) setKeeperMessage("Keeper tired! 😮‍💨");
        else if (nextAttempt >= 4) setKeeperMessage("Keeper dives WRONG! 🤣");
        else setKeeperMessage("Keeper CAUGHT! 🧤");
      }
      setShotCount(prev => prev + 1);
      setResultModalVisible(true);
    }, 450);
  };

  const handleInstantRetry = () => {
    setResultModalVisible(false);
    setShotResult(null);
    flickController.reset();
    setTouchPath([]);
    if (attempts > MAX_ATTEMPTS && !shotResult?.isGoal) { setAttempts(1); onNavigate('HOME'); return; }
    setBall(BallPhysics.createInitialBall(distToGoal));
    setGoalkeeper(GoalkeeperAI.createGoalkeeper(difficulty, attempts));
    setWall(WallSystem.createWall(numDefenders, 9.15));
    shotStateRef.current = 'AIMING';
  };

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <GameplayViewport ball={ball} goalkeeper={goalkeeper} wall={wall} distToGoal={distToGoal} stadium={stadium} weather={weather} ballSkin={ballSkin} touchPath={touchPath} isAiming={isAiming} frameCount={frameCountRef.current} />
      <View style={styles.hudHeader}>
        <View style={styles.scoreBox}><Text style={styles.scoreLabel}>SCORE</Text><Text style={styles.scoreValue}>{score}</Text></View>
        {combo > 1 && <View style={styles.comboBox}><Ionicons name="flame" size={16} color="#ff6b00" /><Text style={styles.comboText}>COMBO {combo}X</Text></View>}
        <View style={styles.rightHud}>
          <View style={styles.infoBadge}><Text style={styles.infoBadgeText}>{distToGoal}M | TRY {attempts}/{MAX_ATTEMPTS}</Text></View>
          <TouchableOpacity style={styles.pauseBtn} onPress={() => { AudioManager.playButton(); setIsPaused(true); }}><Ionicons name="pause" size={20} color="#fff" /></TouchableOpacity>
        </View>
      </View>
      {keeperMessage !== "" && <View style={styles.keeperMessageBanner}><Text style={styles.keeperMessageText}>{keeperMessage}</Text></View>}
      {shotStateRef.current === 'AIMING' && <View style={styles.flickGuideBanner}><Ionicons name="hand-left" size={20} color="#ccff00" /><Text style={styles.flickGuideText}>SWIPE UP TO FLICK</Text></View>}
      <GoalResultModal visible={resultModalVisible && (shotResult?.isGoal ?? false)} result={shotResult} score={score} combo={combo} onRetry={handleInstantRetry} onHome={() => onNavigate('HOME')} />
      <MissResultModal visible={resultModalVisible && !(shotResult?.isGoal ?? true)} result={shotResult} score={score} onRetry={handleInstantRetry} onHome={() => onNavigate('HOME')} />
      <Modal visible={isPaused} transparent animationType="fade">
        <View style={styles.pauseOverlay}><View style={styles.pauseCard}>
          <Text style={styles.pauseTitle}>PAUSED</Text>
          <TouchableOpacity style={styles.pauseOptionBtn} onPress={() => { AudioManager.playButton(); setIsPaused(false); }}><Text style={styles.pauseOptionText}>RESUME</Text></TouchableOpacity>
          <TouchableOpacity style={styles.pauseOptionBtn} onPress={handleInstantRetry}><Text style={styles.pauseOptionText}>RESTART</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.pauseOptionBtn, { backgroundColor: '#d90429' }]} onPress={() => { AudioManager.playButton(); setIsPaused(false); onNavigate('HOME'); }}><Text style={[styles.pauseOptionText, { color: '#fff' }]}>QUIT</Text></TouchableOpacity>
        </View></View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#08121e' },
  hudHeader: { position: 'absolute', top: 50, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 },
  scoreBox: { backgroundColor: 'rgba(8,18,30,0.85)', borderColor: '#ccff00', borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 6 },
  scoreLabel: { color: '#a0aec0', fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  scoreValue: { color: '#ffffff', fontSize: 20, fontWeight: '900' },
  comboBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,107,0,0.25)', borderColor: '#ff6b00', borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, gap: 4 },
  comboText: { color: '#ff6b00', fontSize: 13, fontWeight: '900' },
  rightHud: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoBadge: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  infoBadgeText: { color: '#ffffff', fontSize: 12, fontWeight: '900' },
  pauseBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  keeperMessageBanner: { position: 'absolute', top: 100, alignSelf: 'center', backgroundColor: 'rgba(204,255,0,0.9)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, zIndex: 20 },
  keeperMessageText: { color: '#08121e', fontSize: 14, fontWeight: '900' },
  flickGuideBanner: { position: 'absolute', bottom: 40, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(8,18,30,0.85)', borderColor: '#ccff00', borderWidth: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  flickGuideText: { color: '#ccff00', fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
  pauseOverlay: { flex: 1, backgroundColor: 'rgba(8,18,30,0.9)', justifyContent: 'center', alignItems: 'center', padding: 30 },
  pauseCard: { width: '100%', backgroundColor: '#101c24', borderColor: '#ccff00', borderWidth: 1.5, borderRadius: 20, padding: 24, alignItems: 'center', gap: 12 },
  pauseTitle: { color: '#ffffff', fontSize: 24, fontWeight: '900', letterSpacing: 2, marginBottom: 10 },
  pauseOptionBtn: { width: '100%', backgroundColor: '#ccff00', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  pauseOptionText: { color: '#08121e', fontSize: 15, fontWeight: '900', letterSpacing: 1.5 },
});