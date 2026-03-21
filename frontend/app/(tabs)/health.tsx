import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, RefreshControl, TextInput, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../../src/constants/colors';
import { VitalityRing } from '../../src/components/VitalityRing';
import { ScoreCard } from '../../src/components/ScoreCard';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { useAuth } from '../../src/context/AuthContext';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function HealthScreen() {
  const { sessionToken } = useAuth();
  const [results, setResults] = useState<any>(null);
  const [checkins, setCheckins] = useState<any[]>([]);
  const [todayCheckin, setTodayCheckin] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  
  // Checkin form state
  const [energyScore, setEnergyScore] = useState(5);
  const [moodScore, setMoodScore] = useState(5);
  const [sleepHours, setSleepHours] = useState('7');
  const [hydration, setHydration] = useState('4');
  const [movement, setMovement] = useState('30');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!sessionToken) return;
    try {
      const [resultsRes, checkinsRes, todayRes] = await Promise.all([
        fetch(`${API_URL}/api/assessment/results`, {
          headers: { 'Authorization': `Bearer ${sessionToken}` },
        }),
        fetch(`${API_URL}/api/checkins?limit=7`, {
          headers: { 'Authorization': `Bearer ${sessionToken}` },
        }),
        fetch(`${API_URL}/api/checkins/today`, {
          headers: { 'Authorization': `Bearer ${sessionToken}` },
        }),
      ]);
      
      if (resultsRes.ok) setResults(await resultsRes.json());
      if (checkinsRes.ok) setCheckins(await checkinsRes.json());
      if (todayRes.ok) setTodayCheckin(await todayRes.json());
    } catch (error) {
      console.error('Error fetching health data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const submitCheckin = async () => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const response = await fetch(`${API_URL}/api/checkins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          checkin_date: today,
          energy_score: energyScore,
          mood_score: moodScore,
          sleep_hours: parseFloat(sleepHours),
          hydration_glasses: parseInt(hydration),
          movement_minutes: parseInt(movement),
        }),
      });
      if (response.ok) {
        setShowCheckinModal(false);
        fetchData();
      }
    } catch (error) {
      console.error('Error submitting checkin:', error);
    }
  };

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

  return (
    <LinearGradient colors={Colors.gradientPrimary} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.emerald} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>My Health</Text>
          <Text style={styles.subtitle}>Track your wellness journey</Text>
        </View>

        {/* Vitality Overview */}
        <Card variant="glass" style={styles.vitalityCard}>
          <View style={styles.vitalityContent}>
            <VitalityRing score={results?.vitality_score || 0} size={100} strokeWidth={8} />
            <View style={styles.vitalityInfo}>
              <Text style={styles.vitalityLabel}>Overall Vitality</Text>
              <Text style={styles.vitalityScore}>{results?.vitality_score || 0}/100</Text>
              <TouchableOpacity 
                style={styles.checkinButton}
                onPress={() => setShowCheckinModal(true)}
              >
                <Ionicons name="add-circle" size={18} color={Colors.emerald} />
                <Text style={styles.checkinButtonText}>Daily Check-in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        {/* 4 Aspects */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Four Aspects</Text>
          <View style={styles.aspectsGrid}>
            <ScoreCard 
              title="Mental" 
              score={results?.mental_score || 0} 
              icon={aspectIcons.mental}
              color={aspectColors.mental}
              size="small"
            />
            <ScoreCard 
              title="Emotional" 
              score={results?.emotional_score || 0} 
              icon={aspectIcons.emotional}
              color={aspectColors.emotional}
              size="small"
            />
            <ScoreCard 
              title="Physical" 
              score={results?.physical_score || 0} 
              icon={aspectIcons.physical}
              color={aspectColors.physical}
              size="small"
            />
            <ScoreCard 
              title="Spiritual" 
              score={results?.spiritual_score || 0} 
              icon={aspectIcons.spiritual}
              color={aspectColors.spiritual}
              size="small"
            />
          </View>
        </View>

        {/* Body Systems */}
        {results?.body_system_scores && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Body Systems</Text>
            <Card variant="default">
              {Object.entries(results.body_system_scores).map(([system, score]: [string, any]) => (
                <View key={system} style={styles.systemRow}>
                  <Text style={styles.systemName}>{system.charAt(0).toUpperCase() + system.slice(1)}</Text>
                  <View style={styles.systemProgress}>
                    <View style={[styles.systemFill, { width: `${score}%` }]} />
                  </View>
                  <Text style={styles.systemScore}>{Math.round(score)}</Text>
                </View>
              ))}
            </Card>
          </View>
        )}

        {/* Recent Check-ins */}
        {checkins.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Check-ins</Text>
            <View style={styles.checkinsRow}>
              {checkins.slice(0, 7).map((checkin) => (
                <View key={checkin.checkin_id} style={styles.checkinDay}>
                  <Text style={styles.checkinDate}>
                    {new Date(checkin.checkin_date).toLocaleDateString('en', { weekday: 'short' }).slice(0, 2)}
                  </Text>
                  <View style={[
                    styles.checkinDot,
                    { backgroundColor: checkin.mood_score >= 7 ? Colors.emerald : checkin.mood_score >= 4 ? Colors.gold : Colors.error }
                  ]} />
                  <Text style={styles.checkinMood}>{checkin.mood_score}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Check-in Modal */}
      <Modal
        visible={showCheckinModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCheckinModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Daily Check-in</Text>
              <TouchableOpacity onPress={() => setShowCheckinModal(false)}>
                <Ionicons name="close" size={24} color={Colors.white} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Energy Level (1-10)</Text>
                <View style={styles.scoreButtons}>
                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <TouchableOpacity
                      key={n}
                      style={[styles.scoreBtn, energyScore === n && styles.scoreBtnActive]}
                      onPress={() => setEnergyScore(n)}
                    >
                      <Text style={[styles.scoreBtnText, energyScore === n && styles.scoreBtnTextActive]}>{n}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Mood (1-10)</Text>
                <View style={styles.scoreButtons}>
                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <TouchableOpacity
                      key={n}
                      style={[styles.scoreBtn, moodScore === n && styles.scoreBtnActive]}
                      onPress={() => setMoodScore(n)}
                    >
                      <Text style={[styles.scoreBtnText, moodScore === n && styles.scoreBtnTextActive]}>{n}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>Sleep (hours)</Text>
                  <TextInput
                    style={styles.input}
                    value={sleepHours}
                    onChangeText={setSleepHours}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>Water (glasses)</Text>
                  <TextInput
                    style={styles.input}
                    value={hydration}
                    onChangeText={setHydration}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Movement (minutes)</Text>
                <TextInput
                  style={styles.input}
                  value={movement}
                  onChangeText={setMovement}
                  keyboardType="numeric"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Save Check-in"
                onPress={submitCheckin}
                fullWidth
              />
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: Spacing.lg,
    paddingTop: 60,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: Colors.white,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.mediumGray,
    marginTop: 4,
  },
  vitalityCard: {
    marginBottom: Spacing.lg,
  },
  vitalityContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vitalityInfo: {
    flex: 1,
    marginLeft: Spacing.lg,
  },
  vitalityLabel: {
    fontSize: 12,
    color: Colors.mediumGray,
  },
  vitalityScore: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  checkinButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkinButtonText: {
    fontSize: 14,
    color: Colors.emerald,
    marginLeft: 4,
    fontWeight: '600',
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: Spacing.md,
  },
  aspectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  systemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.darkBlue,
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
  checkinsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  checkinDay: {
    alignItems: 'center',
    backgroundColor: Colors.midnightBlue,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    minWidth: 44,
  },
  checkinDate: {
    fontSize: 11,
    color: Colors.mediumGray,
    marginBottom: 4,
  },
  checkinDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginBottom: 4,
  },
  checkinMood: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.deepNavy,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.midnightBlue,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.white,
  },
  modalBody: {
    padding: Spacing.lg,
  },
  modalFooter: {
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.lightGray,
    marginBottom: Spacing.sm,
  },
  scoreButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scoreBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.midnightBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBtnActive: {
    backgroundColor: Colors.emerald,
  },
  scoreBtnText: {
    fontSize: 14,
    color: Colors.lightGray,
  },
  scoreBtnTextActive: {
    color: Colors.deepNavy,
    fontWeight: '600',
  },
  formRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  formGroupHalf: {
    flex: 1,
    marginBottom: Spacing.lg,
  },
  input: {
    backgroundColor: Colors.midnightBlue,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    color: Colors.white,
  },
});
