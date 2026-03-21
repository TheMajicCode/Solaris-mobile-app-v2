import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../../src/constants/colors';
import { Button } from '../../src/components/Button';
import { useAuth } from '../../src/context/AuthContext';

export default function ProfileSetup() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  
  const [firstName, setFirstName] = useState(user?.first_name || user?.name?.split(' ')[0] || '');
  const [lastName, setLastName] = useState(user?.last_name || user?.name?.split(' ').slice(1).join(' ') || '');
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [country, setCountry] = useState(user?.country || '');
  const [city, setCity] = useState(user?.city || '');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    setLoading(true);
    await updateUser({
      first_name: firstName,
      last_name: lastName,
      display_name: displayName || firstName,
      country,
      city,
      onboarding_step: 1,
      onboarding_status: 'in_progress',
    });
    setLoading(false);
    router.push('/onboarding/goals');
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
              <View style={[styles.progressFill, { width: '20%' }]} />
            </View>
            <Text style={styles.progressText}>Step 1 of 5</Text>
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Let's get to know you</Text>
            <Text style={styles.subtitle}>
              Tell us a bit about yourself so we can personalize your journey.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.row}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>First Name</Text>
                <TextInput
                  style={styles.input}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Your first name"
                  placeholderTextColor={Colors.mediumGray}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Your last name"
                  placeholderTextColor={Colors.mediumGray}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Display Name (optional)</Text>
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="How should we call you?"
                placeholderTextColor={Colors.mediumGray}
              />
            </View>

            <View style={styles.row}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Country</Text>
                <TextInput
                  style={styles.input}
                  value={country}
                  onChangeText={setCountry}
                  placeholder="Country"
                  placeholderTextColor={Colors.mediumGray}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>City (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={city}
                  onChangeText={setCity}
                  placeholder="City"
                  placeholderTextColor={Colors.mediumGray}
                />
              </View>
            </View>
          </View>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <Ionicons name="shield-checkmark" size={24} color={Colors.emerald} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Your privacy matters</Text>
              <Text style={styles.infoText}>
                Your information is kept secure and is only used to personalize your experience.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Continue"
            onPress={handleContinue}
            icon="arrow-forward"
            loading={loading}
            disabled={!firstName.trim()}
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
  form: {
    gap: Spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  inputGroup: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.lightGray,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.midnightBlue,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    color: Colors.white,
    borderWidth: 1,
    borderColor: Colors.darkBlue,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  infoContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.emerald,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: Colors.lightGray,
    lineHeight: 18,
  },
  actions: {
    padding: Spacing.lg,
    paddingBottom: 40,
  },
});
