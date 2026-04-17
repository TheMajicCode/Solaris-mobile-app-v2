import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, RefreshControl, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../../src/constants/colors';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { useAuth } from '../../src/context/AuthContext';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

type AdminTab = 'overview' | 'users' | 'listings' | 'bookings' | 'rewards' | 'settings';

const listingTypes = ['practitioner', 'clinic', 'service', 'workshop', 'place', 'program', 'diagnostics', 'kitchen'];
const nodeTypes = ['care_node', 'practitioner_node', 'protocol_node', 'experience_node', 'place_node', 'education_node', 'commerce_node'];
const bookingStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];

export default function AdminDashboard() {
  const router = useRouter();
  const { user, sessionToken, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showCreateListing, setShowCreateListing] = useState(false);
  const [showEditUser, setShowEditUser] = useState<any>(null);
  const [showBookingDetail, setShowBookingDetail] = useState<any>(null);
  
  // Create listing form
  const [newListing, setNewListing] = useState({
    listing_type: 'practitioner',
    node_type: 'practitioner_node',
    title: '',
    short_description: '',
    full_description: '',
    tagline: '',
    city: '',
    country: 'Colombia',
    price_range_min: '',
    price_range_max: '',
    currency: 'USD',
    languages: ['English', 'Spanish'],
    booking_enabled: true,
    featured: false,
    status: 'published',
    specialties: '',
    tags: '',
  });

  useEffect(() => {
    if (user?.role !== 'admin') {
      Alert.alert('Access Denied', 'Admin access required', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
      return;
    }
    fetchAllData();
  }, []);

  const fetchAllData = useCallback(async () => {
    if (!sessionToken) return;
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${sessionToken}` };
      
      const [statsRes, usersRes, listingsRes, bookingsRes, rewardsRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/stats`, { headers }),
        fetch(`${API_URL}/api/admin/users`, { headers }),
        fetch(`${API_URL}/api/admin/listings`, { headers }),
        fetch(`${API_URL}/api/admin/bookings`, { headers }),
        fetch(`${API_URL}/api/admin/rewards`, { headers }),
      ]);
      
      if (statsRes.ok) setStats(await statsRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
      if (listingsRes.ok) setListings(await listingsRes.json());
      if (bookingsRes.ok) setBookings(await bookingsRes.json());
      if (rewardsRes.ok) setRewards(await rewardsRes.json());
      
    } catch (error) {
      console.error('Admin fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [sessionToken]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  const createListing = async () => {
    try {
      const listingData = {
        ...newListing,
        price_range_min: newListing.price_range_min ? parseFloat(newListing.price_range_min) : null,
        price_range_max: newListing.price_range_max ? parseFloat(newListing.price_range_max) : null,
        specialties: newListing.specialties ? newListing.specialties.split(',').map(s => s.trim()) : [],
        tags: newListing.tags ? newListing.tags.split(',').map(t => t.trim().toLowerCase()) : [],
      };
      
      const response = await fetch(`${API_URL}/api/admin/listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify(listingData),
      });
      
      if (response.ok) {
        Alert.alert('Success', 'Listing created successfully!');
        setShowCreateListing(false);
        resetListingForm();
        fetchAllData();
      } else {
        Alert.alert('Error', 'Failed to create listing');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create listing');
    }
  };

  const resetListingForm = () => {
    setNewListing({
      listing_type: 'practitioner',
      node_type: 'practitioner_node',
      title: '',
      short_description: '',
      full_description: '',
      tagline: '',
      city: '',
      country: 'Colombia',
      price_range_min: '',
      price_range_max: '',
      currency: 'USD',
      languages: ['English', 'Spanish'],
      booking_enabled: true,
      featured: false,
      status: 'published',
      specialties: '',
      tags: '',
    });
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      if (response.ok) {
        Alert.alert('Success', `User role updated to ${newRole}`);
        setShowEditUser(null);
        fetchAllData();
      } else {
        Alert.alert('Error', 'Failed to update user role');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update user');
    }
  };

  const toggleListingStatus = async (listingId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    try {
      const response = await fetch(`${API_URL}/api/admin/listings/${listingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        Alert.alert('Success', `Listing ${newStatus === 'published' ? 'published' : 'unpublished'}`);
        fetchAllData();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update listing');
    }
  };

  const toggleListingFeatured = async (listingId: string, currentFeatured: boolean) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/listings/${listingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ featured: !currentFeatured }),
      });
      if (response.ok) {
        fetchAllData();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update listing');
    }
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ status }),
      });
      
      if (response.ok) {
        Alert.alert('Success', `Booking ${status}`);
        setShowBookingDetail(null);
        fetchAllData();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update booking');
    }
  };

  const deleteListing = async (listingId: string) => {
    Alert.alert(
      'Delete Listing',
      'Are you sure you want to delete this listing?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/api/admin/listings/${listingId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${sessionToken}` },
              });
              if (response.ok) {
                Alert.alert('Success', 'Listing deleted');
                fetchAllData();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete listing');
            }
          }
        }
      ]
    );
  };

  const tabs: { id: AdminTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { id: 'overview', label: 'Overview', icon: 'grid-outline' },
    { id: 'users', label: 'Users', icon: 'people-outline' },
    { id: 'listings', label: 'Listings', icon: 'list-outline' },
    { id: 'bookings', label: 'Bookings', icon: 'calendar-outline' },
    { id: 'rewards', label: 'Rewards', icon: 'gift-outline' },
    { id: 'settings', label: 'Settings', icon: 'settings-outline' },
  ];

  // Overview Tab
  const renderOverview = () => (
    <>
      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <Card variant="elevated" style={styles.statCard}>
          <Ionicons name="people" size={28} color={Colors.emerald} />
          <Text style={styles.statValue}>{stats?.total_users || 0}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </Card>
        <Card variant="elevated" style={styles.statCard}>
          <Ionicons name="checkmark-circle" size={28} color={Colors.teal} />
          <Text style={styles.statValue}>{stats?.onboarding_rate || 0}%</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </Card>
        <Card variant="elevated" style={styles.statCard}>
          <Ionicons name="document-text" size={28} color={Colors.gold} />
          <Text style={styles.statValue}>{stats?.total_assessments || 0}</Text>
          <Text style={styles.statLabel}>Assessments</Text>
        </Card>
        <Card variant="elevated" style={styles.statCard}>
          <Ionicons name="storefront" size={28} color={Colors.info} />
          <Text style={styles.statValue}>{stats?.published_listings || 0}</Text>
          <Text style={styles.statLabel}>Listings</Text>
        </Card>
      </View>

      {/* Booking Stats */}
      <Card variant="glass" style={styles.bookingStats}>
        <Text style={styles.cardTitle}>Booking Overview</Text>
        <View style={styles.bookingStatsRow}>
          <View style={styles.bookingStat}>
            <Text style={[styles.bookingStatValue, { color: Colors.gold }]}>
              {stats?.pending_bookings || 0}
            </Text>
            <Text style={styles.bookingStatLabel}>Pending</Text>
          </View>
          <View style={styles.bookingStat}>
            <Text style={[styles.bookingStatValue, { color: Colors.emerald }]}>
              {bookings.filter(b => b.status === 'confirmed').length}
            </Text>
            <Text style={styles.bookingStatLabel}>Confirmed</Text>
          </View>
          <View style={styles.bookingStat}>
            <Text style={[styles.bookingStatValue, { color: Colors.teal }]}>
              {bookings.filter(b => b.status === 'completed').length}
            </Text>
            <Text style={styles.bookingStatLabel}>Completed</Text>
          </View>
        </View>
      </Card>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => setShowCreateListing(true)}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: `${Colors.emerald}20` }]}>
              <Ionicons name="add-circle" size={24} color={Colors.emerald} />
            </View>
            <Text style={styles.quickActionLabel}>Add Listing</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => setActiveTab('bookings')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: `${Colors.gold}20` }]}>
              <Ionicons name="time" size={24} color={Colors.gold} />
            </View>
            <Text style={styles.quickActionLabel}>Pending ({stats?.pending_bookings || 0})</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => setActiveTab('users')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: `${Colors.teal}20` }]}>
              <Ionicons name="people" size={24} color={Colors.teal} />
            </View>
            <Text style={styles.quickActionLabel}>View Users</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Users */}
      {stats?.recent_users && stats.recent_users.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Users</Text>
          <Card variant="default">
            {stats.recent_users.slice(0, 5).map((u: any, idx: number) => (
              <View key={u.user_id} style={[styles.userRow, idx < 4 && styles.rowBorder]}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>
                    {(u.name || 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{u.name || 'Unnamed'}</Text>
                  <Text style={styles.userEmail}>{u.email}</Text>
                </View>
                <View style={[
                  styles.statusIndicator,
                  { backgroundColor: u.onboarding_status === 'completed' ? Colors.emerald : Colors.gold }
                ]} />
              </View>
            ))}
          </Card>
        </View>
      )}
    </>
  );

  // Users Tab
  const renderUsers = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>All Users ({users.length})</Text>
      </View>
      
      {users.length === 0 ? (
        <Card variant="default" style={styles.emptyCard}>
          <Ionicons name="people-outline" size={48} color={Colors.mediumGray} />
          <Text style={styles.emptyText}>No users found</Text>
        </Card>
      ) : (
        users.map((u, idx) => (
          <Card key={u.user_id} variant="default" style={styles.itemCard}>
            <TouchableOpacity 
              style={styles.itemContent}
              onPress={() => setShowEditUser(u)}
            >
              <View style={[styles.userAvatar, u.role === 'admin' && styles.adminAvatar]}>
                <Text style={styles.userAvatarText}>
                  {(u.name || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <View style={styles.userNameRow}>
                  <Text style={styles.userName}>{u.name || 'Unnamed'}</Text>
                  {u.role === 'admin' && (
                    <View style={styles.adminBadge}>
                      <Text style={styles.adminBadgeText}>ADMIN</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.userEmail}>{u.email}</Text>
                <View style={styles.userMeta}>
                  <Text style={styles.metaText}>
                    Status: {u.onboarding_status || 'unknown'}
                  </Text>
                  <Text style={styles.metaText}>•</Text>
                  <Text style={styles.metaText}>
                    {u.city || 'No location'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.mediumGray} />
            </TouchableOpacity>
          </Card>
        ))
      )}
    </View>
  );

  // Listings Tab
  const renderListings = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>All Listings ({listings.length})</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowCreateListing(true)}
        >
          <Ionicons name="add" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>
      
      {listings.length === 0 ? (
        <Card variant="default" style={styles.emptyCard}>
          <Ionicons name="storefront-outline" size={48} color={Colors.mediumGray} />
          <Text style={styles.emptyText}>No listings yet</Text>
          <Button
            title="Create First Listing"
            onPress={() => setShowCreateListing(true)}
            size="small"
            style={{ marginTop: Spacing.md }}
          />
        </Card>
      ) : (
        listings.map((listing) => (
          <Card key={listing.listing_id} variant="default" style={styles.itemCard}>
            <View style={styles.listingHeader}>
              <View style={[styles.typeIcon, { backgroundColor: `${Colors.emerald}20` }]}>
                <Ionicons 
                  name={
                    listing.listing_type === 'practitioner' ? 'person' :
                    listing.listing_type === 'clinic' ? 'business' :
                    listing.listing_type === 'workshop' ? 'school' :
                    listing.listing_type === 'place' ? 'location' : 'medical'
                  } 
                  size={18} 
                  color={Colors.emerald} 
                />
              </View>
              <View style={styles.listingInfo}>
                <Text style={styles.listingTitle}>{listing.title}</Text>
                <Text style={styles.listingType}>
                  {listing.listing_type} • {listing.city || 'No location'}
                </Text>
              </View>
              <View style={styles.listingActions}>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: listing.status === 'published' ? Colors.emerald : Colors.mediumGray }
                ]}>
                  <Text style={styles.statusBadgeText}>{listing.status}</Text>
                </View>
              </View>
            </View>
            
            {listing.short_description && (
              <Text style={styles.listingDesc} numberOfLines={2}>
                {listing.short_description}
              </Text>
            )}
            
            <View style={styles.listingFooter}>
              <View style={styles.listingMeta}>
                {listing.price_range_min && (
                  <Text style={styles.metaText}>
                    ${listing.price_range_min}{listing.price_range_max ? ` - $${listing.price_range_max}` : ''}
                  </Text>
                )}
                {listing.featured && (
                  <View style={styles.featuredBadge}>
                    <Ionicons name="star" size={10} color={Colors.gold} />
                    <Text style={styles.featuredText}>Featured</Text>
                  </View>
                )}
              </View>
              <View style={styles.listingActionBtns}>
                <TouchableOpacity 
                  onPress={() => toggleListingFeatured(listing.listing_id, listing.featured)}
                  style={styles.iconBtn}
                >
                  <Ionicons 
                    name={listing.featured ? 'star' : 'star-outline'} 
                    size={18} 
                    color={Colors.gold} 
                  />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => toggleListingStatus(listing.listing_id, listing.status)}
                  style={styles.iconBtn}
                >
                  <Ionicons 
                    name={listing.status === 'published' ? 'eye-off-outline' : 'eye-outline'} 
                    size={18} 
                    color={Colors.teal} 
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteListing(listing.listing_id)} style={styles.iconBtn}>
                  <Ionicons name="trash-outline" size={18} color={Colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        ))
      )}
    </View>
  );

  // Bookings Tab
  const renderBookings = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>All Bookings ({bookings.length})</Text>
      </View>
      
      {bookings.length === 0 ? (
        <Card variant="default" style={styles.emptyCard}>
          <Ionicons name="calendar-outline" size={48} color={Colors.mediumGray} />
          <Text style={styles.emptyText}>No bookings yet</Text>
        </Card>
      ) : (
        bookings.map((booking) => (
          <Card 
            key={booking.booking_id} 
            variant="default" 
            style={styles.itemCard}
            onPress={() => setShowBookingDetail(booking)}
          >
            <View style={styles.bookingHeader}>
              <View style={styles.bookingInfo}>
                <Text style={styles.bookingTitle}>
                  {booking.listing?.title || 'Unknown Service'}
                </Text>
                <Text style={styles.bookingUser}>
                  {booking.user?.name || booking.user?.email || 'Unknown User'}
                </Text>
              </View>
              <View style={[
                styles.statusBadge,
                { 
                  backgroundColor: 
                    booking.status === 'confirmed' ? Colors.emerald :
                    booking.status === 'completed' ? Colors.teal :
                    booking.status === 'cancelled' ? Colors.error : Colors.gold
                }
              ]}>
                <Text style={styles.statusBadgeText}>{booking.status}</Text>
              </View>
            </View>
            
            <View style={styles.bookingMeta}>
              {booking.preferred_date && (
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={14} color={Colors.mediumGray} />
                  <Text style={styles.metaText}>{booking.preferred_date}</Text>
                </View>
              )}
              {booking.preferred_time && (
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={14} color={Colors.mediumGray} />
                  <Text style={styles.metaText}>{booking.preferred_time}</Text>
                </View>
              )}
            </View>
            
            {booking.note && (
              <Text style={styles.bookingNote} numberOfLines={2}>
                "{booking.note}"
              </Text>
            )}
            
            {booking.status === 'pending' && (
              <View style={styles.bookingActions}>
                <TouchableOpacity 
                  style={[styles.actionBtn, { backgroundColor: Colors.emerald }]}
                  onPress={() => updateBookingStatus(booking.booking_id, 'confirmed')}
                >
                  <Ionicons name="checkmark" size={14} color={Colors.white} />
                  <Text style={styles.actionBtnText}>Confirm</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionBtn, { backgroundColor: Colors.error }]}
                  onPress={() => updateBookingStatus(booking.booking_id, 'cancelled')}
                >
                  <Ionicons name="close" size={14} color={Colors.white} />
                  <Text style={styles.actionBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {booking.status === 'confirmed' && (
              <View style={styles.bookingActions}>
                <TouchableOpacity 
                  style={[styles.actionBtn, { backgroundColor: Colors.teal }]}
                  onPress={() => updateBookingStatus(booking.booking_id, 'completed')}
                >
                  <Ionicons name="checkmark-done" size={14} color={Colors.white} />
                  <Text style={styles.actionBtnText}>Mark Complete</Text>
                </TouchableOpacity>
              </View>
            )}
          </Card>
        ))
      )}
    </View>
  );

  // Rewards Tab
  const renderRewards = () => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rewards & LOVE Points</Text>
        
        <Card variant="glass" style={styles.rewardsOverview}>
          <View style={styles.rewardsStat}>
            <Text style={styles.rewardsValue}>{rewards?.total_points_distributed || 0}</Text>
            <Text style={styles.rewardsLabel}>Total Points Distributed</Text>
          </View>
          <View style={styles.rewardsDivider} />
          <View style={styles.rewardsStat}>
            <Text style={styles.rewardsValue}>{rewards?.total_events || 0}</Text>
            <Text style={styles.rewardsLabel}>Total Events</Text>
          </View>
        </Card>

        {/* Points by Type */}
        {rewards?.by_type && Object.keys(rewards.by_type).length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>Points by Activity</Text>
            <Card variant="default">
              {Object.entries(rewards.by_type).map(([eventType, points], idx) => (
                <View key={eventType} style={[styles.pointRow, idx < Object.keys(rewards.by_type).length - 1 && styles.rowBorder]}>
                  <Text style={styles.pointEvent}>
                    {eventType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </Text>
                  <Text style={styles.pointValue}>{points as number} LOVE</Text>
                </View>
              ))}
            </Card>
          </>
        )}

        {/* Recent Reward Events */}
        {rewards?.recent && rewards.recent.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>Recent Activity</Text>
            {rewards.recent.slice(0, 10).map((r: any, idx: number) => (
              <Card key={r.event_id || idx} variant="default" style={styles.itemCard}>
                <View style={styles.rewardEventRow}>
                  <View style={styles.rewardEventIcon}>
                    <Ionicons 
                      name={
                        r.event_type === 'account_created' ? 'person-add' :
                        r.event_type === 'assessment_completed' ? 'document-text' :
                        r.event_type === 'daily_checkin' ? 'sunny' :
                        r.event_type === 'booking_request' ? 'calendar' : 'gift'
                      } 
                      size={18} 
                      color={Colors.gold} 
                    />
                  </View>
                  <View style={styles.rewardEventInfo}>
                    <Text style={styles.rewardEventType}>
                      {r.event_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </Text>
                    {r.note && <Text style={styles.rewardEventNote}>{r.note}</Text>}
                    <Text style={styles.rewardEventUser}>User: {r.user_id}</Text>
                  </View>
                  <Text style={styles.rewardEventPoints}>+{r.points}</Text>
                </View>
              </Card>
            ))}
          </>
        )}
        
        <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>Point Values Reference</Text>
        <Card variant="default">
          {[
            { event: 'Account Creation', points: 100 },
            { event: 'Onboarding Complete', points: 150 },
            { event: 'Assessment Complete', points: 250 },
            { event: 'Daily Check-in', points: 25 },
            { event: 'Booking Request', points: 50 },
            { event: '7-Day Streak', points: 100 },
            { event: 'Referral', points: 200 },
          ].map((item, idx) => (
            <View key={item.event} style={[styles.pointRow, idx < 6 && styles.rowBorder]}>
              <Text style={styles.pointEvent}>{item.event}</Text>
              <Text style={styles.pointValue}>+{item.points} LOVE</Text>
            </View>
          ))}
        </Card>
      </View>
    );
  };

  // Settings Tab
  const renderSettings = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Admin Settings</Text>
      
      <Card variant="default" style={styles.settingsCard}>
        <TouchableOpacity style={styles.settingsItem}>
          <Ionicons name="notifications-outline" size={22} color={Colors.lightGray} />
          <Text style={styles.settingsLabel}>Notification Settings</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.mediumGray} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsItem}>
          <Ionicons name="color-palette-outline" size={22} color={Colors.lightGray} />
          <Text style={styles.settingsLabel}>Branding & Content</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.mediumGray} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsItem}>
          <Ionicons name="analytics-outline" size={22} color={Colors.lightGray} />
          <Text style={styles.settingsLabel}>Analytics & Reports</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.mediumGray} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsItem}>
          <Ionicons name="shield-outline" size={22} color={Colors.lightGray} />
          <Text style={styles.settingsLabel}>Privacy & Compliance</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.mediumGray} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.settingsItem, { borderBottomWidth: 0 }]}>
          <Ionicons name="download-outline" size={22} color={Colors.lightGray} />
          <Text style={styles.settingsLabel}>Export Data</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.mediumGray} />
        </TouchableOpacity>
      </Card>
      
      <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>Environment</Text>
      <Card variant="default">
        <View style={styles.envItem}>
          <Text style={styles.envLabel}>API URL</Text>
          <Text style={styles.envValue}>{API_URL || 'Not set'}</Text>
        </View>
        <View style={styles.envItem}>
          <Text style={styles.envLabel}>Version</Text>
          <Text style={styles.envValue}>1.0.0 MVP</Text>
        </View>
      </Card>
    </View>
  );

  if (loading) {
    return (
      <LinearGradient colors={Colors.gradientPrimary} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.emerald} />
          <Text style={styles.loadingText}>Loading admin dashboard...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={Colors.gradientPrimary} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Admin Dashboard</Text>
          <Text style={styles.subtitle}>Solaris Management</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={22} color={Colors.emerald} />
        </TouchableOpacity>
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
        {activeTab === 'rewards' && renderRewards()}
        {activeTab === 'settings' && renderSettings()}
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

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Listing Type */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Listing Type *</Text>
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

              {/* Title */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Title *</Text>
                <TextInput
                  style={styles.input}
                  value={newListing.title}
                  onChangeText={(text) => setNewListing({ ...newListing, title: text })}
                  placeholder="e.g., Dr. Elena Voss"
                  placeholderTextColor={Colors.mediumGray}
                />
              </View>

              {/* Tagline */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Tagline</Text>
                <TextInput
                  style={styles.input}
                  value={newListing.tagline}
                  onChangeText={(text) => setNewListing({ ...newListing, tagline: text })}
                  placeholder="e.g., Healing through integration"
                  placeholderTextColor={Colors.mediumGray}
                />
              </View>

              {/* Short Description */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Short Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newListing.short_description}
                  onChangeText={(text) => setNewListing({ ...newListing, short_description: text })}
                  placeholder="Brief description for listing cards..."
                  placeholderTextColor={Colors.mediumGray}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Location */}
              <View style={styles.formRow}>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>City</Text>
                  <TextInput
                    style={styles.input}
                    value={newListing.city}
                    onChangeText={(text) => setNewListing({ ...newListing, city: text })}
                    placeholder="Medellín"
                    placeholderTextColor={Colors.mediumGray}
                  />
                </View>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>Country</Text>
                  <TextInput
                    style={styles.input}
                    value={newListing.country}
                    onChangeText={(text) => setNewListing({ ...newListing, country: text })}
                    placeholder="Colombia"
                    placeholderTextColor={Colors.mediumGray}
                  />
                </View>
              </View>

              {/* Price Range */}
              <View style={styles.formRow}>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>Min Price (USD)</Text>
                  <TextInput
                    style={styles.input}
                    value={newListing.price_range_min}
                    onChangeText={(text) => setNewListing({ ...newListing, price_range_min: text })}
                    placeholder="100"
                    placeholderTextColor={Colors.mediumGray}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>Max Price (USD)</Text>
                  <TextInput
                    style={styles.input}
                    value={newListing.price_range_max}
                    onChangeText={(text) => setNewListing({ ...newListing, price_range_max: text })}
                    placeholder="300"
                    placeholderTextColor={Colors.mediumGray}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Specialties */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Specialties (comma-separated)</Text>
                <TextInput
                  style={styles.input}
                  value={newListing.specialties}
                  onChangeText={(text) => setNewListing({ ...newListing, specialties: text })}
                  placeholder="e.g., Integrative Medicine, Stress Management"
                  placeholderTextColor={Colors.mediumGray}
                />
              </View>

              {/* Tags */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Tags (comma-separated)</Text>
                <TextInput
                  style={styles.input}
                  value={newListing.tags}
                  onChangeText={(text) => setNewListing({ ...newListing, tags: text })}
                  placeholder="e.g., holistic, wellness, premium"
                  placeholderTextColor={Colors.mediumGray}
                />
              </View>

              {/* Options */}
              <View style={styles.formGroup}>
                <TouchableOpacity 
                  style={styles.checkboxRow}
                  onPress={() => setNewListing({ ...newListing, featured: !newListing.featured })}
                >
                  <Ionicons 
                    name={newListing.featured ? 'checkbox' : 'square-outline'} 
                    size={22} 
                    color={Colors.emerald} 
                  />
                  <Text style={styles.checkboxLabel}>Featured listing</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.checkboxRow}
                  onPress={() => setNewListing({ ...newListing, booking_enabled: !newListing.booking_enabled })}
                >
                  <Ionicons 
                    name={newListing.booking_enabled ? 'checkbox' : 'square-outline'} 
                    size={22} 
                    color={Colors.emerald} 
                  />
                  <Text style={styles.checkboxLabel}>Enable booking requests</Text>
                </TouchableOpacity>
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

      {/* User Detail/Edit Modal */}
      <Modal
        visible={!!showEditUser}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditUser(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>User Details</Text>
              <TouchableOpacity onPress={() => setShowEditUser(null)}>
                <Ionicons name="close" size={24} color={Colors.white} />
              </TouchableOpacity>
            </View>
            
            {showEditUser && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* User Avatar & Name */}
                <View style={styles.userDetailHeader}>
                  <View style={[styles.userDetailAvatar, showEditUser.role === 'admin' && { backgroundColor: Colors.gold }]}>
                    <Text style={styles.userDetailAvatarText}>
                      {(showEditUser.name || 'U').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.userDetailName}>{showEditUser.name || 'Unnamed'}</Text>
                  <Text style={styles.userDetailEmail}>{showEditUser.email}</Text>
                  {showEditUser.role === 'admin' && (
                    <View style={styles.userDetailBadge}>
                      <Ionicons name="shield-checkmark" size={14} color={Colors.deepNavy} />
                      <Text style={styles.userDetailBadgeText}>Admin</Text>
                    </View>
                  )}
                </View>

                {/* User Info */}
                <Card variant="default" style={styles.userDetailCard}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>User ID</Text>
                    <Text style={styles.detailValue} numberOfLines={1}>{showEditUser.user_id}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Role</Text>
                    <Text style={[styles.detailValue, { color: showEditUser.role === 'admin' ? Colors.gold : Colors.emerald }]}>
                      {showEditUser.role}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Onboarding</Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: showEditUser.onboarding_status === 'completed' ? Colors.emerald : Colors.gold }
                    ]}>
                      <Text style={styles.statusBadgeText}>{showEditUser.onboarding_status || 'N/A'}</Text>
                    </View>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Location</Text>
                    <Text style={styles.detailValue}>
                      {showEditUser.city ? `${showEditUser.city}, ${showEditUser.country || ''}` : 'Not set'}
                    </Text>
                  </View>
                  <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                    <Text style={styles.detailLabel}>Phone</Text>
                    <Text style={styles.detailValue}>{showEditUser.phone || 'Not set'}</Text>
                  </View>
                </Card>

                {/* Role Management */}
                <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>Role Management</Text>
                <Card variant="default">
                  <View style={styles.roleActions}>
                    <TouchableOpacity
                      style={[
                        styles.roleBtn,
                        showEditUser.role === 'user' && styles.roleBtnActive,
                      ]}
                      onPress={() => {
                        if (showEditUser.role !== 'user') {
                          Alert.alert(
                            'Change Role',
                            `Change ${showEditUser.name || 'user'} role to User?`,
                            [
                              { text: 'Cancel', style: 'cancel' },
                              { text: 'Confirm', onPress: () => updateUserRole(showEditUser.user_id, 'user') },
                            ]
                          );
                        }
                      }}
                    >
                      <Ionicons name="person-outline" size={20} color={showEditUser.role === 'user' ? Colors.deepNavy : Colors.lightGray} />
                      <Text style={[styles.roleBtnText, showEditUser.role === 'user' && styles.roleBtnTextActive]}>User</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.roleBtn,
                        showEditUser.role === 'admin' && styles.roleBtnActiveGold,
                      ]}
                      onPress={() => {
                        if (showEditUser.role !== 'admin') {
                          Alert.alert(
                            'Grant Admin Access',
                            `Make ${showEditUser.name || 'user'} an Admin? They will have full management access.`,
                            [
                              { text: 'Cancel', style: 'cancel' },
                              { text: 'Grant Admin', style: 'destructive', onPress: () => updateUserRole(showEditUser.user_id, 'admin') },
                            ]
                          );
                        }
                      }}
                    >
                      <Ionicons name="shield-outline" size={20} color={showEditUser.role === 'admin' ? Colors.deepNavy : Colors.lightGray} />
                      <Text style={[styles.roleBtnText, showEditUser.role === 'admin' && styles.roleBtnTextActive]}>Admin</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Booking Detail Modal */}
      <Modal
        visible={!!showBookingDetail}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBookingDetail(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Booking Details</Text>
              <TouchableOpacity onPress={() => setShowBookingDetail(null)}>
                <Ionicons name="close" size={24} color={Colors.white} />
              </TouchableOpacity>
            </View>

            {showBookingDetail && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Booking Status Header */}
                <View style={styles.bookingDetailHeader}>
                  <View style={[
                    styles.bookingStatusLarge,
                    {
                      backgroundColor:
                        showBookingDetail.status === 'confirmed' ? Colors.emerald :
                        showBookingDetail.status === 'completed' ? Colors.teal :
                        showBookingDetail.status === 'cancelled' ? Colors.error : Colors.gold,
                    }
                  ]}>
                    <Ionicons
                      name={
                        showBookingDetail.status === 'confirmed' ? 'checkmark-circle' :
                        showBookingDetail.status === 'completed' ? 'checkmark-done-circle' :
                        showBookingDetail.status === 'cancelled' ? 'close-circle' : 'time'
                      }
                      size={24}
                      color={Colors.white}
                    />
                    <Text style={styles.bookingStatusText}>{showBookingDetail.status.toUpperCase()}</Text>
                  </View>
                </View>

                {/* Service Info */}
                <Card variant="default" style={styles.userDetailCard}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Service</Text>
                    <Text style={styles.detailValue}>{showBookingDetail.listing?.title || 'Unknown'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Type</Text>
                    <Text style={styles.detailValue}>{showBookingDetail.listing?.listing_type || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Client</Text>
                    <Text style={styles.detailValue}>{showBookingDetail.user?.name || showBookingDetail.user?.email || 'Unknown'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Email</Text>
                    <Text style={styles.detailValue}>{showBookingDetail.user?.email || 'N/A'}</Text>
                  </View>
                  {showBookingDetail.preferred_date && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Date</Text>
                      <Text style={styles.detailValue}>{showBookingDetail.preferred_date}</Text>
                    </View>
                  )}
                  {showBookingDetail.preferred_time && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Time</Text>
                      <Text style={styles.detailValue}>{showBookingDetail.preferred_time}</Text>
                    </View>
                  )}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Payment</Text>
                    <Text style={[styles.detailValue, { color: showBookingDetail.payment_status === 'paid' ? Colors.emerald : Colors.gold }]}>
                      {showBookingDetail.payment_status || 'unpaid'}
                    </Text>
                  </View>
                  {showBookingDetail.note && (
                    <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                      <Text style={styles.detailLabel}>Note</Text>
                      <Text style={[styles.detailValue, { flex: 1, textAlign: 'right' }]}>{showBookingDetail.note}</Text>
                    </View>
                  )}
                </Card>

                {/* Status Actions */}
                <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>Update Status</Text>
                <View style={styles.statusActionsGrid}>
                  {bookingStatuses.map(status => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.statusActionBtn,
                        showBookingDetail.status === status && styles.statusActionBtnActive,
                        {
                          borderColor:
                            status === 'confirmed' ? Colors.emerald :
                            status === 'completed' ? Colors.teal :
                            status === 'cancelled' ? Colors.error : Colors.gold,
                        },
                        showBookingDetail.status === status && {
                          backgroundColor:
                            status === 'confirmed' ? Colors.emerald :
                            status === 'completed' ? Colors.teal :
                            status === 'cancelled' ? Colors.error : Colors.gold,
                        }
                      ]}
                      onPress={() => {
                        if (showBookingDetail.status !== status) {
                          updateBookingStatus(showBookingDetail.booking_id, status);
                        }
                      }}
                      disabled={showBookingDetail.status === status}
                    >
                      <Ionicons
                        name={
                          status === 'confirmed' ? 'checkmark-circle-outline' :
                          status === 'completed' ? 'checkmark-done-circle-outline' :
                          status === 'cancelled' ? 'close-circle-outline' : 'time-outline'
                        }
                        size={18}
                        color={showBookingDetail.status === status ? Colors.white : Colors.lightGray}
                      />
                      <Text style={[
                        styles.statusActionText,
                        showBookingDetail.status === status && { color: Colors.white }
                      ]}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}
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
  },
  headerContent: {
    flex: 1,
    marginLeft: Spacing.md,
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
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.midnightBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsContainer: {
    maxHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: Colors.midnightBlue,
  },
  tabsContent: {
    paddingHorizontal: Spacing.md,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    marginRight: Spacing.xs,
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
    paddingBottom: 100,
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
    paddingVertical: Spacing.lg,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.white,
    marginTop: Spacing.sm,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.mediumGray,
    marginTop: 2,
  },
  bookingStats: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: Spacing.md,
  },
  bookingStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  bookingStat: {
    alignItems: 'center',
  },
  bookingStatValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  bookingStatLabel: {
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
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.emerald,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickAction: {
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  quickActionLabel: {
    fontSize: 12,
    color: Colors.lightGray,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.darkBlue,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.emerald,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  adminAvatar: {
    backgroundColor: Colors.gold,
  },
  userAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.deepNavy,
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
  adminBadge: {
    backgroundColor: Colors.gold,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: Spacing.sm,
  },
  adminBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.deepNavy,
  },
  userEmail: {
    fontSize: 12,
    color: Colors.mediumGray,
    marginTop: 2,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: Spacing.sm,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  itemCard: {
    marginBottom: Spacing.sm,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.mediumGray,
    marginTop: Spacing.md,
  },
  listingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  listingInfo: {
    flex: 1,
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  listingType: {
    fontSize: 12,
    color: Colors.mediumGray,
    marginTop: 2,
  },
  listingActions: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.white,
    textTransform: 'capitalize',
  },
  listingDesc: {
    fontSize: 13,
    color: Colors.lightGray,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  listingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  metaText: {
    fontSize: 12,
    color: Colors.mediumGray,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.gold}20`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  featuredText: {
    fontSize: 10,
    color: Colors.gold,
    marginLeft: 2,
    fontWeight: '600',
  },
  bookingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
  bookingUser: {
    fontSize: 12,
    color: Colors.mediumGray,
    marginTop: 2,
  },
  bookingMeta: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bookingNote: {
    fontSize: 13,
    color: Colors.lightGray,
    fontStyle: 'italic',
    marginBottom: Spacing.sm,
  },
  bookingActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  rewardsOverview: {
    flexDirection: 'row',
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  rewardsStat: {
    flex: 1,
    alignItems: 'center',
  },
  rewardsValue: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.emerald,
  },
  rewardsLabel: {
    fontSize: 12,
    color: Colors.mediumGray,
    marginTop: 4,
    textAlign: 'center',
  },
  rewardsDivider: {
    width: 1,
    backgroundColor: Colors.darkBlue,
    marginHorizontal: Spacing.lg,
  },
  pointRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  pointEvent: {
    fontSize: 14,
    color: Colors.lightGray,
  },
  pointValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.emerald,
  },
  settingsCard: {
    padding: 0,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.darkBlue,
  },
  settingsLabel: {
    flex: 1,
    fontSize: 15,
    color: Colors.lightGray,
    marginLeft: Spacing.md,
  },
  envItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.darkBlue,
  },
  envLabel: {
    fontSize: 13,
    color: Colors.mediumGray,
  },
  envValue: {
    fontSize: 13,
    color: Colors.lightGray,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
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
    maxHeight: 450,
  },
  modalFooter: {
    padding: Spacing.lg,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: Colors.midnightBlue,
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
    borderWidth: 1,
    borderColor: Colors.darkBlue,
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
    paddingVertical: 8,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.midnightBlue,
    borderWidth: 1,
    borderColor: Colors.darkBlue,
  },
  chipActive: {
    backgroundColor: Colors.emerald,
    borderColor: Colors.emerald,
  },
  chipText: {
    fontSize: 12,
    color: Colors.lightGray,
  },
  chipTextActive: {
    color: Colors.deepNavy,
    fontWeight: '600',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  checkboxLabel: {
    fontSize: 14,
    color: Colors.lightGray,
    marginLeft: Spacing.sm,
  },
  listingActionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${Colors.midnightBlue}`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDetailHeader: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  userDetailAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.emerald,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  userDetailAvatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.deepNavy,
  },
  userDetailName: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.white,
  },
  userDetailEmail: {
    fontSize: 14,
    color: Colors.mediumGray,
    marginTop: 4,
  },
  userDetailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gold,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
    gap: 4,
  },
  userDetailBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.deepNavy,
  },
  userDetailCard: {
    marginBottom: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.darkBlue,
  },
  detailLabel: {
    fontSize: 13,
    color: Colors.mediumGray,
    minWidth: 80,
  },
  detailValue: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
  },
  roleActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.sm,
  },
  roleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.midnightBlue,
    borderWidth: 1,
    borderColor: Colors.darkBlue,
    gap: Spacing.sm,
  },
  roleBtnActive: {
    backgroundColor: Colors.emerald,
    borderColor: Colors.emerald,
  },
  roleBtnActiveGold: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  roleBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.lightGray,
  },
  roleBtnTextActive: {
    color: Colors.deepNavy,
  },
  bookingDetailHeader: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  bookingStatusLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  bookingStatusText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 1,
  },
  statusActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  statusActionBtn: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    gap: 6,
  },
  statusActionBtnActive: {
    opacity: 0.7,
  },
  statusActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.lightGray,
  },
  rewardEventRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardEventIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${Colors.gold}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  rewardEventInfo: {
    flex: 1,
  },
  rewardEventType: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  rewardEventNote: {
    fontSize: 12,
    color: Colors.mediumGray,
    marginTop: 2,
  },
  rewardEventUser: {
    fontSize: 11,
    color: Colors.darkGray,
    marginTop: 2,
  },
  rewardEventPoints: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.emerald,
  },
});
