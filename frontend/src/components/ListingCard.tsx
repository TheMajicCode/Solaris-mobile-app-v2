import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing, Shadows } from '../constants/colors';

interface Listing {
  listing_id: string;
  title: string;
  listing_type: string;
  short_description?: string;
  cover_image?: string;
  city?: string;
  country?: string;
  price_range_min?: number;
  price_range_max?: number;
  currency?: string;
  featured?: boolean;
  specialties?: string[];
  tags?: string[];
}

interface ListingCardProps {
  listing: Listing;
  onPress: () => void;
  onBookmark?: () => void;
}

const typeIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  practitioner: 'person',
  clinic: 'business',
  service: 'medical',
  workshop: 'school',
  place: 'location',
  program: 'calendar',
  diagnostics: 'pulse',
  kitchen: 'restaurant',
};

const typeColors: Record<string, string> = {
  practitioner: Colors.emerald,
  clinic: Colors.teal,
  service: Colors.gold,
  workshop: Colors.info,
  place: Colors.tealLight,
  program: Colors.emeraldLight,
};

export function ListingCard({ listing, onPress, onBookmark }: ListingCardProps) {
  const typeColor = typeColors[listing.listing_type] || Colors.emerald;
  const typeIcon = typeIcons[listing.listing_type] || 'star';

  return (
    <TouchableOpacity style={[styles.card, Shadows.small]} onPress={onPress} activeOpacity={0.9}>
      {listing.cover_image ? (
        <Image source={{ uri: listing.cover_image }} style={styles.image} />
      ) : (
        <View style={[styles.imagePlaceholder, { backgroundColor: `${typeColor}20` }]}>
          <Ionicons name={typeIcon} size={40} color={typeColor} />
        </View>
      )}
      
      {listing.featured && (
        <View style={styles.featuredBadge}>
          <Ionicons name="star" size={12} color={Colors.gold} />
          <Text style={styles.featuredText}>Featured</Text>
        </View>
      )}
      
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={[styles.typeBadge, { backgroundColor: `${typeColor}20` }]}>
            <Ionicons name={typeIcon} size={12} color={typeColor} />
            <Text style={[styles.typeText, { color: typeColor }]}>
              {listing.listing_type.charAt(0).toUpperCase() + listing.listing_type.slice(1)}
            </Text>
          </View>
          {onBookmark && (
            <TouchableOpacity onPress={onBookmark}>
              <Ionicons name="bookmark-outline" size={20} color={Colors.lightGray} />
            </TouchableOpacity>
          )}
        </View>
        
        <Text style={styles.title} numberOfLines={1}>{listing.title}</Text>
        
        {listing.short_description && (
          <Text style={styles.description} numberOfLines={2}>
            {listing.short_description}
          </Text>
        )}
        
        <View style={styles.footer}>
          {listing.city && (
            <View style={styles.location}>
              <Ionicons name="location-outline" size={14} color={Colors.mediumGray} />
              <Text style={styles.locationText}>{listing.city}</Text>
            </View>
          )}
          
          {listing.price_range_min && (
            <Text style={styles.price}>
              {listing.currency || '$'}{listing.price_range_min}
              {listing.price_range_max && listing.price_range_max !== listing.price_range_min && 
                ` - ${listing.price_range_max}`}
            </Text>
          )}
        </View>
        
        {listing.tags && listing.tags.length > 0 && (
          <View style={styles.tags}>
            {listing.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.midnightBlue,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  image: {
    width: '100%',
    height: 140,
    backgroundColor: Colors.darkBlue,
  },
  imagePlaceholder: {
    width: '100%',
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  featuredText: {
    color: Colors.gold,
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  content: {
    padding: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: Colors.lightGray,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 12,
    color: Colors.mediumGray,
    marginLeft: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.emerald,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.sm,
    gap: 6,
  },
  tag: {
    backgroundColor: Colors.darkBlue,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  tagText: {
    fontSize: 10,
    color: Colors.mediumGray,
  },
});
