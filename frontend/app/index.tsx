import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, Animated, Dimensions, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode } from 'expo-av';
import { Colors } from '../src/constants/colors';
import { useAuth } from '../src/context/AuthContext';
import { Button } from '../src/components/Button';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const SOLARIS_LOGO = require('../assets/images/solaris-logo.png');
const SOLARIS_VIDEO = require('../assets/images/solaris-splash.mp4');

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
  const [videoFinished, setVideoFinished] = useState(false);
  const hasNavigated = useRef(false);
  
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const slideOpacity = useRef(new Animated.Value(0)).current;
  const slideTranslate = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (loading || hasNavigated.current) return;

    const timer = setTimeout(() => {
      if (user) {
        hasNavigated.current = true;
        if (user.onboarding_status === 'completed') {
          router.replace('/(tabs)');
        } else {
          router.replace('/onboarding/profile');
        }
      } else {
        setShowSlides(true);
        animateSlide();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [loading]);

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
    <View style={styles.container}>
      <LinearGradient colors={['#000000', '#0A1628', '#0F2340']} style={StyleSheet.absoluteFillObject} />
      
      {!showSlides ? (
        <Animated.View
          style={[
            styles.splashContainer,
            { opacity: logoOpacity, transform: [{ scale: logoScale }] },
          ]}
        >
          <Video
            source={SOLARIS_VIDEO}
            style={styles.splashVideo}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay
            isLooping={false}
            isMuted
            onPlaybackStatusUpdate={(status) => {
              if (status.isLoaded && status.didJustFinish) {
                setVideoFinished(true);
              }
            }}
          />
          {videoFinished && (
            <Animated.View style={styles.splashLogoFallback}>
              <Image source={SOLARIS_LOGO} style={styles.logoImage} resizeMode="contain" />
            </Animated.View>
          )}
        </Animated.View>
      ) : (
        <View style={styles.slideContainer}>
          <Animated.View
            style={[
              styles.slideContent,
              { opacity: slideOpacity, transform: [{ translateY: slideTranslate }] },
            ]}
          >
            <Image source={SOLARIS_LOGO} style={styles.slideLogoSmall} resizeMode="contain" />
            
            <Text style={styles.slideTitle}>
              {slide.title}{' '}
              {slide.highlight ? <Text style={styles.highlight}>{slide.highlight}</Text> : null}
            </Text>
            
            <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
          </Animated.View>

          <View style={styles.dotsContainer}>
            {slides.map((_, index) => (
              <View key={index} style={[styles.dot, index === currentSlide && styles.dotActive]} />
            ))}
          </View>

          <View style={styles.actions}>
            <Button
              title={currentSlide === slides.length - 1 ? 'Begin Journey' : 'Continue'}
              onPress={nextSlide}
              icon="arrow-forward"
              fullWidth
            />
            {currentSlide < slides.length - 1 && (
              <Button title="Skip" onPress={skipToAuth} variant="ghost" style={styles.skipButton} />
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  splashContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashVideo: {
    width: width * 0.7,
    height: width * 0.7,
  },
  splashLogoFallback: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: width * 0.55,
    height: width * 0.55,
  },
  slideLogoSmall: {
    width: 80,
    height: 80,
    marginBottom: 24,
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
});
