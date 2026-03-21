import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../../src/constants/colors';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { useAuth } from '../../src/context/AuthContext';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, sessionToken } = useAuth();
  const [rewards, setRewards] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!sessionToken) return;
    try {
      const [rewardsRes, bookingsRes] = await Promise.all([
        fetch(`${API_URL}/api/users/rewards`, {
          headers: { 'Authorization': `Bearer ${sessionToken}` },
        }),
        fetch(`${API_URL}/api/bookings`, {
          headers: { 'Authorization': `Bearer ${sessionToken}` },
        }),
      ]);
      
      if (rewardsRes.ok) setRewards(await rewardsRes.json());
      if (bookingsRes.ok) setBookings(await bookingsRes.json());
    } catch (error) {
      console.error('Error fetching profile data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    );
  };

  const displayName = user?.display_name || user?.first_name || user?.name?.split(' ')[0] || 'User';

  const menuItems = [
    { icon: 'person-outline', label: 'Personal Info', route: null },
    { icon: 'heart-outline', label: 'Health Preferences', route: null },
    { icon: 'notifications-outline', label: 'Notifications', route: null },
    { icon: 'shield-checkmark-outline', label: 'Privacy & Data', route: null },
    { icon: 'bookmark-outline', label: 'Saved Listings', route: null },
    { icon: 'help-circle-outline', label: 'Help & Support', route: null },
    { icon: 'information-circle-outline', label: 'About Solaris', route: null },
  ];

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
          <View style={styles.avatarContainer}>
            {user?.picture ? (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
              </View>
            ) : (
              <View style={styles.avatar}>
                <Ionicons name="person" size={32} color={Colors.white} />
              </View>
            )}
            {user?.role === 'admin' && (
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>Admin</Text>
              </View>
            )}
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <Card variant="elevated" style={styles.statCard}>
            <Ionicons name="heart" size={24} color={Colors.emerald} />
            <Text style={styles.statValue}>{rewards?.total_points || 0}</Text>
            <Text style={styles.statLabel}>LOVE Points</Text>
          </Card>
          <Card variant="elevated" style={styles.statCard}>
            <Ionicons name="flame" size={24} color={Colors.gold} />
            <Text style={styles.statValue}>{rewards?.streak || 0}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </Card>
          <Card variant="elevated" style={styles.statCard}>
            <Ionicons name="calendar" size={24} color={Colors.teal} />
            <Text style={styles.statValue}>{bookings.length}</Text>
            <Text style={styles.statLabel}>Bookings</Text>
          </Card>
        </View>

        {/* Recent Rewards */}
        {rewards?.history && rewards.history.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Rewards</Text>
            <Card variant="default">
              {rewards.history.slice(0, 5).map((reward: any, index: number) => (
                <View key={reward.event_id || index} style={styles.rewardRow}>
                  <View style={styles.rewardIcon}>
                    <Ionicons name="star" size={16} color={Colors.gold} />
                  </View>
                  <View style={styles.rewardInfo}>
                    <Text style={styles.rewardType}>
                      {reward.event_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </Text>
                    {reward.note && <Text style={styles.rewardNote}>{reward.note}</Text>}
                  </View>
                  <Text style={styles.rewardPoints}>+{reward.points}</Text>
                </View>
              ))}
            </Card>
          </View>
        )}

        {/* Bookings */}
        {bookings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Bookings</Text>
            {bookings.slice(0, 3).map((booking) => (
              <Card key={booking.booking_id} variant="default" style={styles.bookingCard}>
                <View style={styles.bookingHeader}>
                  <Text style={styles.bookingTitle}>{booking.listing?.title || 'Service'}</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: booking.status === 'confirmed' ? Colors.emerald : booking.status === 'completed' ? Colors.teal : Colors.gold }
                  ]}>
                    <Text style={styles.statusText}>{booking.status}</Text>
                  </View>
                </View>
                {booking.preferred_date && (
                  <Text style={styles.bookingDate}>Preferred: {booking.preferred_date}</Text>
                )}
              </Card>
            ))}
          </View>
        )}

        {/* Menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <Card variant="default" style={styles.menuCard}>
            {menuItems.map((item, index) => (
              <TouchableOpacity 
                key={item.label} 
                style={[styles.menuItem, index < menuItems.length - 1 && styles.menuItemBorder]}
              >
                <Ionicons name={item.icon as any} size={22} color={Colors.lightGray} />
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={18} color={Colors.mediumGray} />
              </TouchableOpacity>
            ))}
          </Card>
        </View>

        {/* Admin Access */}
        {user?.role === 'admin' && (
          <View style={styles.section}>
            <Button
              title="Admin Dashboard"
              onPress={() => router.push('/admin')}
              variant="outline"
              icon="settings-outline"
              fullWidth
            />
          </View>
        )}

        {/* Logout */}
        <View style={styles.section}>
          <Button
            title="Sign Out"
            onPress={handleLogout}
            variant="ghost"
            icon="log-out-outline"
            fullWidth
          />
        </View>

        {/* Version */}
        <Text style={styles.version}>Solaris Holistic Health v1.0</Text>
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
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.emerald,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '600',
    color: Colors.deepNavy,
  },
  adminBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: Colors.gold,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.deepNavy,
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.white,
  },
  email: {
    fontSize: 14,
    color: Colors.mediumGray,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
    marginTop: Spacing.sm,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.mediumGray,
    marginTop: 2,
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
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.darkBlue,
  },
  rewardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${Colors.gold}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardType: {
    fontSize: 14,
    color: Colors.white,
  },
  rewardNote: {
    fontSize: 12,
    color: Colors.mediumGray,
  },
  rewardPoints: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.emerald,
  },
  bookingCard: {
    marginBottom: Spacing.sm,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.deepNavy,
    textTransform: 'capitalize',
  },
  bookingDate: {
    fontSize: 13,
    color: Colors.mediumGray,
    marginTop: 4,
  },
  menuCard: {
    padding: 0,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.darkBlue,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    color: Colors.lightGray,
    marginLeft: Spacing.md,
  },
  version: {
    fontSize: 12,
    color: Colors.mediumGray,
    textAlign: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
});
