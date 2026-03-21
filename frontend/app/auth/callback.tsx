import React, { useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../src/constants/colors';
import { useAuth } from '../../src/context/AuthContext';

export default function AuthCallback() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Auth context handles the callback automatically
    // Just wait for user to be set
    if (!loading && user) {
      if (user.onboarding_status === 'completed') {
        router.replace('/(tabs)');
      } else {
        router.replace('/onboarding/profile');
      }
    }
  }, [user, loading]);

  return (
    <LinearGradient colors={Colors.gradientPrimary} style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color={Colors.emerald} />
        <Text style={styles.text}>Completing sign in...</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    color: Colors.lightGray,
    marginTop: 16,
  },
});
