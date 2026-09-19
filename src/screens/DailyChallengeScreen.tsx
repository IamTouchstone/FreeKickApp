import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GamePhase, DailyChallengeState } from '../types/game';
import { DailyChallengeManager } from '../services/DailyChallengeManager';
import { AudioManager } from '../services/AudioManager';
import { HapticsManager } from '../services/HapticsManager';

interface DailyChallengeScreenProps {
  onNavigate: (phase: GamePhase, params?: any) => void;
}

export const DailyChallengeScreen: React.FC<DailyChallengeScreenProps> = ({ onNavigate }) => {
  const [data, setData] = useState<{
    challenge: DailyChallengeState;
    difficulty: any;
    wallSize: number;
    stadium: any;
    weather: any;
  } | null>(null);

  useEffect(() => {
    loadDaily();
  }, []);

  const loadDaily = async () => {
    const res = await DailyChallengeManager.getDailyChallenge();
    setData(res);
  };

  const handleStart = () => {
    if (!data) return;
    AudioManager.playButton();
    HapticsManager.tap();
    onNavigate('GAMEPLAY', {
      mode: 'DAILY',
      difficulty: data.difficulty,
      wallSize: data.wallSize,
      stadium: data.stadium,
      weather: data.weather,
    });
  };

  if (!data) return null;
  const { challenge } = data;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            AudioManager.playButton();
            onNavigate('HOME');
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>DAILY CHALLENGE</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.dateBadge}>
          <Ionicons name="calendar" size={16} color="#08121e" />
          <Text style={styles.dateText}>TODAY ({challenge.dateString})</Text>
        </View>

        <Text style={styles.challengeTitle}>{challenge.title}</Text>
        <Text style={styles.challengeDesc}>{challenge.description}</Text>

        {/* Goal Objective Card */}
        <View style={styles.objectiveCard}>
          <View style={styles.objRow}>
            <Text style={styles.objLabel}>TARGET OBJECTIVE:</Text>
            <Text style={styles.objVal}>{challenge.targetGoals} Goals</Text>
          </View>
          <View style={styles.objRow}>
            <Text style={styles.objLabel}>MAX ATTEMPTS:</Text>
            <Text style={styles.objVal}>{challenge.maxAttempts} Shots</Text>
          </View>
          <View style={styles.objRow}>
            <Text style={styles.objLabel}>DEFENSIVE WALL:</Text>
            <Text style={styles.objVal}>{data.wallSize} Defenders</Text>
          </View>
          <View style={styles.objRow}>
            <Text style={styles.objLabel}>DIFFICULTY:</Text>
            <Text style={styles.objVal}>{data.difficulty}</Text>
          </View>
          <View style={styles.objRow}>
            <Text style={styles.objLabel}>STADIUM / WEATHER:</Text>
            <Text style={styles.objVal}>{data.stadium} / {data.weather}</Text>
          </View>
        </View>

        {/* Reward Box */}
        <View style={styles.rewardCard}>
          <Ionicons name="gift" size={32} color="#ffd700" />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.rewardTitle}>COMPLETION REWARD</Text>
            <Text style={styles.rewardVal}>+500 BONUS POINTS</Text>
          </View>
        </View>

        {/* Play Action Button */}
        <TouchableOpacity
          style={styles.playBtn}
          onPress={handleStart}
          activeOpacity={0.85}
        >
          <Ionicons name="play" size={28} color="#08121e" />
          <Text style={styles.playBtnText}>
            {challenge.completed ? 'PLAY AGAIN' : 'START DAILY CHALLENGE'}
          </Text>
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
  backBtn: {
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
    alignItems: 'center',
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ccff00',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 6,
    marginBottom: 16,
  },
  dateText: {
    color: '#08121e',
    fontSize: 12,
    fontWeight: '900',
  },
  challengeTitle: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  challengeDesc: {
    color: '#a0aec0',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  objectiveCard: {
    width: '100%',
    backgroundColor: '#101c24',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    gap: 12,
    marginBottom: 20,
  },
  objRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  objLabel: {
    color: '#a0aec0',
    fontSize: 12,
    fontWeight: '800',
  },
  objVal: {
    color: '#ccff00',
    fontSize: 13,
    fontWeight: '900',
  },
  rewardCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1d12',
    borderColor: '#ffd700',
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 24,
  },
  rewardTitle: {
    color: '#a0aec0',
    fontSize: 11,
    fontWeight: '800',
  },
  rewardVal: {
    color: '#ffd700',
    fontSize: 18,
    fontWeight: '900',
  },
  playBtn: {
    width: '100%',
    backgroundColor: '#ccff00',
    borderRadius: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  playBtnText: {
    color: '#08121e',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
});
