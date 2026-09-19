import React, { useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { SplashScreen } from './src/screens/SplashScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ModeSelectScreen } from './src/screens/ModeSelectScreen';
import { GameplayScreen } from './src/screens/GameplayScreen';
import { DailyChallengeScreen } from './src/screens/DailyChallengeScreen';
import { ChallengesScreen } from './src/screens/ChallengesScreen';
import { LeaderboardScreen } from './src/screens/LeaderboardScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { AudioManager } from './src/services/AudioManager';
import { SaveManager } from './src/services/SaveManager';
import { HapticsManager } from './src/services/HapticsManager';

export default function App() {
  const [phase, setPhase] = useState('SPLASH');
  const [routeParams, setRouteParams] = useState(null);

  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    try {
      await AudioManager.init();
      const settings = await SaveManager.loadSettings();
      if (settings) {
        AudioManager.setSoundEnabled(!!settings.soundEnabled);
        AudioManager.setMusicEnabled(!!settings.musicEnabled);
        HapticsManager.setEnabled(!!settings.hapticsEnabled);
      }
    } catch (e) {
      console.warn('App init error', e);
    }
  };

  const navigateTo = (nextPhase, params) => {
    setRouteParams(params || null);
    setPhase(nextPhase);
  };

  const renderActiveScreen = () => {
    switch (phase) {
      case 'SPLASH':
        return <SplashScreen onFinish={() => navigateTo('HOME')} />;
      case 'HOME':
        return <HomeScreen onNavigate={navigateTo} />;
      case 'MODE_SELECT':
        return <ModeSelectScreen onNavigate={navigateTo} />;
      case 'GAMEPLAY':
        return <GameplayScreen onNavigate={navigateTo} routeParams={routeParams} />;
      case 'DAILY_CHALLENGE':
        return <DailyChallengeScreen onNavigate={navigateTo} />;
      case 'CHALLENGES':
        return <ChallengesScreen onNavigate={navigateTo} />;
      case 'LEADERBOARD':
        return <LeaderboardScreen onNavigate={navigateTo} />;
      case 'SETTINGS':
        return <SettingsScreen onNavigate={navigateTo} />;
      default:
        return <HomeScreen onNavigate={navigateTo} />;
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" backgroundColor="#08121e" />
        {renderActiveScreen()}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#08121e',
  },
});
