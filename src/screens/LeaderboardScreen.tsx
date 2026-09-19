import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GamePhase, UserStats } from '../types/game';
import { SaveManager } from '../services/SaveManager';
import { AudioManager } from '../services/AudioManager';

interface LeaderboardScreenProps {
  onNavigate: (phase: GamePhase, params?: any) => void;
}

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const res = await SaveManager.loadStats();
    setStats(res);
  };

  const accuracy = stats && stats.totalShots > 0
    ? Math.round((stats.totalGoals / stats.totalShots) * 100)
    : 0;

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
        <Text style={styles.headerTitle}>PERSONAL RECORDS</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Top Trophy Banner */}
        <View style={styles.trophyBanner}>
          <Ionicons name="trophy" size={54} color="#ffd700" />
          <Text style={styles.bestScoreLabel}>PERSONAL BEST SCORE</Text>
          <Text style={styles.bestScoreValue}>{stats ? stats.highScore.toLocaleString() : '0'}</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="flame" size={26} color="#ff6b00" />
            <Text style={styles.statVal}>{stats ? `${stats.bestCombo}X` : '0X'}</Text>
            <Text style={styles.statTitle}>BEST STREAK</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="football" size={26} color="#ccff00" />
            <Text style={styles.statVal}>{stats ? stats.totalGoals : '0'}</Text>
            <Text style={styles.statTitle}>TOTAL GOALS</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="disc" size={26} color="#00ffff" />
            <Text style={styles.statVal}>{accuracy}%</Text>
            <Text style={styles.statTitle}>ACCURACY RATE</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="ribbon" size={26} color="#ffd700" />
            <Text style={styles.statVal}>{stats ? stats.challengesCompleted : '0'}/10</Text>
            <Text style={styles.statTitle}>CHALLENGES</Text>
          </View>
        </View>
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
  },
  trophyBanner: {
    backgroundColor: '#112519',
    borderColor: '#ffd700',
    borderWidth: 1.5,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  bestScoreLabel: {
    color: '#a0aec0',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 10,
  },
  bestScoreValue: {
    color: '#ffd700',
    fontSize: 42,
    fontWeight: '900',
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#101c24',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
  },
  statVal: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 6,
  },
  statTitle: {
    color: '#a0aec0',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
  },
});
