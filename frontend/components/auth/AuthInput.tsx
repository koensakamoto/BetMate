import React, { useState } from 'react';
import { Text, View, TextInput, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface AuthInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  error?: string;
  isValid?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: string;
  maxLength?: number;
  showPasswordToggle?: boolean;
  editable?: boolean;
}

export default function AuthInput({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  isValid,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoComplete,
  maxLength,
  showPasswordToggle = false,
  editable = true
}: AuthInputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const hasError = error && error.length > 0;
  const showSuccess = isValid && value.length > 0 && !hasError;
  const actualSecureTextEntry = secureTextEntry && !isPasswordVisible;

  const accessibilityLabelText = hasError
    ? `${label}, ${error}`
    : showSuccess
      ? `${label}, valid`
      : label;

  return (
    <View style={{ marginBottom: 12 }}>
      <Text
        style={{
          fontSize: 13,
          fontWeight: '500',
          color: 'rgba(255, 255, 255, 0.8)',
          marginBottom: 5
        }}
        accessible={false}
      >
        {label}
      </Text>

      <View style={{
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: hasError
          ? '#EF4444'
          : showSuccess
            ? '#22C55E'
            : isFocused
              ? '#00D4AA'
              : 'rgba(255, 255, 255, 0.15)',
        paddingHorizontal: 14,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center'
      }}>
        <TextInput
          style={{
            flex: 1,
            fontSize: 15,
            color: editable ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
            fontWeight: '400'
          }}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(255, 255, 255, 0.4)"
          secureTextEntry={actualSecureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          maxLength={maxLength}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={editable}
          accessible={true}
          accessibilityLabel={accessibilityLabelText}
          accessibilityHint={placeholder}
          accessibilityState={{
            disabled: !editable,
          }}
        />

        {/* Status Icons */}
        {showPasswordToggle && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={{ marginLeft: 10 }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
            accessibilityHint="Double tap to toggle password visibility"
          >
            <MaterialIcons
              name={isPasswordVisible ? 'visibility-off' : 'visibility'}
              size={18}
              color="rgba(255, 255, 255, 0.6)"
              accessible={false}
            />
          </TouchableOpacity>
        )}

        {!showPasswordToggle && showSuccess && (
          <View style={{ marginLeft: 10 }} accessible={false}>
            <MaterialIcons
              name="check-circle"
              size={18}
              color="#22C55E"
              accessible={false}
            />
          </View>
        )}

        {!showPasswordToggle && hasError && (
          <View style={{ marginLeft: 10 }} accessible={false}>
            <MaterialIcons
              name="error"
              size={18}
              color="#EF4444"
              accessible={false}
            />
          </View>
        )}
      </View>

      {/* Error Message */}
      {hasError && (
        <Text
          style={{
            fontSize: 12,
            color: '#EF4444',
            marginTop: 4,
            marginLeft: 4
          }}
          accessible={true}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      )}

      {/* Character Count - Hidden to save space */}
    </View>
  );
}