import React, { useState } from 'react';
import { Text, View, TextInput, TouchableOpacity, TextStyle, ViewStyle, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export interface SettingsInputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  error?: string;
  isValid?: boolean;
  isLoading?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  maxLength?: number;
  showPasswordToggle?: boolean;
  editable?: boolean;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  multiline?: boolean;
  numberOfLines?: number;
  prefix?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

export default function SettingsInput({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  isValid,
  isLoading,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoCorrect = false,
  maxLength,
  showPasswordToggle = false,
  editable = true,
  style,
  inputStyle,
  multiline = false,
  numberOfLines = 1,
  prefix,
  onFocus,
  onBlur,
}: SettingsInputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const hasError = error && error.length > 0;
  const showSuccess = isValid && value.length > 0 && !hasError;
  const actualSecureTextEntry = secureTextEntry && !isPasswordVisible;

  const getBorderColor = () => {
    if (hasError) return 'rgba(239, 68, 68, 0.6)';
    if (showSuccess) return 'rgba(0, 212, 170, 0.6)';
    if (isFocused) return 'rgba(255, 255, 255, 0.3)';
    return 'rgba(255, 255, 255, 0.1)';
  };

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  return (
    <View style={[{ marginBottom: 20 }, style]}>
      {label && (
        <Text
          style={{
            fontSize: 13,
            fontWeight: '500',
            color: 'rgba(255, 255, 255, 0.5)',
            marginBottom: 6
          }}
        >
          {label}
        </Text>
      )}

      <View style={{
        borderBottomWidth: 1,
        borderBottomColor: getBorderColor(),
        paddingVertical: multiline ? 10 : 8,
        flexDirection: 'row',
        alignItems: multiline ? 'flex-start' : 'center',
      }}>
        {prefix && (
          <Text style={{
            fontSize: 16,
            color: 'rgba(255, 255, 255, 0.4)',
            fontWeight: '500',
            marginRight: 2
          }}>
            {prefix}
          </Text>
        )}

        <TextInput
          style={[{
            flex: 1,
            fontSize: 16,
            color: editable ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
            fontWeight: '400',
            paddingVertical: 0,
            textAlignVertical: multiline ? 'top' : 'center',
          }, inputStyle]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(255, 255, 255, 0.4)"
          secureTextEntry={actualSecureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          maxLength={maxLength}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={editable}
          multiline={multiline}
          numberOfLines={numberOfLines}
        />

        {/* Loading indicator */}
        {isLoading && (
          <ActivityIndicator size="small" color="#00D4AA" style={{ marginLeft: 8 }} />
        )}

        {/* Password toggle */}
        {showPasswordToggle && !isLoading && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={{ marginLeft: 8, padding: 2 }}
          >
            <MaterialIcons
              name={isPasswordVisible ? 'visibility-off' : 'visibility'}
              size={18}
              color="rgba(255, 255, 255, 0.4)"
            />
          </TouchableOpacity>
        )}

        {/* Success indicator */}
        {!showPasswordToggle && !isLoading && showSuccess && (
          <MaterialIcons
            name="check-circle"
            size={18}
            color="#00D4AA"
            style={{ marginLeft: 8 }}
          />
        )}

        {/* Error indicator */}
        {!showPasswordToggle && !isLoading && hasError && (
          <MaterialIcons
            name="error-outline"
            size={18}
            color="#EF4444"
            style={{ marginLeft: 8 }}
          />
        )}
      </View>

      {/* Error Message */}
      {hasError && (
        <Text
          style={{
            fontSize: 12,
            color: '#EF4444',
            marginTop: 6,
            fontWeight: '400'
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}
