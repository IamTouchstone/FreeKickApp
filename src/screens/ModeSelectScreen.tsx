import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GamePhase, DifficultyLevel } from '../types/game';
import { AudioManager } from '../services/AudioManager';
import { HapticsManager } from '../services/HapticsManager';

interface ModeSelectScreenProps {
  onNavigate: (phase: GamePhase, params?: any) => void;
}

export const ModeSelectScreen: React.FC<ModeSelectScreenProps> = ({ onNavigate }) => {
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('PRO');

  const startQuickGame = () => {
    AudioManager.playButton();
    HapticsManager.tap();
    onNavigate('GAMEPLAY', { mode: 'QUICK', difficulty });
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            AudioManager.playButton();
            onNavigate('HOME');
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SELECT GAME MODE</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Mode 1: Quick Free Kick */}
        <View style={styles.modeCardHighlight}>
          <View style={styles.modeHeaderRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="football-sharp" size={28} color="#08121e" />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.modeTitle}>QUICK FREE KICK</Text>
              <Text style={styles.modeDesc}>Unlimited arcade practice & streak mode</Text>
            </View>
          </View>

          {/* Difficulty Selector */}
          <Text style={styles.diffLabel}>SELECT DIFFICULTY:</Text>
          <View style={styles.diffRow}>
            {(['STREET', 'PRO', 'LEGEND'] as DifficultyLevel[]).map(d => (
              <TouchableOpacity
                key={d}
                style={[styles.diffBtn, difficulty === d && styles.diffBtnActive]}
                onPress={() => {
                  AudioManager.playButton();
                  HapticsManager.tap();
                  setDifficulty(d);
                }}
              >
                <Text style={[styles.diffBtnText, difficulty === d && styles.diffBtnTextActive]}>
                  {d}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.startBtn}
            onPress={startQuickGame}
            activeOpacity={0.85}
          >
            <Text style={styles.startBtnText}>START MATCH</Text>
            <Ionicons name="play-circle" size={24} color="#08121e" />
          </TouchableOpacity>
        </View>

        {/* Mode 2: Skill Challenges */}
        <TouchableOpacity
          style={styles.modeCard}
          onPress={() => {
            AudioManager.playButton();
            HapticsManager.tap();
            onNavigate('CHALLENGES');
          }}
        >
          <View style={styles.modeHeaderRow}>
            <View style={[styles.iconCircle, { backgroundColor: '#ffd700' }]}>
              <Ionicons name="trophy" size={26} color="#08121e" />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.modeTitle}>CHALLENGE MODE</Text>
              <Text style={styles.modeDesc}>10 Hand-crafted free-kick skill scenarios</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ccff00" />
          </View>
        </TouchableOpacity>

        {/* Mode 3: Daily Challenge */}
        <TouchableOpacity
          style={styles.modeCard}
          onPress={() => {
            AudioManager.playButton();
            HapticsManager.tap();
            onNavigate('DAILY_CHALLENGE');
          }}
        >
          <View style={styles.modeHeaderRow}>
            <View style={[styles.iconCircle, { backgroundColor: '#ff6b00' }]}>
              <Ionicons name="calendar" size={26} color="#ffffff" />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.modeTitle}>DAILY CHALLENGE</Text>
              <Text style={styles.modeDesc}>New date-based offline goal objective daily</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ccff00" />
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#08121e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#0f2b1d',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  content: {
    padding: 20,
  },
  modeCardHighlight: {
    backgroundColor: '#112519',
    borderColor: '#ccff00',
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  modeCard: {
    backgroundColor: '#101c24',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  modeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ccff00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  modeDesc: {
    color: '#a0aec0',
    fontSize: 13,
    marginTop: 2,
  },
  diffLabel: {
    color: '#ccff00',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 18,
    marginBottom: 10,
  },
  diffRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  diffBtn: {
    flex: 1,
    backgroundColor: '#1a3325',
    borderColor: 'rgba(204, 255, 0, 0.3)',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  diffBtnActive: {
    backgroundColor: '#ccff00',
    borderColor: '#ccff00',
  },
  diffBtnText: {
    color: '#a0aec0',
    fontSize: 12,
    fontWeight: '800',
  },
  diffBtnTextActive: {
    color: '#08121e',
  },
  startBtn: {
    backgroundColor: '#ccff00',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  startBtnText: {
    color: '#08121e',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
});
