import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, RefreshControl, Modal, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../../src/constants/colors';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { useAuth } from '../../src/context/AuthContext';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

type AdminTab = 'overview' | 'users' | 'listings' | 'bookings' | 'rewards';

const listingTypes = ['practitioner', 'clinic', 'service', 'workshop', 'place', 'program', 'diagnostics', 'kitchen'];
const nodeTypes = ['care_node', 'practitioner_node', 'protocol_node', 'experience_node', 'place_node', 'education_node', 'commerce_node'];

export default function AdminDashboard() {
  const router = useRouter();
  const { user, sessionToken } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateListing, setShowCreateListing] = useState(false);
  const [newListing, setNewListing] = useState({
    listing_type: 'practitioner',
    node_type: 'practitioner_node',
    title: '',
    short_description: '',
    city: '',
    country: '',
    price_range_min: '',
    price_range_max: '',
    status: 'published',
  });

  useEffect(() => {
    if (user?.role !== 'admin') {
      router.replace('/(tabs)');
      return;
    }
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    if (!sessionToken) return;
    try {
      if (activeTab === 'overview' || !stats) {
        const statsRes = await fetch(`${API_URL}/api/admin/stats`, {
          headers: { 'Authorization': `Bearer ${sessionToken}` },
        });
        if (statsRes.ok) setStats(await statsRes.json());
      }
      
      if (activeTab === 'users') {
        const usersRes = await fetch(`${API_URL}/api/admin/users`, {
          headers: { 'Authorization': `Bearer ${sessionToken}` },
        });
        if (usersRes.ok) setUsers(await usersRes.json());
      }
      
      if (activeTab === 'listings') {
        const listingsRes = await fetch(`${API_URL}/api/admin/listings`, {
          headers: { 'Authorization': `Bearer ${sessionToken}` },
        });
        if (listingsRes.ok) setListings(await listingsRes.json());
      }
      
      if (activeTab === 'bookings') {
        const bookingsRes = await fetch(`${API_URL}/api/admin/bookings`, {
          headers: { 'Authorization': `Bearer ${sessionToken}` },
        });
        if (bookingsRes.ok) setBookings(await bookingsRes.json());
      }
    } catch (error) {
      console.error('Admin fetch error:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const seedData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/seed`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${sessionToken}` },
      });
      if (response.ok) {
        Alert.alert('Success', 'Seed data created!');
        fetchData();
      }
    } catch (error) {
      console.error('Seed error:', error);
    }
  };

  const createListing = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          ...newListing,
          price_range_min: newListing.price_range_min ? parseFloat(newListing.price_range_min) : null,
          price_range_max: newListing.price_range_max ? parseFloat(newListing.price_range_max) : null,
        }),
      });
      if (response.ok) {
        setShowCreateListing(false);
        setNewListing({
          listing_type: 'practitioner',
          node_type: 'practitioner_node',
          title: '',
          short_description: '',
          city: '',
          country: '',
          price_range_min: '',
          price_range_max: '',
          status: 'published',
        });
        fetchData();
      }
    } catch (error) {
      console.error('Create listing error:', error);
    }
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      await fetch(`${API_URL}/api/admin/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ status }),
      });
      fetchData();
    } catch (error) {
      console.error('Update booking error:', error);
    }
  };

  const tabs: { id: AdminTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { id: 'overview', label: 'Overview', icon: 'grid-outline' },
    { id: 'users', label: 'Users', icon: 'people-outline' },
    { id: 'listings', label: 'Listings', icon: 'list-outline' },
    { id: 'bookings', label: 'Bookings', icon: 'calendar-outline' },
  ];

  const renderOverview = () => (
    <>
      <View style={styles.statsGrid}>
        <Card variant="elevated" style={styles.statCard}>
          <Ionicons name="people" size={24} color={Colors.emerald} />
          <Text style={styles.statValue}>{stats?.total_users || 0}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </Card>
        <Card variant="elevated" style={styles.statCard}>
          <Ionicons name="checkmark-circle" size={24} color={Colors.teal} />
          <Text style={styles.statValue}>{stats?.onboarding_rate || 0}%</Text>
          <Text style={styles.statLabel}>Onboarding Rate</Text>
        </Card>
        <Card variant="elevated" style={styles.statCard}>
          <Ionicons name="list" size={24} color={Colors.gold} />
          <Text style={styles.statValue}>{stats?.published_listings || 0}</Text>
          <Text style={styles.statLabel}>Active Listings</Text>
        </Card>
        <Card variant="elevated" style={styles.statCard}>
          <Ionicons name="calendar" size={24} color={Colors.info} />
          <Text style={styles.statValue}>{stats?.pending_bookings || 0}</Text>
          <Text style={styles.statLabel}>Pending Bookings</Text>
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <Button
            title="Seed Sample Data"
            onPress={seedData}
            variant="outline"
            size="small"
            icon="download-outline"
          />
          <Button
            title="Add Listing"
            onPress={() => setShowCreateListing(true)}
            size="small"
            icon="add"
          />
        </View>
      </View>

      {stats?.recent_users && stats.recent_users.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Users</Text>
          <Card variant="default">
            {stats.recent_users.map((u: any) => (
              <View key={u.user_id} style={styles.userRow}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>{(u.name || 'U').charAt(0)}</Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{u.name || 'Unnamed'}</Text>
                  <Text style={styles.userEmail}>{u.email}</Text>
                </View>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: u.onboarding_status === 'completed' ? Colors.emerald : Colors.gold }
                ]} />
              </View>
            ))}
          </Card>
        </View>
      )}
    </>
  );

  const renderUsers = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>All Users ({users.length})</Text>
      {users.map((u) => (
        <Card key={u.user_id} variant="default" style={styles.itemCard}>
          <View style={styles.itemHeader}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>{(u.name || 'U').charAt(0)}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{u.name || 'Unnamed'}</Text>
              <Text style={styles.userEmail}>{u.email}</Text>
            </View>
            <View style={[
              styles.badge,
              { backgroundColor: u.role === 'admin' ? Colors.gold : Colors.teal }
            ]}>
              <Text style={styles.badgeText}>{u.role}</Text>
            </View>
          </View>
          <View style={styles.itemMeta}>
            <Text style={styles.metaText}>Status: {u.onboarding_status}</Text>
            <Text style={styles.metaText}>Step: {u.onboarding_step}</Text>
          </View>
        </Card>
      ))}
    </View>
  );

  const renderListings = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>All Listings ({listings.length})</Text>
        <TouchableOpacity onPress={() => setShowCreateListing(true)}>
          <Ionicons name="add-circle" size={28} color={Colors.emerald} />
        </TouchableOpacity>
      </View>
      {listings.map((listing) => (
        <Card key={listing.listing_id} variant="default" style={styles.itemCard}>
          <View style={styles.itemHeader}>
            <View style={[styles.typeIcon, { backgroundColor: `${Colors.emerald}20` }]}>
              <Ionicons name="pricetag" size={18} color={Colors.emerald} />
            </View>
            <View style={styles.listingInfo}>
              <Text style={styles.listingTitle}>{listing.title}</Text>
              <Text style={styles.listingType}>{listing.listing_type}</Text>
            </View>
            <View style={[
              styles.badge,
              { backgroundColor: listing.status === 'published' ? Colors.emerald : Colors.mediumGray }
            ]}>
              <Text style={styles.badgeText}>{listing.status}</Text>
            </View>
          </View>
          {listing.short_description && (
            <Text style={styles.listingDesc} numberOfLines={2}>{listing.short_description}</Text>
          )}
          <View style={styles.itemMeta}>
            {listing.city && <Text style={styles.metaText}>{listing.city}</Text>}
            {listing.price_range_min && (
              <Text style={styles.metaText}>${listing.price_range_min}</Text>
            )}
          </View>
        </Card>
      ))}
    </View>
  );

  const renderBookings = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>All Bookings ({bookings.length})</Text>
      {bookings.length === 0 ? (
        <Card variant="default" style={styles.emptyCard}>
          <Text style={styles.emptyText}>No bookings yet</Text>
        </Card>
      ) : (
        bookings.map((booking) => (
          <Card key={booking.booking_id} variant="default" style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <View style={styles.bookingInfo}>
                <Text style={styles.listingTitle}>{booking.listing?.title || 'Service'}</Text>
                <Text style={styles.listingType}>by {booking.user?.name || booking.user?.email}</Text>
              </View>
              <View style={[
                styles.badge,
                { backgroundColor: 
                  booking.status === 'confirmed' ? Colors.emerald : 
                  booking.status === 'completed' ? Colors.teal : 
                  booking.status === 'cancelled' ? Colors.error : Colors.gold }
              ]}>
                <Text style={styles.badgeText}>{booking.status}</Text>
              </View>
            </View>
            {booking.preferred_date && (
              <Text style={styles.metaText}>Preferred: {booking.preferred_date}</Text>
            )}
            {booking.note && (
              <Text style={styles.bookingNote}>{booking.note}</Text>
            )}
            <View style={styles.bookingActions}>
              {booking.status === 'pending' && (
                <>
                  <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: Colors.emerald }]}
                    onPress={() => updateBookingStatus(booking.booking_id, 'confirmed')}
                  >
                    <Text style={styles.actionBtnText}>Confirm</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: Colors.error }]}
                    onPress={() => updateBookingStatus(booking.booking_id, 'cancelled')}
                  >
                    <Text style={styles.actionBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              )}
              {booking.status === 'confirmed' && (
                <TouchableOpacity 
                  style={[styles.actionBtn, { backgroundColor: Colors.teal }]}
                  onPress={() => updateBookingStatus(booking.booking_id, 'completed')}
                >
                  <Text style={styles.actionBtnText}>Mark Complete</Text>
                </TouchableOpacity>
              )}
            </View>
          </Card>
        ))
      )}
    </View>
  );

  return (
    <LinearGradient colors={Colors.gradientPrimary} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Admin Dashboard</Text>
          <Text style={styles.subtitle}>Manage Solaris</Text>
        </View>
      </View>

      {/* Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons 
              name={tab.icon} 
              size={18} 
              color={activeTab === tab.id ? Colors.deepNavy : Colors.lightGray} 
            />
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.emerald} />
        }
      >
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'listings' && renderListings()}
        {activeTab === 'bookings' && renderBookings()}
      </ScrollView>

      {/* Create Listing Modal */}
      <Modal
        visible={showCreateListing}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateListing(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Listing</Text>
              <TouchableOpacity onPress={() => setShowCreateListing(false)}>
                <Ionicons name="close" size={24} color={Colors.white} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Listing Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.chipRow}>
                    {listingTypes.map(type => (
                      <TouchableOpacity
                        key={type}
                        style={[styles.chip, newListing.listing_type === type && styles.chipActive]}
                        onPress={() => setNewListing({ ...newListing, listing_type: type })}
                      >
                        <Text style={[styles.chipText, newListing.listing_type === type && styles.chipTextActive]}>
                          {type}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Title *</Text>
                <TextInput
                  style={styles.input}
                  value={newListing.title}
                  onChangeText={(text) => setNewListing({ ...newListing, title: text })}
                  placeholder="Listing title"
                  placeholderTextColor={Colors.mediumGray}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newListing.short_description}
                  onChangeText={(text) => setNewListing({ ...newListing, short_description: text })}
                  placeholder="Short description"
                  placeholderTextColor={Colors.mediumGray}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formRow}>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>City</Text>
                  <TextInput
                    style={styles.input}
                    value={newListing.city}
                    onChangeText={(text) => setNewListing({ ...newListing, city: text })}
                    placeholder="City"
                    placeholderTextColor={Colors.mediumGray}
                  />
                </View>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>Country</Text>
                  <TextInput
                    style={styles.input}
                    value={newListing.country}
                    onChangeText={(text) => setNewListing({ ...newListing, country: text })}
                    placeholder="Country"
                    placeholderTextColor={Colors.mediumGray}
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>Min Price</Text>
                  <TextInput
                    style={styles.input}
                    value={newListing.price_range_min}
                    onChangeText={(text) => setNewListing({ ...newListing, price_range_min: text })}
                    placeholder="0"
                    placeholderTextColor={Colors.mediumGray}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>Max Price</Text>
                  <TextInput
                    style={styles.input}
                    value={newListing.price_range_max}
                    onChangeText={(text) => setNewListing({ ...newListing, price_range_max: text })}
                    placeholder="0"
                    placeholderTextColor={Colors.mediumGray}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Create Listing"
                onPress={createListing}
                disabled={!newListing.title.trim()}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingTop: 60,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.midnightBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.white,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.mediumGray,
  },
  tabsContainer: {
    maxHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: Colors.midnightBlue,
  },
  tabsContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    marginRight: Spacing.sm,
  },
  tabActive: {
    backgroundColor: Colors.emerald,
  },
  tabLabel: {
    fontSize: 13,
    color: Colors.lightGray,
    marginLeft: 6,
  },
  tabLabelActive: {
    color: Colors.deepNavy,
    fontWeight: '600',
  },
  content: {
    padding: Spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.white,
    marginTop: Spacing.sm,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.mediumGray,
    marginTop: 2,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: Spacing.md,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.darkBlue,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.emerald,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  userAvatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.deepNavy,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  userEmail: {
    fontSize: 12,
    color: Colors.mediumGray,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  itemCard: {
    marginBottom: Spacing.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  listingInfo: {
    flex: 1,
  },
  listingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
  listingType: {
    fontSize: 12,
    color: Colors.mediumGray,
  },
  listingDesc: {
    fontSize: 13,
    color: Colors.lightGray,
    marginBottom: Spacing.sm,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.deepNavy,
    textTransform: 'capitalize',
  },
  itemMeta: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  metaText: {
    fontSize: 12,
    color: Colors.mediumGray,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingNote: {
    fontSize: 13,
    color: Colors.lightGray,
    fontStyle: 'italic',
    marginVertical: Spacing.sm,
  },
  bookingActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  actionBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.mediumGray,
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
    maxHeight: '90%',
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
    maxHeight: 400,
  },
  modalFooter: {
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.lightGray,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.midnightBlue,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 15,
    color: Colors.white,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  formRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  formGroupHalf: {
    flex: 1,
    marginBottom: Spacing.lg,
  },
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.midnightBlue,
  },
  chipActive: {
    backgroundColor: Colors.emerald,
  },
  chipText: {
    fontSize: 12,
    color: Colors.lightGray,
  },
  chipTextActive: {
    color: Colors.deepNavy,
    fontWeight: '600',
  },
});
