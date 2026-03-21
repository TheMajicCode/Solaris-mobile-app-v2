import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../../src/constants/colors';
import { Button } from '../../src/components/Button';
import { VitalityRing } from '../../src/components/VitalityRing';
import { ScoreCard } from '../../src/components/ScoreCard';
import { useAuth } from '../../src/context/AuthContext';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface AssessmentResult {
  vitality_score: number;
  mental_score: number;
  emotional_score: number;
  physical_score: number;
  spiritual_score: number;
  body_system_scores: Record<string, number>;
  top_focus_areas: string[];
}

export default function ResultsScreen() {
  const router = useRouter();
  const { sessionToken, refreshUser } = useAuth();
  const [results, setResults] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);
  
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    fetchResults();
  }, []);

  useEffect(() => {
    if (results) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [results]);

  const fetchResults = async () => {
    try {
      const response = await fetch(`${API_URL}/api/assessment/results`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async () => {
    await refreshUser();
    router.replace('/(tabs)');
  };

  if (loading || !results) {
    return (
      <LinearGradient colors={Colors.gradientPrimary} style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingRing}>
            <Ionicons name="sparkles" size={40} color={Colors.emerald} />
          </View>
          <Text style={styles.loadingTitle}>Analyzing Your Results</Text>
          <Text style={styles.loadingText}>Creating your personalized wellness picture...</Text>
        </View>
      </LinearGradient>
    );
  }

  const aspectIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
    mental: 'bulb-outline',
    emotional: 'heart-outline',
    physical: 'fitness-outline',
    spiritual: 'sparkles-outline',
  };

  const aspectColors: Record<string, string> = {
    mental: Colors.info,
    emotional: '#EC4899',
    physical: Colors.emerald,
    spiritual: Colors.gold,
  };

  const bodySystemLabels: Record<string, string> = {
    bioelectrical: 'Bioelectrical',
    hydration: 'Hydration',
    circadian: 'Circadian',
    microbiome: 'Microbiome',
    respiratory: 'Respiratory',
    neurological: 'Neurological',
    cardiovascular: 'Cardiovascular',
    nutritional: 'Nutritional',
  };

  return (
    <LinearGradient colors={Colors.gradientPrimary} style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Celebration Header */}
        <Animated.View 
          style={[
            styles.header,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
          ]}
        >
          <Text style={styles.celebration}>Your Wellness Picture</Text>
          <Text style={styles.subtitle}>
            Here's what your body is telling us. This is your starting point for transformation.
          </Text>
        </Animated.View>

        {/* Vitality Score */}
        <Animated.View 
          style={[
            styles.vitalitySection,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
          ]}
        >
          <VitalityRing score={results.vitality_score} size={180} />
          <Text style={styles.vitalityLabel}>Your Overall Vitality</Text>
          <Text style={styles.vitalityDescription}>
            {results.vitality_score >= 70 
              ? "You're on a strong foundation. Let's optimize further."
              : results.vitality_score >= 50
              ? "There's room for growth. Small changes can make a big impact."
              : "Your body is asking for attention. Let's start your healing journey."}
          </Text>
        </Animated.View>

        {/* 4 Aspects */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Four Aspects of Being</Text>
          <View style={styles.aspectsGrid}>
            <ScoreCard 
              title="Mental" 
              score={results.mental_score} 
              icon={aspectIcons.mental}
              color={aspectColors.mental}
            />
            <ScoreCard 
              title="Emotional" 
              score={results.emotional_score} 
              icon={aspectIcons.emotional}
              color={aspectColors.emotional}
            />
            <ScoreCard 
              title="Physical" 
              score={results.physical_score} 
              icon={aspectIcons.physical}
              color={aspectColors.physical}
            />
            <ScoreCard 
              title="Spiritual" 
              score={results.spiritual_score} 
              icon={aspectIcons.spiritual}
              color={aspectColors.spiritual}
            />
          </View>
        </View>

        {/* Top Focus Areas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Focus Areas</Text>
          <Text style={styles.sectionSubtitle}>These areas need the most attention</Text>
          <View style={styles.focusAreas}>
            {results.top_focus_areas.map((area, index) => (
              <View key={area} style={styles.focusCard}>
                <View style={[styles.focusNumber, { backgroundColor: index === 0 ? Colors.emerald : Colors.darkBlue }]}>
                  <Text style={styles.focusNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.focusText}>{area}</Text>
                <Ionicons name="arrow-forward" size={16} color={Colors.mediumGray} />
              </View>
            ))}
          </View>
        </View>

        {/* Body Systems */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Body Systems Overview</Text>
          <View style={styles.systemsGrid}>
            {Object.entries(results.body_system_scores).map(([system, score]) => (
              <View key={system} style={styles.systemCard}>
                <Text style={styles.systemName}>{bodySystemLabels[system] || system}</Text>
                <View style={styles.systemProgress}>
                  <View style={[styles.systemFill, { width: `${score}%` }]} />
                </View>
                <Text style={styles.systemScore}>{Math.round(score)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* LUCA Intro */}
        <View style={styles.lucaCard}>
          <View style={styles.lucaHeader}>
            <View style={styles.lucaAvatar}>
              <Ionicons name="sparkles" size={24} color={Colors.deepNavy} />
            </View>
            <View style={styles.lucaInfo}>
              <Text style={styles.lucaName}>Meet LUCA</Text>
              <Text style={styles.lucaRole}>Your Wellness Guide</Text>
            </View>
          </View>
          <Text style={styles.lucaMessage}>
            "I'm here to help you understand your results and guide you toward feeling your best. Let's explore your path together."
          </Text>
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          title="Begin My Journey"
          onPress={handleContinue}
          icon="arrow-forward"
          fullWidth
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  loadingRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.lightGray,
    textAlign: 'center',
  },
  content: {
    flexGrow: 1,
    padding: Spacing.lg,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  celebration: {
    fontSize: 28,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.lightGray,
    textAlign: 'center',
    lineHeight: 22,
  },
  vitalitySection: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  vitalityLabel: {
    fontSize: 14,
    color: Colors.mediumGray,
    marginTop: Spacing.md,
  },
  vitalityDescription: {
    fontSize: 14,
    color: Colors.lightGray,
    textAlign: 'center',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.mediumGray,
    marginBottom: Spacing.md,
  },
  aspectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  focusAreas: {
    gap: Spacing.sm,
  },
  focusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.midnightBlue,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  focusNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  focusNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  focusText: {
    flex: 1,
    fontSize: 15,
    color: Colors.white,
  },
  systemsGrid: {
    gap: Spacing.sm,
  },
  systemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.midnightBlue,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  systemName: {
    width: 100,
    fontSize: 13,
    color: Colors.lightGray,
  },
  systemProgress: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.darkBlue,
    borderRadius: 3,
    marginHorizontal: Spacing.md,
    overflow: 'hidden',
  },
  systemFill: {
    height: '100%',
    backgroundColor: Colors.emerald,
    borderRadius: 3,
  },
  systemScore: {
    width: 30,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
    textAlign: 'right',
  },
  lucaCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    marginBottom: Spacing.xl,
  },
  lucaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  lucaAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.emerald,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lucaInfo: {
    marginLeft: Spacing.md,
  },
  lucaName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  lucaRole: {
    fontSize: 12,
    color: Colors.emerald,
  },
  lucaMessage: {
    fontSize: 14,
    color: Colors.lightGray,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  actions: {
    padding: Spacing.lg,
    paddingBottom: 40,
  },
});
