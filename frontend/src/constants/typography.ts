import { StyleSheet, Platform } from 'react-native';
import { Colors } from './colors';

export const Typography = StyleSheet.create({
  // Display
  displayLarge: {
    fontSize: 48,
    fontWeight: '700',
    lineHeight: 56,
    letterSpacing: -1,
    color: Colors.white,
  },
  displayMedium: {
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 44,
    letterSpacing: -0.5,
    color: Colors.white,
  },
  displaySmall: {
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 36,
    color: Colors.white,
  },
  
  // Headlines
  headlineLarge: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
    color: Colors.white,
  },
  headlineMedium: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    color: Colors.white,
  },
  headlineSmall: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
    color: Colors.white,
  },
  
  // Body
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: Colors.lightGray,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 22,
    color: Colors.lightGray,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
    color: Colors.mediumGray,
  },
  
  // Labels
  labelLarge: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    letterSpacing: 0.5,
    color: Colors.white,
  },
  labelMedium: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
    letterSpacing: 0.5,
    color: Colors.white,
  },
  labelSmall: {
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 14,
    letterSpacing: 0.5,
    color: Colors.mediumGray,
  },
  
  // Special
  accent: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    color: Colors.emerald,
  },
  gold: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    color: Colors.gold,
  },
});
