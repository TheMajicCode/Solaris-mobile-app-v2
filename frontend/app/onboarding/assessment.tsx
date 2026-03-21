import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../../src/constants/colors';
import { Button } from '../../src/components/Button';
import { useAuth } from '../../src/context/AuthContext';
import Slider from '@react-native-community/slider';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Question {
  question_id: string;
  section: string;
  category: string;
  question_text: string;
  question_type: string;
  options?: string[];
  min_value?: number;
  max_value?: number;
}

interface Answer {
  question_id: string;
  answer_value: any;
}

export default function AssessmentScreen() {
  const router = useRouter();
  const { sessionToken } = useAuth();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentSection, setCurrentSection] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const sections = [
    { key: 'mental', title: 'Mental Clarity', icon: 'bulb-outline', color: Colors.info },
    { key: 'emotional', title: 'Emotional Balance', icon: 'heart-outline', color: Colors.error },
    { key: 'physical', title: 'Physical Vitality', icon: 'fitness-outline', color: Colors.emerald },
    { key: 'spiritual', title: 'Spiritual / Hope', icon: 'sparkles-outline', color: Colors.gold },
    { key: 'body_systems', title: 'Body Systems', icon: 'body-outline', color: Colors.teal },
  ];

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await fetch(`${API_URL}/api/assessment/questions`);
      const data = await response.json();
      setQuestions(data);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentQuestions = () => {
    const section = sections[currentSection];
    if (section.key === 'body_systems') {
      return questions.filter(q => q.section === 'body_systems');
    }
    return questions.filter(q => q.section === 'aspects' && q.category === section.key);
  };

  const setAnswer = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
    } else {
      submitAssessment();
    }
  };

  const handleBack = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const submitAssessment = async () => {
    setSubmitting(true);
    try {
      const answersList: Answer[] = Object.entries(answers).map(([question_id, answer_value]) => ({
        question_id,
        answer_value,
      }));

      const response = await fetch(`${API_URL}/api/assessment/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify(answersList),
      });

      if (response.ok) {
        router.replace('/onboarding/results');
      }
    } catch (error) {
      console.error('Error submitting assessment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const currentQuestions = getCurrentQuestions();
  const section = sections[currentSection];
  const progress = ((currentSection + 1) / sections.length) * 100;

  const allCurrentAnswered = currentQuestions.every(q => answers[q.question_id] !== undefined);

  if (loading) {
    return (
      <LinearGradient colors={Colors.gradientPrimary} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.emerald} />
          <Text style={styles.loadingText}>Preparing your assessment...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={Colors.gradientPrimary} style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress */}
        <View style={styles.progress}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>Step {currentSection + 1} of {sections.length}</Text>
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: `${section.color}20` }]}>
            <Ionicons name={section.icon as any} size={32} color={section.color} />
          </View>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.sectionSubtitle}>
            Rate each area honestly. There are no wrong answers.
          </Text>
        </View>

        {/* Questions */}
        <View style={styles.questions}>
          {currentQuestions.map((question, index) => (
            <View key={question.question_id} style={styles.questionCard}>
              <Text style={styles.questionNumber}>Q{index + 1}</Text>
              <Text style={styles.questionText}>{question.question_text}</Text>
              
              {question.question_type === 'slider' && (
                <View style={styles.sliderContainer}>
                  <View style={styles.sliderLabels}>
                    <Text style={styles.sliderLabel}>Low</Text>
                    <Text style={styles.sliderValue}>
                      {answers[question.question_id] ?? 5}
                    </Text>
                    <Text style={styles.sliderLabel}>High</Text>
                  </View>
                  <Slider
                    style={styles.slider}
                    minimumValue={question.min_value || 0}
                    maximumValue={question.max_value || 10}
                    step={1}
                    value={answers[question.question_id] ?? 5}
                    onValueChange={(value) => setAnswer(question.question_id, value)}
                    minimumTrackTintColor={Colors.emerald}
                    maximumTrackTintColor={Colors.darkBlue}
                    thumbTintColor={Colors.emerald}
                  />
                </View>
              )}
              
              {question.question_type === 'single_select' && question.options && (
                <View style={styles.optionsContainer}>
                  {question.options.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.optionButton,
                        answers[question.question_id] === option && styles.optionButtonSelected,
                      ]}
                      onPress={() => setAnswer(question.question_id, option)}
                    >
                      <Text style={[
                        styles.optionText,
                        answers[question.question_id] === option && styles.optionTextSelected,
                      ]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.actionRow}>
          {currentSection > 0 && (
            <Button
              title="Back"
              onPress={handleBack}
              variant="outline"
              icon="arrow-back"
              iconPosition="left"
              style={styles.backButton}
            />
          )}
          <Button
            title={currentSection === sections.length - 1 ? 'Complete' : 'Next'}
            onPress={handleNext}
            icon={currentSection === sections.length - 1 ? 'checkmark' : 'arrow-forward'}
            loading={submitting}
            disabled={!allCurrentAnswered}
            style={styles.nextButton}
          />
        </View>
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
  },
  loadingText: {
    fontSize: 16,
    color: Colors.lightGray,
    marginTop: Spacing.md,
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
  sectionHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  sectionIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.lightGray,
    textAlign: 'center',
  },
  questions: {
    gap: Spacing.lg,
  },
  questionCard: {
    backgroundColor: Colors.midnightBlue,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  questionNumber: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.emerald,
    marginBottom: Spacing.sm,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.white,
    lineHeight: 24,
    marginBottom: Spacing.lg,
  },
  sliderContainer: {
    marginTop: Spacing.sm,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sliderLabel: {
    fontSize: 12,
    color: Colors.mediumGray,
  },
  sliderValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.emerald,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  optionsContainer: {
    gap: Spacing.sm,
  },
  optionButton: {
    backgroundColor: Colors.darkBlue,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionButtonSelected: {
    borderColor: Colors.emerald,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  optionText: {
    fontSize: 14,
    color: Colors.lightGray,
    textAlign: 'center',
  },
  optionTextSelected: {
    color: Colors.emerald,
    fontWeight: '600',
  },
  actions: {
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
});
