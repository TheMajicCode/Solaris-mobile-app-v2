import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Animated, Dimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../src/constants/colors';
import { useAuth } from '../src/context/AuthContext';
import { Button } from '../src/components/Button';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// Onboarding slides data
const slides = [
  {
    id: 'welcome',
    title: 'Welcome to',
    highlight: 'Solaris',
    subtitle: 'A guided journey to better health, clarity, and momentum.',
    icon: 'sunny-outline',
  },
  {
    id: 'golden-age',
    title: 'Enter the',
    highlight: 'Golden Age',
    subtitle: 'Experience a sanctuary of precision and wellness. Where futuristic technology meets the warmth of human healing.',
    icon: 'sparkles-outline',
  },
  {
    id: 'heal-learn-earn',
    title: 'Heal • Learn • Earn',
    highlight: '',
    subtitle: 'Reconnect with your body. Understand your patterns. Build momentum and meaningful progress.',
    icon: 'heart-outline',
  },
  {
    id: 'solaris-method',
    title: 'The Solaris',
    highlight: 'Method',
    subtitle: 'Mental • Emotional • Physical • Spiritual\n\nA whole-person approach to your wellbeing.',
    icon: 'infinite-outline',
  },
  {
    id: 'body-speaking',
    title: 'Your Body is',
    highlight: 'Speaking',
    subtitle: 'You are not broken.\nYour body is communicating.\nSolaris helps you listen.',
    icon: 'pulse-outline',
  },
];

export default function SplashScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showSlides, setShowSlides] = useState(false);
  
  // Animations
  const logoOpacity = React.useRef(new Animated.Value(0)).current;
  const logoScale = React.useRef(new Animated.Value(0.8)).current;
  const slideOpacity = React.useRef(new Animated.Value(0)).current;
  const slideTranslate = React.useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Logo animation
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // After logo animation, show slides or navigate
    const timer = setTimeout(() => {
      if (!loading) {
        if (user) {
          if (user.onboarding_status === 'completed') {
            router.replace('/(tabs)');
          } else {
            router.replace('/onboarding/profile');
          }
        } else {
          setShowSlides(true);
          animateSlide();
        }
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [loading, user]);

  const animateSlide = () => {
    slideOpacity.setValue(0);
    slideTranslate.setValue(30);
    Animated.parallel([
      Animated.timing(slideOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideTranslate, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
      animateSlide();
    } else {
      router.push('/auth/login');
    }
  };

  const skipToAuth = () => {
    router.push('/auth/login');
  };

  const slide = slides[currentSlide];

  return (
    <LinearGradient colors={Colors.gradientPrimary} style={styles.container}>
      {/* Background glow effects */}
      <View style={styles.glowContainer}>
        <View style={[styles.glow, styles.glowTop]} />
        <View style={[styles.glow, styles.glowBottom]} />
      </View>

      {!showSlides ? (
        // Splash Logo
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <View style={styles.logoCircle}>
            <Ionicons name="sunny" size={60} color={Colors.emerald} />
          </View>
          <Text style={styles.logoText}>SOLARIS</Text>
          <Text style={styles.logoSubtext}>HOLISTIC HEALTH</Text>
        </Animated.View>
      ) : (
        // Onboarding Slides
        <View style={styles.slideContainer}>
          <Animated.View
            style={[
              styles.slideContent,
              {
                opacity: slideOpacity,
                transform: [{ translateY: slideTranslate }],
              },
            ]}
          >
            <View style={styles.iconCircle}>
              <Ionicons name={slide.icon as any} size={50} color={Colors.emerald} />
            </View>
            
            <Text style={styles.slideTitle}>
              {slide.title}{' '}
              {slide.highlight && <Text style={styles.highlight}>{slide.highlight}</Text>}
            </Text>
            
            <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
          </Animated.View>

          {/* Progress dots */}
          <View style={styles.dotsContainer}>
            {slides.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentSlide && styles.dotActive,
                ]}
              />
            ))}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              title={currentSlide === slides.length - 1 ? 'Begin Journey' : 'Continue'}
              onPress={nextSlide}
              icon="arrow-forward"
              fullWidth
            />
            
            {currentSlide < slides.length - 1 && (
              <Button
                title="Skip"
                onPress={skipToAuth}
                variant="ghost"
                style={styles.skipButton}
              />
            )}
          </View>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>AUTONOMOUS HEALTH PROTOCOL 4.0</Text>
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
  glowContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  glowTop: {
    top: -100,
    right: -50,
    backgroundColor: Colors.glowEmerald,
  },
  glowBottom: {
    bottom: -100,
    left: -50,
    backgroundColor: Colors.glowGold,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.emerald,
    letterSpacing: 8,
  },
  logoSubtext: {
    fontSize: 12,
    color: Colors.teal,
    letterSpacing: 4,
    marginTop: 8,
  },
  slideContainer: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 32,
    paddingTop: 80,
    paddingBottom: 40,
  },
  slideContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  slideTitle: {
    fontSize: 32,
    fontWeight: '300',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 16,
  },
  highlight: {
    color: Colors.emerald,
    fontWeight: '600',
  },
  slideSubtitle: {
    fontSize: 16,
    color: Colors.lightGray,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 16,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.darkBlue,
    marginHorizontal: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.emerald,
  },
  actions: {
    alignItems: 'center',
  },
  skipButton: {
    marginTop: 16,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
  },
  footerText: {
    fontSize: 10,
    color: Colors.mediumGray,
    letterSpacing: 2,
  },
});
