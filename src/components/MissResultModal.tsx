import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ShotResult } from '../types/game';
import { AudioManager } from '../services/AudioManager';
import { HapticsManager } from '../services/HapticsManager';

interface MissResultModalProps {
  visible: boolean;
  result: ShotResult | null;
  score: number;
  onRetry: () => void;
  onHome: () => void;
}

export const MissResultModal: React.FC<MissResultModalProps> = ({
  visible,
  result,
  score,
  onRetry,
  onHome,
}) => {
  if (!visible || !result) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Ionicons name="close-circle" size={34} color="#ff4d4d" />
            <Text style={styles.title}>SO CLOSE!</Text>
          </View>

          <Text style={styles.messageText}>{result.message}</Text>

          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>COMBO RESET TO 1X</Text>
            <Text style={styles.infoSub}>Adjust flick curve and shot elevation to beat the defense!</Text>
          </View>

          <Text style={styles.scoreText}>CURRENT SCORE: {score.toLocaleString()}</Text>

          <TouchableOpacity
            style={styles.adRetryBtn}
            onPress={() => {
              AudioManager.playButton();
              HapticsManager.tap();
              onRetry();
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="play-circle" size={26} color="#08121e" />
            <Text style={styles.adRetryBtnText}>WATCH AD FOR RETRY</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => {
              AudioManager.playButton();
              HapticsManager.tap();
              onRetry();
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="refresh-circle" size={30} color="#ffffff" />
            <Text style={styles.retryBtnText}>RETRY INSTANTLY</Text>
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
    backgroundColor: '#1a1829',
    borderColor: '#ff4d4d',
    borderWidth: 2,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  title: {
    color: '#ff4d4d',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 2,
  },
  messageText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 18,
  },
  infoBox: {
    backgroundColor: '#08121e',
    borderColor: 'rgba(255, 77, 77, 0.3)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    width: '100%',
    marginBottom: 18,
  },
  infoLabel: {
    color: '#ff4d4d',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  infoSub: {
    color: '#a0aec0',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  scoreText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 20,
  },
  adRetryBtn: {
    width: '100%',
    backgroundColor: '#ffcc00',
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  adRetryBtnText: {
    color: '#08121e',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  retryBtn: {
    width: '100%',
    backgroundColor: '#d90429',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  retryBtnText: {
    color: '#ffffff',
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
