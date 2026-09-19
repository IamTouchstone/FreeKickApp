import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GamePhase, UserSettings, StadiumTheme, BallSkin } from '../types/game';
import { SaveManager } from '../services/SaveManager';
import { AudioManager } from '../services/AudioManager';
import { HapticsManager } from '../services/HapticsManager';

interface SettingsScreenProps {
  onNavigate: (phase: GamePhase, params?: any) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onNavigate }) => {
  const [settings, setSettings] = useState<UserSettings>({
    soundEnabled: true,
    musicEnabled: true,
    hapticsEnabled: true,
    stadium: 'NIGHT',
    ballSkin: 'CLASSIC',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const s = await SaveManager.loadSettings();
    setSettings(s);
  };

  const updateSetting = async (key: keyof UserSettings, val: any) => {
    const updated = { ...settings, [key]: val };
    setSettings(updated);
    await SaveManager.saveSettings(updated);

    if (key === 'soundEnabled') AudioManager.setSoundEnabled(val);
    if (key === 'musicEnabled') AudioManager.setMusicEnabled(val);
    if (key === 'hapticsEnabled') HapticsManager.setEnabled(val);
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset All Game Data?',
      'This will clear your local high scores, streaks, and challenge progress.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await SaveManager.resetAllData();
            loadSettings();
            Alert.alert('Data Cleared', 'Game data has been reset.');
          },
        },
      ]
    );
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
        <Text style={styles.headerTitle}>SETTINGS</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Section 1: Audio & Haptics */}
        <Text style={styles.sectionHeader}>AUDIO & VIBRATION</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLabelGroup}>
              <Ionicons name="volume-high" size={22} color="#ccff00" />
              <Text style={styles.rowLabel}>Sound Effects</Text>
            </View>
            <Switch
              value={settings.soundEnabled}
              onValueChange={val => updateSetting('soundEnabled', val)}
              trackColor={{ false: '#333', true: '#ccff00' }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.rowLabelGroup}>
              <Ionicons name="musical-notes" size={22} color="#ccff00" />
              <Text style={styles.rowLabel}>Background Music</Text>
            </View>
            <Switch
              value={settings.musicEnabled}
              onValueChange={val => updateSetting('musicEnabled', val)}
              trackColor={{ false: '#333', true: '#ccff00' }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.rowLabelGroup}>
              <Ionicons name="phone-portrait-sharp" size={22} color="#ccff00" />
              <Text style={styles.rowLabel}>Haptic Vibration</Text>
            </View>
            <Switch
              value={settings.hapticsEnabled}
              onValueChange={val => updateSetting('hapticsEnabled', val)}
              trackColor={{ false: '#333', true: '#ccff00' }}
            />
          </View>
        </View>

        {/* Section 2: Stadium Environment */}
        <Text style={styles.sectionHeader}>DEFAULT STADIUM THEME</Text>
        <View style={styles.selectorGrid}>
          {(['NIGHT', 'DAY', 'STREET', 'AFRICAN'] as StadiumTheme[]).map(st => (
            <TouchableOpacity
              key={st}
              style={[styles.selectorBtn, settings.stadium === st && styles.selectorBtnActive]}
              onPress={() => updateSetting('stadium', st)}
            >
              <Text style={[styles.selectorText, settings.stadium === st && styles.selectorTextActive]}>
                {st}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Section 3: Ball Skin */}
        <Text style={styles.sectionHeader}>FOOTBALL COSMETIC SKIN</Text>
        <View style={styles.selectorGrid}>
          {(['CLASSIC', 'PRO', 'GOLD'] as BallSkin[]).map(bs => (
            <TouchableOpacity
              key={bs}
              style={[styles.selectorBtn, settings.ballSkin === bs && styles.selectorBtnActive]}
              onPress={() => updateSetting('ballSkin', bs)}
            >
              <Text style={[styles.selectorText, settings.ballSkin === bs && styles.selectorTextActive]}>
                {bs}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Section 4: Data Management */}
        <Text style={styles.sectionHeader}>DATA & PRIVACY</Text>
        <TouchableOpacity style={styles.resetBtn} onPress={handleResetData}>
          <Ionicons name="trash-outline" size={20} color="#ff4d4d" />
          <Text style={styles.resetBtnText}>CLEAR SAVED HIGH SCORES</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Finger Flick Free-Kick Master v1.0.0 (Offline MVP)</Text>
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
  sectionHeader: {
    color: '#ccff00',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 16,
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#101c24',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  rowLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowLabel: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  selectorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  selectorBtn: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#101c24',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  selectorBtnActive: {
    backgroundColor: '#ccff00',
    borderColor: '#ccff00',
  },
  selectorText: {
    color: '#a0aec0',
    fontSize: 13,
    fontWeight: '800',
  },
  selectorTextActive: {
    color: '#08121e',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 77, 77, 0.12)',
    borderColor: '#ff4d4d',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    gap: 8,
    marginTop: 6,
    marginBottom: 20,
  },
  resetBtnText: {
    color: '#ff4d4d',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  versionText: {
    color: '#a0aec0',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 30,
  },
});
