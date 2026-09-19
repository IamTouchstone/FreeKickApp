import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Path, LinearGradient, Stop, Defs } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 1800); // 1.8 seconds splash
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#08121e" />
            <Stop offset="1" stopColor="#0b2416" />
          </LinearGradient>
        </Defs>
        <Path d={`M 0 0 L ${width} 0 L ${width} ${height} L 0 ${height} Z`} fill="url(#bgGrad)" />
      </Svg>

      <View style={styles.content}>
        {/* Animated Football Emblem */}
        <View style={styles.logoContainer}>
          <Svg width={110} height={110} viewBox="0 0 100 100">
            <Circle cx="50" cy="50" r="46" fill="#ccff00" />
            <Circle cx="50" cy="50" r="42" fill="#0b2416" />
            {/* Football pentagon */}
            <Path d="M 50 24 L 68 38 L 60 62 L 40 62 L 32 38 Z" fill="#ccff00" />
          </Svg>
        </View>

        <Text style={styles.titlePrefix}>FINGER FLICK</Text>
        <Text style={styles.titleMain}>FREE-KICK MASTER</Text>
        <Text style={styles.tagline}>ONE FINGER. ONE FREE KICK.</Text>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>ARCADE FOOTBALL MVP</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#08121e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    marginBottom: 24,
    shadowColor: '#ccff00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 12,
  },
  titlePrefix: {
    color: '#a0aec0',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 4,
    marginBottom: 4,
  },
  titleMain: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 8,
  },
  tagline: {
    color: '#ccff00',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 3,
    marginBottom: 32,
  },
  badge: {
    backgroundColor: 'rgba(204, 255, 0, 0.12)',
    borderColor: '#ccff00',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  badgeText: {
    color: '#ccff00',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
  },
});
