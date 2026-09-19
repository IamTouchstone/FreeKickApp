import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Rect,
  Circle,
  Path,
  G,
  Text as SvgText,
  Line,
  Polygon,
  Polyline,
  Ellipse,
} from 'react-native-svg';
import {
  BallState,
  GoalkeeperState,
  WallState,
  StadiumTheme,
  WeatherType,
  BallSkin,
} from '../types/game';
import { GOAL_WIDTH, GOAL_HEIGHT } from '../engine/BallPhysics';
import { TouchPoint } from '../engine/FlickController';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface GameplayViewportProps {
  ball: BallState;
  goalkeeper: GoalkeeperState;
  wall: WallState;
  distToGoal: number;
  stadium: StadiumTheme;
  weather: WeatherType;
  ballSkin: BallSkin;
  touchPath: TouchPoint[];
  isAiming: boolean;
  frameCount: number;
}

export const GameplayViewport: React.FC<GameplayViewportProps> = ({
  ball,
  goalkeeper,
  wall,
  distToGoal = 20,
  stadium = 'NIGHT',
  weather = 'CLEAR',
  ballSkin = 'CLASSIC',
  touchPath = [],
  isAiming = false,
  frameCount = 0,
}) => {
  // Safe Array Fallbacks
  const safeTrail = (ball && Array.isArray(ball.trail)) ? ball.trail : [];
  const safeDefenders = (wall && Array.isArray(wall.defenders)) ? wall.defenders : [];
  const safeTouchPath = Array.isArray(touchPath) ? touchPath : [];
  const safeDistToGoal = Math.max(distToGoal || 20, 10);
  const safeGk = goalkeeper || { x: 0, z: 0.1, state: 'IDLE' };
  const safeBall = ball || { x: 0, y: 0, z: 0.11 };

  // Perspective 3D -> 2D Projection helper
  const project3D = (x: number, y: number, z: number) => {
    const normY = y / safeDistToGoal;
    const horizonY = SCREEN_HEIGHT * 0.28;
    const startY = SCREEN_HEIGHT * 0.82;

    const screenY = startY - normY * (startY - horizonY) - z * 32 * (1 - normY * 0.4);
    const screenX = SCREEN_WIDTH / 2 + (x * 38) / (0.8 + normY * 0.6);
    const scale = Math.max(1.2 - normY * 0.75, 0.25);

    return { screenX, screenY, scale };
  };

  // Ball 2D projection
  const ballProj = project3D(safeBall.x, safeBall.y, safeBall.z);
  const ballShadowProj = project3D(safeBall.x, safeBall.y, 0);

  // Goal Post 2D projection
  const leftPostBottom = project3D(-GOAL_WIDTH / 2, safeDistToGoal, 0);
  const leftPostTop = project3D(-GOAL_WIDTH / 2, safeDistToGoal, GOAL_HEIGHT);
  const rightPostBottom = project3D(GOAL_WIDTH / 2, safeDistToGoal, 0);
  const rightPostTop = project3D(GOAL_WIDTH / 2, safeDistToGoal, GOAL_HEIGHT);

  // Goalkeeper 2D projection
  const gkProj = project3D(safeGk.x, safeDistToGoal - 0.2, safeGk.z);

  // Wall 2D projection
  const wallDist = (wall && typeof wall.distance === 'number') ? wall.distance : 9.15;
  const wallProj = project3D(0, wallDist, 0);

  // Rain drop generator
  const renderRain = () => {
    if (weather !== 'RAIN') return null;
    const rainLines = [];
    for (let i = 0; i < 28; i++) {
      const rx = (i * 37 + frameCount * 18) % SCREEN_WIDTH;
      const ry = (i * 53 + frameCount * 28) % SCREEN_HEIGHT;
      rainLines.push(
        <Line
          key={`rain_${i}`}
          x1={rx}
          y1={ry}
          x2={rx - 4}
          y2={ry + 16}
          stroke="rgba(200, 230, 255, 0.4)"
          strokeWidth="1.5"
        />
      );
    }
    return <G>{rainLines}</G>;
  };

  // Stadium theme color setups
  const getStadiumColors = () => {
    switch (stadium) {
      case 'DAY':
        return {
          skyTop: '#4a90e2',
          skyBottom: '#87ceeb',
          grassDark: '#2e7d32',
          grassLight: '#388e3c',
          floodlight: '#fff5cc',
        };
      case 'STREET':
        return {
          skyTop: '#1a0933',
          skyBottom: '#4a154b',
          grassDark: '#1b4332',
          grassLight: '#2d6a4f',
          floodlight: '#ffaa00',
        };
      case 'AFRICAN':
        return {
          skyTop: '#3d0c02',
          skyBottom: '#cc5500',
          grassDark: '#22577a',
          grassLight: '#38a3a5',
          floodlight: '#ffdd00',
        };
      case 'NIGHT':
      default:
        return {
          skyTop: '#08121e',
          skyBottom: '#0f2b1d',
          grassDark: '#0d381e',
          grassLight: '#144c2a',
          floodlight: '#ccff00',
        };
    }
  };

  const colors = getStadiumColors();

  // Confetti Particle Celebration Burst on Goal
  const renderConfetti = () => {
    if (!safeBall.isGoal) return null;
    const particles = [];
    const colorsList = ['#ff0055', '#00e5ff', '#ffea00', '#76ff03', '#e040fb', '#ffffff', '#ff9100'];
    const originX = SCREEN_WIDTH / 2;
    const originY = SCREEN_HEIGHT * 0.32;

    for (let i = 0; i < 40; i++) {
      const angle = (i * (360 / 40) * Math.PI) / 180;
      const speed = 12 + (i % 7) * 4;
      const dist = ((frameCount * 6) % 180) + speed;
      const px = originX + Math.cos(angle) * dist * 1.6;
      const py = originY + Math.sin(angle) * dist + (dist * dist * 0.002);
      const color = colorsList[i % colorsList.length];
      const size = 6 + (i % 4) * 2;

      particles.push(
        <Rect
          key={`confetti_${i}`}
          x={px}
          y={py}
          width={size}
          height={size}
          fill={color}
          transform={`rotate(${frameCount * 8 + i * 20}, ${px}, ${py})`}
          opacity={Math.max(1.0 - dist / 180, 0)}
        />
      );
    }
    return <G>{particles}</G>;
  };

  return (
    <View style={styles.container}>
      <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT}>
        <Defs>
          <LinearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.skyTop} />
            <Stop offset="1" stopColor={colors.skyBottom} />
          </LinearGradient>

          <LinearGradient id="pitchGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.grassLight} />
            <Stop offset="1" stopColor={colors.grassDark} />
          </LinearGradient>

          <RadialGradient id="lightGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={colors.floodlight} stopOpacity="0.8" />
            <Stop offset="100%" stopColor={colors.floodlight} stopOpacity="0" />
          </RadialGradient>

          <RadialGradient id="shadowGrad" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#000000" stopOpacity="0.6" />
            <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </RadialGradient>

          <RadialGradient id="ballClassicGrad" cx="35%" cy="35%" r="65%">
            <Stop offset="0%" stopColor="#ffffff" />
            <Stop offset="70%" stopColor="#e0e0e0" />
            <Stop offset="100%" stopColor="#888888" />
          </RadialGradient>
          <RadialGradient id="ballGoldGrad" cx="35%" cy="35%" r="65%">
            <Stop offset="0%" stopColor="#fff2a3" />
            <Stop offset="60%" stopColor="#ffd700" />
            <Stop offset="100%" stopColor="#b8860b" />
          </RadialGradient>
          <RadialGradient id="ballProGrad" cx="35%" cy="35%" r="65%">
            <Stop offset="0%" stopColor="#e0ffff" />
            <Stop offset="50%" stopColor="#00ffff" />
            <Stop offset="100%" stopColor="#008b8b" />
          </RadialGradient>
        </Defs>

        {/* 1. Sky Background */}
        <Rect x="0" y="0" width={SCREEN_WIDTH} height={SCREEN_HEIGHT * 0.45} fill="url(#skyGrad)" />

        {/* Stadium Floodlight Towers */}
        <G opacity={0.85}>
          <Circle cx={SCREEN_WIDTH * 0.12} cy={SCREEN_HEIGHT * 0.1} r="45" fill="url(#lightGlow)" />
          <Circle cx={SCREEN_WIDTH * 0.88} cy={SCREEN_HEIGHT * 0.1} r="45" fill="url(#lightGlow)" />
          <Rect x={SCREEN_WIDTH * 0.11} y={SCREEN_HEIGHT * 0.1} width="8" height="120" fill="#222" />
          <Rect x={SCREEN_WIDTH * 0.87} y={SCREEN_HEIGHT * 0.1} width="8" height="120" fill="#222" />
        </G>

        {/* Stadium Crowds / Stands Silhouette */}
        <Path
          d={`M 0 ${SCREEN_HEIGHT * 0.28} Q ${SCREEN_WIDTH * 0.5} ${SCREEN_HEIGHT * 0.24} ${SCREEN_WIDTH} ${SCREEN_HEIGHT * 0.28} L ${SCREEN_WIDTH} ${SCREEN_HEIGHT * 0.35} L 0 ${SCREEN_HEIGHT * 0.35} Z`}
          fill="#111c15"
          opacity={0.9}
        />

        {/* 2. Pitch / Grass Floor */}
        <Polygon
          points={`0,${SCREEN_HEIGHT * 0.28} ${SCREEN_WIDTH},${SCREEN_HEIGHT * 0.28} ${SCREEN_WIDTH},${SCREEN_HEIGHT} 0,${SCREEN_HEIGHT}`}
          fill="url(#pitchGrad)"
        />

        {/* Pitch Stripes Perspective */}
        {[0.28, 0.35, 0.44, 0.55, 0.68, 0.84].map((yRatio, idx) => (
          <Rect
            key={`stripe_${idx}`}
            x="0"
            y={SCREEN_HEIGHT * yRatio}
            width={SCREEN_WIDTH}
            height={SCREEN_HEIGHT * 0.04 * (idx + 1)}
            fill="#ffffff"
            opacity={idx % 2 === 0 ? 0.04 : 0}
          />
        ))}

        {/* Goal Line & Penalty Box Perspective */}
        <Line
          x1={leftPostBottom.screenX - 30}
          y1={leftPostBottom.screenY}
          x2={rightPostBottom.screenX + 30}
          y2={rightPostBottom.screenY}
          stroke="#ffffff"
          strokeWidth="2.5"
          opacity={0.8}
        />

        {/* 3. Goal Net & Frame */}
        <G opacity={0.35}>
          {[-3.0, -2.0, -1.0, 0, 1.0, 2.0, 3.0].map((nx, i) => {
            const netTop = project3D(nx, safeDistToGoal, GOAL_HEIGHT);
            const netBot = project3D(nx, safeDistToGoal, 0);
            return (
              <Line
                key={`net_v_${i}`}
                x1={netTop.screenX}
                y1={netTop.screenY}
                x2={netBot.screenX}
                y2={netBot.screenY}
                stroke="#ffffff"
                strokeWidth="1"
              />
            );
          })}
          {[0.5, 1.0, 1.5, 2.0].map((nz, i) => {
            const netL = project3D(-GOAL_WIDTH / 2, safeDistToGoal, nz);
            const netR = project3D(GOAL_WIDTH / 2, safeDistToGoal, nz);
            return (
              <Line
                key={`net_h_${i}`}
                x1={netL.screenX}
                y1={netL.screenY}
                x2={netR.screenX}
                y2={netR.screenY}
                stroke="#ffffff"
                strokeWidth="1"
              />
            );
          })}
        </G>

        {/* White Posts & Crossbar */}
        <Line
          x1={leftPostBottom.screenX}
          y1={leftPostBottom.screenY}
          x2={leftPostTop.screenX}
          y2={leftPostTop.screenY}
          stroke="#ffffff"
          strokeWidth="6"
        />
        <Line
          x1={rightPostBottom.screenX}
          y1={rightPostBottom.screenY}
          x2={rightPostTop.screenX}
          y2={rightPostTop.screenY}
          stroke="#ffffff"
          strokeWidth="6"
        />
        <Line
          x1={leftPostTop.screenX}
          y1={leftPostTop.screenY}
          x2={rightPostTop.screenX}
          y2={rightPostTop.screenY}
          stroke="#ffffff"
          strokeWidth="6"
        />

        {/* 4. Goalkeeper */}
        <G transform={`translate(${gkProj.screenX}, ${gkProj.screenY}) scale(${gkProj.scale})`}>
          <Circle cx="0" cy="-60" r="16" fill="#ffe600" />
          <Path d="M -22 -42 L 22 -42 L 18 10 L -18 10 Z" fill="#ffe600" />
          <Rect x="-16" y="10" width="14" height="24" fill="#111" />
          <Rect x="2" y="10" width="14" height="24" fill="#111" />

          {safeGk.state === 'DIVING_LEFT' ? (
            <G>
              <Line x1="-20" y1="-35" x2="-65" y2="-45" stroke="#ffe600" strokeWidth="10" strokeLinecap="round" />
              <Line x1="20" y1="-35" x2="-25" y2="-55" stroke="#ffe600" strokeWidth="10" strokeLinecap="round" />
            </G>
          ) : safeGk.state === 'DIVING_RIGHT' ? (
            <G>
              <Line x1="20" y1="-35" x2="65" y2="-45" stroke="#ffe600" strokeWidth="10" strokeLinecap="round" />
              <Line x1="-20" y1="-35" x2="25" y2="-55" stroke="#ffe600" strokeWidth="10" strokeLinecap="round" />
            </G>
          ) : (
            <G>
              <Line x1="-20" y1="-35" x2="-42" y2="-10" stroke="#ffe600" strokeWidth="10" strokeLinecap="round" />
              <Line x1="20" y1="-35" x2="42" y2="-10" stroke="#ffe600" strokeWidth="10" strokeLinecap="round" />
            </G>
          )}
        </G>

        {/* 5. Defensive Wall */}
        {safeDefenders.length > 0 && (
          <G transform={`translate(${wallProj.screenX}, ${wallProj.screenY}) scale(${wallProj.scale})`}>
            {safeDefenders.map((def, idx) => {
              const defX = (def && typeof def.x === 'number') ? def.x * 48 : 0;
              const heightOffset = (def && typeof def.heightOffset === 'number') ? def.heightOffset : 0;
              const jumpY = -heightOffset * 45;
              return (
                <G key={`def_${idx}`} transform={`translate(${defX}, ${jumpY})`}>
                  <Circle cx="0" cy="-70" r="14" fill="#c28e67" />
                  <Rect x="-18" y="-52" width="36" height="42" fill="#d90429" rx="4" />
                  <Rect x="-8" y="-52" width="16" height="42" fill="#ffffff" />
                  <Rect x="-18" y="-10" width="36" height="18" fill="#111" />
                  <Rect x="-14" y="8" width="11" height="28" fill="#c28e67" />
                  <Rect x="3" y="8" width="11" height="28" fill="#c28e67" />
                  <Rect x="-14" y="30" width="11" height="12" fill="#ffffff" />
                  <Rect x="3" y="30" width="11" height="12" fill="#ffffff" />
                </G>
              );
            })}
          </G>
        )}

        {/* 6. Ball Trail */}
        {safeTrail.length > 2 && (
          <G opacity={0.65}>
            {safeTrail.map((tp, idx) => {
              if (idx === 0) return null;
              const prevPoint = safeTrail[idx - 1] || tp;
              const p1 = project3D(prevPoint.x, prevPoint.y, prevPoint.z);
              const p2 = project3D(tp.x, tp.y, tp.z);
              const opacity = idx / safeTrail.length;
              return (
                <Line
                  key={`trail_${idx}`}
                  x1={p1.screenX}
                  y1={p1.screenY}
                  x2={p2.screenX}
                  y2={p2.screenY}
                  stroke="#ccff00"
                  strokeWidth={4 * opacity}
                  opacity={opacity}
                />
              );
            })}
          </G>
        )}

        {/* 7. Ball Shadow on Pitch */}
        <G transform={`translate(${ballShadowProj.screenX}, ${ballShadowProj.screenY})`}>
          <Ellipse
            cx="0"
            cy="0"
            rx={Math.max(22 * ballShadowProj.scale - safeBall.z * 2, 4)}
            ry={Math.max(8 * ballShadowProj.scale - safeBall.z * 0.8, 2)}
            fill="url(#shadowGrad)"
            opacity={Math.max(0.7 - safeBall.z * 0.15, 0.1)}
          />
        </G>

        {/* 8. Football */}
        <G transform={`translate(${ballProj.screenX}, ${ballProj.screenY}) scale(${ballProj.scale})`}>
          <Circle
            cx="0"
            cy="0"
            r="22"
            fill={
              ballSkin === 'GOLD'
                ? 'url(#ballGoldGrad)'
                : ballSkin === 'PRO'
                ? 'url(#ballProGrad)'
                : 'url(#ballClassicGrad)'
            }
          />
          <Polygon points="0,-12 -8,-4 -5,6 5,6 8,-4" fill="#222222" opacity={0.85} />
          <Polygon points="-18,-4 -22,4 -16,12 -10,6 -12,-4" fill="#222222" opacity={0.8} />
          <Polygon points="18,-4 22,4 16,12 10,6 12,-4" fill="#222222" opacity={0.8} />
        </G>

        {/* 9. Aim & Flick Touch Guide Indicator */}
        {isAiming && safeTouchPath.length >= 2 && (
          <G>
            <Polyline
              points={safeTouchPath.map(p => `${p.x},${p.y}`).join(' ')}
              stroke="#ccff00"
              strokeWidth="4"
              strokeDasharray="6,4"
            />
            <Circle
              cx={safeTouchPath[safeTouchPath.length - 1].x}
              cy={safeTouchPath[safeTouchPath.length - 1].y}
              r="14"
              fill="#ccff00"
              opacity={0.8}
            />
          </G>
        )}

        {/* 10. Weather Effects & Celebration Burst */}
        {renderRain()}
        {renderConfetti()}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#08121e',
  },
});
