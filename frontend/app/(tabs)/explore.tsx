import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, TouchableOpacity, RefreshControl, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../../src/constants/colors';
import { ListingCard } from '../../src/components/ListingCard';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { useAuth } from '../../src/context/AuthContext';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const categories = [
  { id: 'all', label: 'All', icon: 'grid-outline' },
  { id: 'practitioner', label: 'Practitioners', icon: 'person-outline' },
  { id: 'clinic', label: 'Clinics', icon: 'business-outline' },
  { id: 'service', label: 'Services', icon: 'medical-outline' },
  { id: 'workshop', label: 'Workshops', icon: 'school-outline' },
  { id: 'place', label: 'Places', icon: 'location-outline' },
  { id: 'program', label: 'Programs', icon: 'calendar-outline' },
];

export default function ExploreScreen() {
  const router = useRouter();
  const { sessionToken } = useAuth();
  const [listings, setListings] = useState<any[]>([]);
  const [filteredListings, setFilteredListings] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingNote, setBookingNote] = useState('');
  const [bookingDate, setBookingDate] = useState('');

  useEffect(() => {
    fetchListings();
  }, []);

  useEffect(() => {
    filterListings();
  }, [listings, selectedCategory, searchQuery]);

  const fetchListings = async () => {
    try {
      const response = await fetch(`${API_URL}/api/listings`);
      if (response.ok) {
        const data = await response.json();
        setListings(data);
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
    }
  };

  const filterListings = () => {
    let filtered = listings;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(l => l.listing_type === selectedCategory);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(l => 
        l.title.toLowerCase().includes(query) ||
        l.short_description?.toLowerCase().includes(query) ||
        l.tags?.some((t: string) => t.toLowerCase().includes(query))
      );
    }
    
    setFilteredListings(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchListings();
    setRefreshing(false);
  };

  const handleListingPress = (listing: any) => {
    setSelectedListing(listing);
  };

  const handleBooking = async () => {
    if (!selectedListing) return;
    
    try {
      const response = await fetch(`${API_URL}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          listing_id: selectedListing.listing_id,
          preferred_date: bookingDate,
          note: bookingNote,
        }),
      });
      
      if (response.ok) {
        setShowBookingModal(false);
        setBookingNote('');
        setBookingDate('');
        setSelectedListing(null);
        // Show success
      }
    } catch (error) {
      console.error('Error creating booking:', error);
    }
  };

  const featuredListings = listings.filter(l => l.featured);

  return (
    <LinearGradient colors={Colors.gradientPrimary} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Explore</Text>
        <Text style={styles.subtitle}>Discover practitioners, clinics & services</Text>
        
        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.mediumGray} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search listings..."
            placeholderTextColor={Colors.mediumGray}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={Colors.mediumGray} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categories */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryChip,
              selectedCategory === cat.id && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Ionicons 
              name={cat.icon as any} 
              size={16} 
              color={selectedCategory === cat.id ? Colors.deepNavy : Colors.lightGray} 
            />
            <Text style={[
              styles.categoryLabel,
              selectedCategory === cat.id && styles.categoryLabelActive,
            ]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.emerald} />
        }
      >
        {/* Featured Section */}
        {selectedCategory === 'all' && featuredListings.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured</Text>
              <Ionicons name="star" size={16} color={Colors.gold} />
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredContainer}
            >
              {featuredListings.map(listing => (
                <View key={listing.listing_id} style={styles.featuredCard}>
                  <ListingCard 
                    listing={listing} 
                    onPress={() => handleListingPress(listing)}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* All Listings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === 'all' ? 'All Listings' : categories.find(c => c.id === selectedCategory)?.label}
          </Text>
          {filteredListings.length === 0 ? (
            <Card variant="default" style={styles.emptyCard}>
              <Ionicons name="compass-outline" size={48} color={Colors.mediumGray} />
              <Text style={styles.emptyText}>No listings found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
            </Card>
          ) : (
            filteredListings.map(listing => (
              <ListingCard 
                key={listing.listing_id}
                listing={listing} 
                onPress={() => handleListingPress(listing)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Listing Detail Modal */}
      <Modal
        visible={!!selectedListing}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedListing(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedListing?.title}</Text>
                <TouchableOpacity onPress={() => setSelectedListing(null)}>
                  <Ionicons name="close" size={24} color={Colors.white} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.listingType}>
                  <Ionicons name="pricetag" size={14} color={Colors.emerald} />
                  <Text style={styles.listingTypeText}>
                    {selectedListing?.listing_type?.charAt(0).toUpperCase() + selectedListing?.listing_type?.slice(1)}
                  </Text>
                </View>

                {selectedListing?.short_description && (
                  <Text style={styles.description}>{selectedListing.short_description}</Text>
                )}

                {selectedListing?.full_description && (
                  <Text style={styles.fullDescription}>{selectedListing.full_description}</Text>
                )}

                {selectedListing?.city && (
                  <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={18} color={Colors.teal} />
                    <Text style={styles.infoText}>
                      {selectedListing.city}{selectedListing.country ? `, ${selectedListing.country}` : ''}
                    </Text>
                  </View>
                )}

                {selectedListing?.languages && selectedListing.languages.length > 0 && (
                  <View style={styles.infoRow}>
                    <Ionicons name="language-outline" size={18} color={Colors.teal} />
                    <Text style={styles.infoText}>{selectedListing.languages.join(', ')}</Text>
                  </View>
                )}

                {selectedListing?.price_range_min && (
                  <View style={styles.infoRow}>
                    <Ionicons name="cash-outline" size={18} color={Colors.gold} />
                    <Text style={styles.infoText}>
                      {selectedListing.currency || '$'}{selectedListing.price_range_min}
                      {selectedListing.price_range_max && selectedListing.price_range_max !== selectedListing.price_range_min && 
                        ` - ${selectedListing.price_range_max}`}
                    </Text>
                  </View>
                )}

                {selectedListing?.specialties && selectedListing.specialties.length > 0 && (
                  <View style={styles.tagsSection}>
                    <Text style={styles.tagsLabel}>Specialties</Text>
                    <View style={styles.tagsContainer}>
                      {selectedListing.specialties.map((spec: string, idx: number) => (
                        <View key={idx} style={styles.tag}>
                          <Text style={styles.tagText}>{spec}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>

            {selectedListing?.booking_enabled && (
              <View style={styles.modalFooter}>
                <Button
                  title="Request Booking"
                  onPress={() => setShowBookingModal(true)}
                  icon="calendar-outline"
                  fullWidth
                />
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Booking Modal */}
      <Modal
        visible={showBookingModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBookingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bookingModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Booking</Text>
              <TouchableOpacity onPress={() => setShowBookingModal(false)}>
                <Ionicons name="close" size={24} color={Colors.white} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.bookingFor}>Booking: {selectedListing?.title}</Text>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Preferred Date</Text>
                <TextInput
                  style={styles.input}
                  value={bookingDate}
                  onChangeText={setBookingDate}
                  placeholder="e.g., Next week, March 15th"
                  placeholderTextColor={Colors.mediumGray}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Notes or Intentions</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={bookingNote}
                  onChangeText={setBookingNote}
                  placeholder="Share what you'd like to focus on..."
                  placeholderTextColor={Colors.mediumGray}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <Button
                title="Submit Request"
                onPress={handleBooking}
                icon="checkmark"
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
    padding: Spacing.lg,
    paddingTop: 60,
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
    marginBottom: Spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.midnightBlue,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
  },
  searchInput: {
    flex: 1,
    padding: Spacing.md,
    fontSize: 15,
    color: Colors.white,
  },
  categoriesContainer: {
    maxHeight: 50,
  },
  categoriesContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.midnightBlue,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.xl,
    marginRight: Spacing.sm,
  },
  categoryChipActive: {
    backgroundColor: Colors.emerald,
  },
  categoryLabel: {
    fontSize: 13,
    color: Colors.lightGray,
    marginLeft: 6,
  },
  categoryLabelActive: {
    color: Colors.deepNavy,
    fontWeight: '600',
  },
  content: {
    padding: Spacing.lg,
    paddingTop: Spacing.md,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    marginRight: Spacing.sm,
  },
  featuredContainer: {
    paddingRight: Spacing.lg,
  },
  featuredCard: {
    width: 280,
    marginRight: Spacing.md,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.mediumGray,
    marginTop: 4,
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
    maxHeight: '85%',
  },
  bookingModalContent: {
    backgroundColor: Colors.deepNavy,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
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
    flex: 1,
  },
  modalBody: {
    padding: Spacing.lg,
  },
  listingType: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.emerald}20`,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
  },
  listingTypeText: {
    fontSize: 12,
    color: Colors.emerald,
    fontWeight: '600',
    marginLeft: 4,
  },
  description: {
    fontSize: 16,
    color: Colors.lightGray,
    lineHeight: 24,
    marginBottom: Spacing.md,
  },
  fullDescription: {
    fontSize: 14,
    color: Colors.mediumGray,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  infoText: {
    fontSize: 14,
    color: Colors.lightGray,
    marginLeft: Spacing.sm,
  },
  tagsSection: {
    marginTop: Spacing.md,
  },
  tagsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.mediumGray,
    marginBottom: Spacing.sm,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tag: {
    backgroundColor: Colors.midnightBlue,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  tagText: {
    fontSize: 12,
    color: Colors.lightGray,
  },
  modalFooter: {
    padding: Spacing.lg,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: Colors.midnightBlue,
  },
  bookingFor: {
    fontSize: 14,
    color: Colors.emerald,
    marginBottom: Spacing.lg,
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
  input: {
    backgroundColor: Colors.midnightBlue,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 15,
    color: Colors.white,
  },
  textArea: {
    minHeight: 100,
  },
});
