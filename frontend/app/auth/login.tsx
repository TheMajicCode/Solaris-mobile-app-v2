import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../../src/constants/colors';
import { Button } from '../../src/components/Button';
import { useAuth } from '../../src/context/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, loading } = useAuth();

  const handleGoogleSignIn = async () => {
    await signIn();
  };

  return (
    <LinearGradient colors={Colors.gradientPrimary} style={styles.container}>
      {/* Background glow */}
      <View style={styles.glowContainer}>
        <View style={[styles.glow, styles.glowTop]} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Logo */}
        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <Ionicons name="sunny" size={50} color={Colors.emerald} />
          </View>
          <Text style={styles.logoText}>SOLARIS</Text>
          <Text style={styles.tagline}>Begin Your Healing Journey</Text>
        </View>

        {/* Auth Card */}
        <View style={styles.authCard}>
          <Text style={styles.cardTitle}>Welcome</Text>
          <Text style={styles.cardSubtitle}>
            Sign in with your Google account to start your personalized wellness journey.
          </Text>

          <TouchableOpacity 
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
            activeOpacity={0.9}
          >
            <View style={styles.googleIcon}>
              <Ionicons name="logo-google" size={20} color={Colors.white} />
            </View>
            <Text style={styles.googleText}>Continue with Google</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Secure Authentication</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.features}>
            <View style={styles.featureRow}>
              <Ionicons name="shield-checkmark" size={18} color={Colors.emerald} />
              <Text style={styles.featureText}>Your data is encrypted and secure</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="lock-closed" size={18} color={Colors.emerald} />
              <Text style={styles.featureText}>We never share your information</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="heart" size={18} color={Colors.emerald} />
              <Text style={styles.featureText}>Personalized wellness insights</Text>
            </View>
          </View>
        </View>

        {/* Terms */}
        <Text style={styles.terms}>
          By continuing, you agree to our{' '}
          <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  glowContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: Colors.glowEmerald,
  },
  glowTop: {
    top: -100,
    right: -100,
  },
  content: {
    flexGrow: 1,
    padding: Spacing.lg,
    paddingTop: 60,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.midnightBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.emerald,
    letterSpacing: 6,
  },
  tagline: {
    fontSize: 14,
    color: Colors.lightGray,
    marginTop: Spacing.sm,
  },
  authCard: {
    backgroundColor: Colors.midnightBlue,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  cardSubtitle: {
    fontSize: 14,
    color: Colors.lightGray,
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.darkBlue,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.emerald,
  },
  googleIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.midnightBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  googleText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.darkBlue,
  },
  dividerText: {
    fontSize: 11,
    color: Colors.mediumGray,
    marginHorizontal: Spacing.md,
    letterSpacing: 1,
  },
  features: {
    gap: Spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 13,
    color: Colors.lightGray,
    marginLeft: Spacing.sm,
  },
  terms: {
    fontSize: 12,
    color: Colors.mediumGray,
    textAlign: 'center',
    lineHeight: 20,
  },
  termsLink: {
    color: Colors.emerald,
  },
});
