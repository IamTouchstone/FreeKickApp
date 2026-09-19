import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GamePhase, Challenge } from '../types/game';
import { ChallengeManager } from '../services/ChallengeManager';
import { AudioManager } from '../services/AudioManager';
import { HapticsManager } from '../services/HapticsManager';

interface ChallengesScreenProps {
  onNavigate: (phase: GamePhase, params?: any) => void;
}

export const ChallengesScreen: React.FC<ChallengesScreenProps> = ({ onNavigate }) => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    const list = await ChallengeManager.getChallenges();
    setChallenges(list);
  };

  const handleSelect = (item: Challenge) => {
    AudioManager.playButton();
    HapticsManager.tap();
    onNavigate('GAMEPLAY', {
      mode: 'CHALLENGE',
      challengeId: item.id,
      difficulty: item.difficulty,
      wallSize: item.wallSize,
      stadium: item.stadium,
      weather: item.weather,
    });
  };

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
        <Text style={styles.headerTitle}>SKILL CHALLENGES</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {challenges.map((c, idx) => (
          <TouchableOpacity
            key={c.id}
            style={[styles.card, c.completed && styles.cardCompleted]}
            onPress={() => handleSelect(c)}
            activeOpacity={0.85}
          >
            <View style={styles.cardTop}>
              <View style={styles.numBadge}>
                <Text style={styles.numText}>#{idx + 1}</Text>
              </View>
              <Text style={styles.cardTitle}>{c.title}</Text>
              {c.completed && <Ionicons name="checkmark-circle" size={24} color="#ccff00" />}
            </View>

            <Text style={styles.cardDesc}>{c.description}</Text>

            <View style={styles.cardBottom}>
              <View style={styles.diffTag}>
                <Text style={styles.diffText}>{c.difficulty}</Text>
              </View>

              {/* Stars */}
              <View style={styles.starsRow}>
                {[1, 2, 3].map(star => (
                  <Ionicons
                    key={`star_${star}`}
                    name="star"
                    size={16}
                    color={star <= c.stars ? '#ffd700' : 'rgba(255, 255, 255, 0.2)'}
                  />
                ))}
              </View>
            </View>
          </TouchableOpacity>
        ))}
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
    gap: 14,
  },
  card: {
    backgroundColor: '#101c24',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
  },
  cardCompleted: {
    borderColor: '#ccff00',
    backgroundColor: '#112519',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  numBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 10,
  },
  numText: {
    color: '#ccff00',
    fontSize: 12,
    fontWeight: '900',
  },
  cardTitle: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  cardDesc: {
    color: '#a0aec0',
    fontSize: 13,
    marginBottom: 12,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 10,
  },
  diffTag: {
    backgroundColor: 'rgba(204, 255, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  diffText: {
    color: '#ccff00',
    fontSize: 11,
    fontWeight: '800',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
  },
});
