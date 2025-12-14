import React, { useState } from 'react';
import { Text, View, TextInput, TouchableOpacity, TextStyle, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export interface AuthInputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  error?: string;
  isValid?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: 'url' | 'username' | 'name' | 'email' | 'password' | 'off' | 'additional-name' | 'address-line1' | 'address-line2' | 'birthdate-day' | 'birthdate-full' | 'birthdate-month' | 'birthdate-year' | 'cc-csc' | 'cc-exp' | 'cc-exp-day' | 'cc-exp-month' | 'cc-exp-year' | 'cc-number' | 'country' | 'current-password' | 'family-name' | 'given-name' | 'honorific-prefix' | 'honorific-suffix' | 'name-family' | 'name-given' | 'name-middle' | 'name-middle-initial' | 'name-prefix' | 'name-suffix' | 'new-password' | 'nickname' | 'one-time-code' | 'organization' | 'organization-title' | 'postal-address' | 'postal-address-country' | 'postal-address-extended' | 'postal-address-extended-postal-code' | 'postal-address-locality' | 'postal-address-region' | 'postal-code' | 'street-address' | 'sms-otp' | 'tel' | 'tel-country-code' | 'tel-device' | 'tel-national' | 'username-new';
  maxLength?: number;
  showPasswordToggle?: boolean;
  editable?: boolean;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  multiline?: boolean;
  numberOfLines?: number;
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
  editable = true,
  style,
  inputStyle,
  multiline = false,
  numberOfLines = 1,
}: AuthInputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const hasError = error && error.length > 0;
  const showSuccess = isValid && value.length > 0 && !hasError;
  const actualSecureTextEntry = secureTextEntry && !isPasswordVisible;

  const accessibilityLabelText = hasError
    ? `${label || 'Input'}, ${error}`
    : showSuccess
      ? `${label || 'Input'}, valid`
      : label || 'Input';

  return (
    <View style={[{ marginBottom: 12 }, style]}>
      {label && (
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
      )}

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
          style={[{
            flex: 1,
            fontSize: 15,
            color: editable ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
            fontWeight: '400'
          }, inputStyle]}
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
          multiline={multiline}
          numberOfLines={numberOfLines}
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