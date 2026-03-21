import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../../src/constants/colors';
import { Button } from '../../src/components/Button';
import { useAuth } from '../../src/context/AuthContext';

const goalOptions = [
  { id: 'energy', label: 'Increase Energy', icon: 'flash-outline' },
  { id: 'stress', label: 'Reduce Stress', icon: 'leaf-outline' },
  { id: 'sleep', label: 'Better Sleep', icon: 'moon-outline' },
  { id: 'focus', label: 'Mental Clarity', icon: 'bulb-outline' },
  { id: 'balance', label: 'Emotional Balance', icon: 'heart-outline' },
  { id: 'weight', label: 'Weight Management', icon: 'fitness-outline' },
  { id: 'pain', label: 'Pain Relief', icon: 'bandage-outline' },
  { id: 'longevity', label: 'Longevity', icon: 'hourglass-outline' },
];

const guidanceOptions = [
  { id: 'self-guided', label: 'Self-Guided', description: 'I prefer to explore on my own', icon: 'person-outline' },
  { id: 'practitioner-guided', label: 'Practitioner-Guided', description: 'I want expert support', icon: 'people-outline' },
  { id: 'mixed', label: 'Mixed Approach', description: 'A bit of both', icon: 'git-merge-outline' },
];

export default function GoalsScreen() {
  const router = useRouter();
  const { updateUser } = useAuth();
  
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [concerns, setConcerns] = useState('');
  const [guidance, setGuidance] = useState('mixed');
  const [loading, setLoading] = useState(false);

  const toggleGoal = (id: string) => {
    setSelectedGoals(prev => 
      prev.includes(id) 
        ? prev.filter(g => g !== id)
        : [...prev, id]
    );
  };

  const handleContinue = async () => {
    setLoading(true);
    await updateUser({
      goals_text: selectedGoals.join(', '),
      main_concerns: concerns,
      preferred_guidance: guidance,
      onboarding_step: 2,
    });
    setLoading(false);
    router.push('/onboarding/assessment');
  };

  return (
    <LinearGradient colors={Colors.gradientPrimary} style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView 
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Progress */}
          <View style={styles.progress}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '40%' }]} />
            </View>
            <Text style={styles.progressText}>Step 2 of 5</Text>
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>What brings you here?</Text>
            <Text style={styles.subtitle}>
              Select your wellness goals and tell us what you'd like to focus on.
            </Text>
          </View>

          {/* Goals Grid */}
          <Text style={styles.sectionTitle}>Your Goals</Text>
          <View style={styles.goalsGrid}>
            {goalOptions.map(goal => (
              <TouchableOpacity
                key={goal.id}
                style={[
                  styles.goalCard,
                  selectedGoals.includes(goal.id) && styles.goalCardSelected,
                ]}
                onPress={() => toggleGoal(goal.id)}
                activeOpacity={0.8}
              >
                <Ionicons 
                  name={goal.icon as any} 
                  size={24} 
                  color={selectedGoals.includes(goal.id) ? Colors.emerald : Colors.lightGray} 
                />
                <Text style={[
                  styles.goalLabel,
                  selectedGoals.includes(goal.id) && styles.goalLabelSelected,
                ]}>
                  {goal.label}
                </Text>
                {selectedGoals.includes(goal.id) && (
                  <View style={styles.checkmark}>
                    <Ionicons name="checkmark" size={12} color={Colors.deepNavy} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Concerns */}
          <Text style={styles.sectionTitle}>Main Concerns (optional)</Text>
          <TextInput
            style={styles.textArea}
            value={concerns}
            onChangeText={setConcerns}
            placeholder="Share any specific health concerns or symptoms you'd like to address..."
            placeholderTextColor={Colors.mediumGray}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          {/* Guidance Preference */}
          <Text style={styles.sectionTitle}>Preferred Guidance</Text>
          <View style={styles.guidanceOptions}>
            {guidanceOptions.map(option => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.guidanceCard,
                  guidance === option.id && styles.guidanceCardSelected,
                ]}
                onPress={() => setGuidance(option.id)}
                activeOpacity={0.8}
              >
                <Ionicons 
                  name={option.icon as any} 
                  size={24} 
                  color={guidance === option.id ? Colors.emerald : Colors.lightGray} 
                />
                <View style={styles.guidanceContent}>
                  <Text style={[
                    styles.guidanceLabel,
                    guidance === option.id && styles.guidanceLabelSelected,
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={styles.guidanceDescription}>{option.description}</Text>
                </View>
                {guidance === option.id && (
                  <Ionicons name="checkmark-circle" size={20} color={Colors.emerald} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Continue to Assessment"
            onPress={handleContinue}
            icon="arrow-forward"
            loading={loading}
            disabled={selectedGoals.length === 0}
            fullWidth
          />
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: Spacing.lg,
    paddingTop: 60,
  },
  progress: {
    marginBottom: Spacing.xl,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.darkBlue,
    borderRadius: 2,
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.emerald,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: Colors.mediumGray,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.lightGray,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  goalCard: {
    width: '48%',
    backgroundColor: Colors.midnightBlue,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.darkBlue,
  },
  goalCardSelected: {
    borderColor: Colors.emerald,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  goalLabel: {
    fontSize: 13,
    color: Colors.lightGray,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  goalLabelSelected: {
    color: Colors.emerald,
    fontWeight: '600',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.emerald,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textArea: {
    backgroundColor: Colors.midnightBlue,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 15,
    color: Colors.white,
    borderWidth: 1,
    borderColor: Colors.darkBlue,
    minHeight: 100,
  },
  guidanceOptions: {
    gap: Spacing.sm,
  },
  guidanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.midnightBlue,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.darkBlue,
  },
  guidanceCardSelected: {
    borderColor: Colors.emerald,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  guidanceContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  guidanceLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
  guidanceLabelSelected: {
    color: Colors.emerald,
  },
  guidanceDescription: {
    fontSize: 12,
    color: Colors.mediumGray,
    marginTop: 2,
  },
  actions: {
    padding: Spacing.lg,
    paddingBottom: 40,
  },
});
