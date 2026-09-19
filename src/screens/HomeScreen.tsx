import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GamePhase, UserStats, DailyChallengeState } from '../types/game';
import { SaveManager } from '../services/SaveManager';
import { DailyChallengeManager } from '../services/DailyChallengeManager';
import { AudioManager } from '../services/AudioManager';
import { HapticsManager } from '../services/HapticsManager';

const { width } = Dimensions.get('window');

interface HomeScreenProps {
  onNavigate: (phase: GamePhase, params?: any) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [daily, setDaily] = useState<DailyChallengeState | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const s = await SaveManager.loadStats();
    setStats(s);
    const d = await DailyChallengeManager.getDailyChallenge();
    setDaily(d.challenge);
  };

  const handlePlayPress = () => {
    AudioManager.playButton();
    HapticsManager.tap();
    onNavigate('MODE_SELECT');
  };

  const handleDailyPress = () => {
    AudioManager.playButton();
    HapticsManager.tap();
    onNavigate('DAILY_CHALLENGE');
  };

  return (
    <View style={styles.container}>
      {/* Background Decor */}
      <View style={styles.topGradient} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Branding */}
        <View style={styles.header}>
          <Text style={styles.brandSubtitle}>ARCADE FOOTBALL SKILL</Text>
          <Text style={styles.brandTitle}>FREE-KICK</Text>
          <Text style={styles.brandTitleAccent}>MASTER</Text>
        </View>

        {/* User Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statBox}>
            <Ionicons name="trophy" size={20} color="#ffd700" />
            <Text style={styles.statLabel}>BEST SCORE</Text>
            <Text style={styles.statValue}>{stats ? stats.highScore.toLocaleString() : '0'}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Ionicons name="flame" size={20} color="#ff6b00" />
            <Text style={styles.statLabel}>BEST STREAK</Text>
            <Text style={styles.statValue}>{stats ? `${stats.bestCombo}x` : '0x'}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Ionicons name="football" size={20} color="#ccff00" />
            <Text style={styles.statLabel}>GOALS</Text>
            <Text style={styles.statValue}>{stats ? stats.totalGoals : '0'}</Text>
          </View>
        </View>

        {/* HERO CTA BUTTON - PLAY NOW */}
        <TouchableOpacity style={styles.playButton} onPress={handlePlayPress} activeOpacity={0.85}>
          <View style={styles.playButtonInner}>
            <Ionicons name="play" size={40} color="#08121e" style={{ marginLeft: 6 }} />
            <Text style={styles.playButtonText}>PLAY NOW</Text>
          </View>
        </TouchableOpacity>

        {/* Daily Challenge Card */}
        <TouchableOpacity
          style={styles.dailyCard}
          onPress={handleDailyPress}
          activeOpacity={0.88}
        >
          <View style={styles.dailyBadgeRow}>
            <View style={styles.dailyTag}>
              <Ionicons name="calendar" size={14} color="#08121e" />
              <Text style={styles.dailyTagText}>DAILY CHALLENGE</Text>
            </View>
            <Text style={styles.dailyRewardText}>+500 PTS</Text>
          </View>

          <Text style={styles.dailyTitle}>{daily ? daily.title : 'Today’s Challenge'}</Text>
          <Text style={styles.dailyDesc}>
            {daily ? daily.description : 'Score goals in limited attempts for bonus reward!'}
          </Text>

          <View style={styles.dailyFooter}>
            <Text style={styles.dailyStatus}>
              {daily?.completed
                ? '✅ COMPLETED TODAY'
                : `Progress: ${daily?.currentGoals || 0}/${daily?.targetGoals || 3} Goals`}
            </Text>
            <Ionicons name="arrow-forward-circle" size={26} color="#ccff00" />
          </View>
        </TouchableOpacity>

        {/* Quick Menu Grid */}
        <View style={styles.menuGrid}>
          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => {
              AudioManager.playButton();
              HapticsManager.tap();
              onNavigate('CHALLENGES');
            }}
          >
            <Ionicons name="ribbon" size={28} color="#ccff00" />
            <Text style={styles.menuCardTitle}>CHALLENGES</Text>
            <Text style={styles.menuCardSub}>10 Skill Modes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => {
              AudioManager.playButton();
              HapticsManager.tap();
              onNavigate('LEADERBOARD');
            }}
          >
            <Ionicons name="podium" size={28} color="#ffd700" />
            <Text style={styles.menuCardTitle}>HIGH SCORES</Text>
            <Text style={styles.menuCardSub}>Stats & Records</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuCardFull}
            onPress={() => {
              AudioManager.playButton();
              HapticsManager.tap();
              onNavigate('SETTINGS');
            }}
          >
            <Ionicons name="settings-sharp" size={24} color="#a0aec0" />
            <Text style={styles.menuCardFullText}>SETTINGS & CUSTOMIZATION</Text>
            <Ionicons name="chevron-forward" size={20} color="#a0aec0" />
          </TouchableOpacity>
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
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    backgroundColor: '#0f2b1d',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    opacity: 0.8,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  brandSubtitle: {
    color: '#ccff00',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 4,
    marginBottom: 4,
  },
  brandTitle: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 2,
  },
  brandTitleAccent: {
    color: '#ccff00',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: -8,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 43, 29, 0.85)',
    borderColor: 'rgba(204, 255, 0, 0.25)',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 24,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statBox: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#a0aec0',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 4,
  },
  statValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  playButton: {
    backgroundColor: '#ccff00',
    borderRadius: 24,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    elevation: 8,
    shadowColor: '#ccff00',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  playButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButtonText: {
    color: '#08121e',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
    marginLeft: 8,
  },
  dailyCard: {
    backgroundColor: '#112217',
    borderColor: '#ccff00',
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
  },
  dailyBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dailyTag: {
    backgroundColor: '#ccff00',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dailyTagText: {
    color: '#08121e',
    fontSize: 11,
    fontWeight: '900',
    marginLeft: 4,
  },
  dailyRewardText: {
    color: '#ffd700',
    fontSize: 14,
    fontWeight: '900',
  },
  dailyTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  dailyDesc: {
    color: '#a0aec0',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  dailyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 12,
  },
  dailyStatus: {
    color: '#ccff00',
    fontSize: 13,
    fontWeight: '700',
  },
  menuGrid: {
    gap: 12,
  },
  menuCard: {
    flex: 1,
    backgroundColor: '#101c24',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  menuCardTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 8,
  },
  menuCardSub: {
    color: '#a0aec0',
    fontSize: 12,
    marginTop: 2,
  },
  menuCardFull: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#101c24',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  menuCardFullText: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 12,
  },
});
