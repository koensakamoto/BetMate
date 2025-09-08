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
  showPasswordToggle = false
}: AuthInputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const hasError = error && error.length > 0;
  const showSuccess = isValid && value.length > 0 && !hasError;
  const actualSecureTextEntry = secureTextEntry && !isPasswordVisible;

  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{
        fontSize: 14,
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: 8
      }}>
        {label}
      </Text>
      
      <View style={{
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: hasError 
          ? '#EF4444' 
          : showSuccess 
            ? '#22C55E' 
            : isFocused 
              ? '#00D4AA' 
              : 'rgba(255, 255, 255, 0.15)',
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center'
      }}>
        <TextInput
          style={{
            flex: 1,
            fontSize: 16,
            color: '#ffffff',
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
        />
        
        {/* Status Icons */}
        {showPasswordToggle && (
          <TouchableOpacity 
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={{ marginLeft: 12 }}
          >
            <MaterialIcons 
              name={isPasswordVisible ? 'visibility-off' : 'visibility'} 
              size={20} 
              color="rgba(255, 255, 255, 0.6)" 
            />
          </TouchableOpacity>
        )}
        
        {!showPasswordToggle && showSuccess && (
          <View style={{ marginLeft: 12 }}>
            <MaterialIcons 
              name="check-circle" 
              size={20} 
              color="#22C55E" 
            />
          </View>
        )}
        
        {!showPasswordToggle && hasError && (
          <View style={{ marginLeft: 12 }}>
            <MaterialIcons 
              name="error" 
              size={20} 
              color="#EF4444" 
            />
          </View>
        )}
      </View>
      
      {/* Error Message */}
      {hasError && (
        <Text style={{
          fontSize: 13,
          color: '#EF4444',
          marginTop: 6,
          marginLeft: 4
        }}>
          {error}
        </Text>
      )}
      
      {/* Character Count */}
      {maxLength && value.length > 0 && (
        <Text style={{
          fontSize: 12,
          color: 'rgba(255, 255, 255, 0.4)',
          textAlign: 'right',
          marginTop: 4
        }}>
          {value.length}/{maxLength}
        </Text>
      )}
    </View>
  );
}