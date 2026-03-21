import React from 'react';
import { StyleSheet, TouchableOpacity, Text, View, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Shadows, BorderRadius, Spacing } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon,
  iconPosition = 'right',
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const sizeStyles = {
    small: { paddingVertical: 10, paddingHorizontal: 16, fontSize: 14, iconSize: 16 },
    medium: { paddingVertical: 14, paddingHorizontal: 24, fontSize: 16, iconSize: 20 },
    large: { paddingVertical: 18, paddingHorizontal: 32, fontSize: 18, iconSize: 24 },
  };

  const currentSize = sizeStyles[size];

  const renderContent = () => (
    <View style={styles.content}>
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? Colors.emerald : Colors.deepNavy} />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons 
              name={icon} 
              size={currentSize.iconSize} 
              color={variant === 'outline' || variant === 'ghost' ? Colors.emerald : Colors.deepNavy} 
              style={styles.iconLeft}
            />
          )}
          <Text style={[
            styles.text,
            { fontSize: currentSize.fontSize },
            variant === 'outline' && styles.textOutline,
            variant === 'ghost' && styles.textGhost,
            textStyle,
          ]}>
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <Ionicons 
              name={icon} 
              size={currentSize.iconSize} 
              color={variant === 'outline' || variant === 'ghost' ? Colors.emerald : Colors.deepNavy} 
              style={styles.iconRight}
            />
          )}
        </>
      )}
    </View>
  );

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        style={[fullWidth && styles.fullWidth, style]}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={disabled ? [Colors.darkGray, Colors.mediumGray] : Colors.gradientEmerald}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.button,
            { paddingVertical: currentSize.paddingVertical, paddingHorizontal: currentSize.paddingHorizontal },
            Shadows.medium,
          ]}
        >
          {renderContent()}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        { paddingVertical: currentSize.paddingVertical, paddingHorizontal: currentSize.paddingHorizontal },
        variant === 'secondary' && styles.secondary,
        variant === 'outline' && styles.outline,
        variant === 'ghost' && styles.ghost,
        disabled && styles.disabled,
        fullWidth && styles.fullWidth,
        style,
      ]}
      activeOpacity={0.8}
    >
      {renderContent()}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    color: Colors.deepNavy,
  },
  textOutline: {
    color: Colors.emerald,
  },
  textGhost: {
    color: Colors.emerald,
  },
  secondary: {
    backgroundColor: Colors.darkBlue,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.emerald,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  iconLeft: {
    marginRight: Spacing.sm,
  },
  iconRight: {
    marginLeft: Spacing.sm,
  },
});
