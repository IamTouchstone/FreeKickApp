import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ShotResult } from '../types/game';
import { AudioManager } from '../services/AudioManager';
import { HapticsManager } from '../services/HapticsManager';

interface GoalResultModalProps {
  visible: boolean;
  result: ShotResult | null;
  score: number;
  combo: number;
  onRetry: () => void;
  onHome: () => void;
}

export const GoalResultModal: React.FC<GoalResultModalProps> = ({
  visible,
  result,
  score,
  combo,
  onRetry,
  onHome,
}) => {
  if (!visible || !result) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header Badge */}
          <View style={styles.goalHeader}>
            <Ionicons name="football" size={32} color="#ccff00" />
            <Text style={styles.goalTitle}>GOAL!</Text>
          </View>

          <Text style={styles.messageText}>{result.message}</Text>

          {/* Points Card */}
          <View style={styles.pointsBox}>
            <Text style={styles.pointsLabel}>POINTS EARNED</Text>
            <Text style={styles.pointsValue}>+{result.totalPoints.toLocaleString()}</Text>

            {combo > 1 && (
              <View style={styles.comboBadge}>
                <Ionicons name="flame" size={16} color="#ff6b00" />
                <Text style={styles.comboText}>COMBO MULTIPLIER {combo}X</Text>
              </View>
            )}
          </View>

          {/* Shot Breakdown */}
          <View style={styles.breakdownBox}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownKey}>BASE GOAL</Text>
              <Text style={styles.breakdownVal}>+{result.basePoints}</Text>
            </View>
            {result.bonuses.map((b, idx) => (
              <View key={`b_${idx}`} style={styles.breakdownRow}>
                <Text style={styles.breakdownKey}>{b.label}</Text>
                <Text style={styles.breakdownVal}>+{b.points}</Text>
              </View>
            ))}
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownKey}>SHOT SPEED</Text>
              <Text style={styles.breakdownVal}>{result.speedKmh} km/h</Text>
            </View>
          </View>

          {/* Total Score */}
          <Text style={styles.totalScoreText}>MATCH SCORE: {score.toLocaleString()}</Text>

          {/* ACTION BUTTONS */}
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => {
              AudioManager.playButton();
              HapticsManager.tap();
              onRetry();
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="refresh-circle" size={30} color="#08121e" />
            <Text style={styles.retryBtnText}>RETRY (TAKE NEXT SHOT)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.homeBtn}
            onPress={() => {
              AudioManager.playButton();
              onHome();
            }}
          >
            <Text style={styles.homeBtnText}>MAIN MENU</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(8, 18, 30, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    backgroundColor: '#0f2b1d',
    borderColor: '#ccff00',
    borderWidth: 2,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  goalTitle: {
    color: '#ccff00',
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 3,
  },
  messageText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
  },
  pointsBox: {
    backgroundColor: '#08121e',
    borderColor: 'rgba(204, 255, 0, 0.3)',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  pointsLabel: {
    color: '#a0aec0',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
  },
  pointsValue: {
    color: '#ffd700',
    fontSize: 32,
    fontWeight: '900',
    marginTop: 2,
  },
  comboBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 0, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 6,
    gap: 4,
  },
  comboText: {
    color: '#ff6b00',
    fontSize: 11,
    fontWeight: '900',
  },
  breakdownBox: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 6,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownKey: {
    color: '#a0aec0',
    fontSize: 12,
    fontWeight: '700',
  },
  breakdownVal: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  totalScoreText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 20,
  },
  retryBtn: {
    width: '100%',
    backgroundColor: '#ccff00',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  retryBtnText: {
    color: '#08121e',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  homeBtn: {
    paddingVertical: 10,
  },
  homeBtnText: {
    color: '#a0aec0',
    fontSize: 13,
    fontWeight: '800',
  },
});
