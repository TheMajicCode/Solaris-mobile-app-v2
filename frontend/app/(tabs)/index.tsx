import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../../src/constants/colors';
import { VitalityRing } from '../../src/components/VitalityRing';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { useAuth } from '../../src/context/AuthContext';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const SOLARIS_LOGO = require('../../assets/images/solaris-logo.png');

export default function HomeScreen() {
  const router = useRouter();
  const { user, sessionToken } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [todayCheckin, setTodayCheckin] = useState<any>(null);
  const [rewards, setRewards] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!sessionToken) return;
    
    try {
      // Fetch assessment results
      const resultsRes = await fetch(`${API_URL}/api/assessment/results`, {
        headers: { 'Authorization': `Bearer ${sessionToken}` },
      });
      if (resultsRes.ok) setResults(await resultsRes.json());

      // Fetch today's checkin
      const checkinRes = await fetch(`${API_URL}/api/checkins/today`, {
        headers: { 'Authorization': `Bearer ${sessionToken}` },
      });
      if (checkinRes.ok) setTodayCheckin(await checkinRes.json());

      // Fetch rewards
      const rewardsRes = await fetch(`${API_URL}/api/users/rewards`, {
        headers: { 'Authorization': `Bearer ${sessionToken}` },
      });
      if (rewardsRes.ok) setRewards(await rewardsRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = user?.display_name || user?.first_name || user?.name?.split(' ')[0] || 'Friend';

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
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image source={SOLARIS_LOGO} style={{ width: 36, height: 36, marginRight: 12 }} resizeMode="contain" />
            <View>
              <Text style={styles.greeting}>{greeting()},</Text>
              <Text style={styles.name}>{displayName}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Vitality Score Card */}
        <Card variant="glass" style={styles.vitalityCard}>
          <View style={styles.vitalityContent}>
            <VitalityRing score={results?.vitality_score || 0} size={120} strokeWidth={10} />
            <View style={styles.vitalityInfo}>
              <Text style={styles.vitalityLabel}>Your Vitality</Text>
              <Text style={styles.vitalityDescription}>
                {results?.vitality_score >= 70 
                  ? "You're thriving!" 
                  : results?.vitality_score >= 50
                  ? "Making progress"
                  : "Let's grow together"}
              </Text>
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Ionicons name="flame" size={16} color={Colors.gold} />
                  <Text style={styles.statValue}>{rewards?.streak || 0}</Text>
                  <Text style={styles.statLabel}>Streak</Text>
                </View>
                <View style={styles.stat}>
                  <Ionicons name="heart" size={16} color={Colors.emerald} />
                  <Text style={styles.statValue}>{rewards?.total_points || 0}</Text>
                  <Text style={styles.statLabel}>LOVE</Text>
                </View>
              </View>
            </View>
          </View>
        </Card>

        {/* Daily Check-in Card */}
        <Card variant="elevated" style={styles.checkinCard}>
          <View style={styles.checkinHeader}>
            <View style={styles.checkinIcon}>
              <Ionicons name="sunny" size={20} color={Colors.gold} />
            </View>
            <Text style={styles.checkinTitle}>Daily Check-in</Text>
            {todayCheckin?.checked_in !== false && (
              <View style={styles.checkedBadge}>
                <Ionicons name="checkmark" size={12} color={Colors.emerald} />
              </View>
            )}
          </View>
          <Text style={styles.checkinText}>
            {todayCheckin?.checked_in !== false 
              ? "Great job! You've checked in today."
              : "How are you feeling today? Take a moment to reflect."}
          </Text>
          {todayCheckin?.checked_in === false && (
            <Button
              title="Check In Now"
              onPress={() => router.push('/(tabs)/health')}
              size="small"
              variant="outline"
              style={styles.checkinButton}
            />
          )}
        </Card>

        {/* Focus Areas */}
        {results?.top_focus_areas && results.top_focus_areas.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Focus Areas</Text>
            <View style={styles.focusCards}>
              {results.top_focus_areas.slice(0, 2).map((area: string, index: number) => (
                <Card key={area} variant="default" style={styles.focusCard}>
                  <View style={[styles.focusDot, { backgroundColor: index === 0 ? Colors.emerald : Colors.teal }]} />
                  <Text style={styles.focusText}>{area}</Text>
                </Card>
              ))}
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/luca')}>
              <View style={[styles.actionIcon, { backgroundColor: `${Colors.emerald}20` }]}>
                <Ionicons name="sparkles" size={24} color={Colors.emerald} />
              </View>
              <Text style={styles.actionLabel}>Talk to LUCA</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/explore')}>
              <View style={[styles.actionIcon, { backgroundColor: `${Colors.teal}20` }]}>
                <Ionicons name="compass" size={24} color={Colors.teal} />
              </View>
              <Text style={styles.actionLabel}>Explore</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/health')}>
              <View style={[styles.actionIcon, { backgroundColor: `${Colors.gold}20` }]}>
                <Ionicons name="pulse" size={24} color={Colors.gold} />
              </View>
              <Text style={styles.actionLabel}>My Health</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/profile')}>
              <View style={[styles.actionIcon, { backgroundColor: `${Colors.info}20` }]}>
                <Ionicons name="gift" size={24} color={Colors.info} />
              </View>
              <Text style={styles.actionLabel}>Rewards</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* LUCA Insight Card */}
        <Card variant="glass" style={styles.lucaCard}>
          <View style={styles.lucaHeader}>
            <View style={styles.lucaAvatar}>
              <Ionicons name="sparkles" size={18} color={Colors.deepNavy} />
            </View>
            <Text style={styles.lucaLabel}>LUCA's Insight</Text>
          </View>
          <Text style={styles.lucaMessage}>
            "Remember, healing is not linear. Every small step you take matters. I'm here when you need guidance."
          </Text>
          <TouchableOpacity style={styles.lucaAction} onPress={() => router.push('/(tabs)/luca')}>
            <Text style={styles.lucaActionText}>Ask LUCA</Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.emerald} />
          </TouchableOpacity>
        </Card>
      </ScrollView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  greeting: {
    fontSize: 14,
    color: Colors.mediumGray,
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.white,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.midnightBlue,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: 4,
  },
  vitalityDescription: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.mediumGray,
  },
  checkinCard: {
    marginBottom: Spacing.lg,
  },
  checkinHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  checkinIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${Colors.gold}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  checkinTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  checkedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: `${Colors.emerald}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkinText: {
    fontSize: 14,
    color: Colors.lightGray,
    marginBottom: Spacing.md,
  },
  checkinButton: {
    alignSelf: 'flex-start',
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
  focusCards: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  focusCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  focusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  focusText: {
    fontSize: 13,
    color: Colors.lightGray,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  actionCard: {
    width: '47%',
    backgroundColor: Colors.midnightBlue,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  actionLabel: {
    fontSize: 13,
    color: Colors.lightGray,
  },
  lucaCard: {
    marginBottom: Spacing.xl,
  },
  lucaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  lucaAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.emerald,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  lucaLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.emerald,
  },
  lucaMessage: {
    fontSize: 14,
    color: Colors.lightGray,
    lineHeight: 22,
    fontStyle: 'italic',
    marginBottom: Spacing.md,
  },
  lucaAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lucaActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.emerald,
    marginRight: 4,
  },
});
