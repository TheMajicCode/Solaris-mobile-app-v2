import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing } from '../constants/colors';

interface ScoreCardProps {
  title: string;
  score: number;
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  size?: 'small' | 'medium';
}

export function ScoreCard({ 
  title, 
  score, 
  icon, 
  color = Colors.emerald,
  size = 'medium' 
}: ScoreCardProps) {
  const isSmall = size === 'small';
  
  return (
    <View style={[styles.card, isSmall && styles.cardSmall]}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={isSmall ? 20 : 24} color={color} />
      </View>
      <Text style={[styles.title, isSmall && styles.titleSmall]}>{title}</Text>
      <Text style={[styles.score, { color }]}>{Math.round(score)}</Text>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${score}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.midnightBlue,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    minWidth: 140,
  },
  cardSmall: {
    padding: Spacing.sm,
    minWidth: 100,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: 14,
    color: Colors.lightGray,
    marginBottom: 4,
  },
  titleSmall: {
    fontSize: 12,
  },
  score: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.darkBlue,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});
