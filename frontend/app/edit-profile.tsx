import React, { useState } from 'react';
import { Text, View, TouchableOpacity, ScrollView, StatusBar, Image, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

const icon = require("../assets/images/icon.png");

export default function EditProfile() {
  const insets = useSafeAreaInsets();
  const [formData, setFormData] = useState({
    name: 'John Doe',
    username: 'johnbets2024',
    bio: 'Professional sports bettor | 85% win rate | Follow for winning tips 🏆',
    email: 'john.doe@email.com',
    phone: '+1 (555) 123-4567',
    location: 'Las Vegas, NV'
  });
  const [hasChanges, setHasChanges] = useState(false);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    // TODO: Implement API call to save profile
    Alert.alert('Profile Updated', 'Your profile has been successfully updated.', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => router.back() }
        ]
      );
    } else {
      router.back();
    }
  };

  const InputField = ({ 
    label, 
    value, 
    onChangeText, 
    placeholder,
    multiline = false,
    maxLength,
    keyboardType = 'default'
  }: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    multiline?: boolean;
    maxLength?: number;
    keyboardType?: any;
  }) => (
    <View style={{ marginBottom: 16 }}>
      <Text style={{
        fontSize: 13,
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: 6
      }}>
        {label}
      </Text>
      <View style={{
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderRadius: 8,
        borderWidth: 0.5,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: multiline ? 10 : 12
      }}>
        <TextInput
          style={{
            fontSize: 15,
            color: '#ffffff',
            fontWeight: '400',
            minHeight: multiline ? 60 : 'auto',
            textAlignVertical: multiline ? 'top' : 'center'
          }}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(255, 255, 255, 0.4)"
          multiline={multiline}
          maxLength={maxLength}
          keyboardType={keyboardType}
        />
        {maxLength && (
          <Text style={{
            fontSize: 11,
            color: 'rgba(255, 255, 255, 0.3)',
            textAlign: 'right',
            marginTop: 4
          }}>
            {value.length}/{maxLength}
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0a0a0f"
        translucent={true}
      />
      
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={{
          paddingTop: insets.top + 20,
          paddingHorizontal: 20,
          paddingBottom: 16,
          borderBottomWidth: 0.5,
          borderBottomColor: 'rgba(255, 255, 255, 0.08)',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity 
              onPress={handleCancel}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 16
              }}
            >
              <MaterialIcons 
                name="close" 
                size={18} 
                color="#ffffff" 
              />
            </TouchableOpacity>
            
            <Text style={{
              fontSize: 24,
              fontWeight: '600',
              color: '#ffffff'
            }}>
              Edit Profile
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleSave}
            style={{
              backgroundColor: hasChanges ? '#00D4AA' : 'rgba(255, 255, 255, 0.08)',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              opacity: hasChanges ? 1 : 0.5
            }}
            disabled={!hasChanges}
          >
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: hasChanges ? '#000000' : 'rgba(255, 255, 255, 0.6)'
            }}>
              Save
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ 
            paddingHorizontal: 20,
            paddingVertical: 16
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Photo Section */}
          <View style={{
            alignItems: 'center',
            marginBottom: 24
          }}>
            <View style={{ position: 'relative', marginBottom: 8 }}>
              <Image 
                source={icon}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40
                }}
              />
              <TouchableOpacity
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: '#00D4AA',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 2,
                  borderColor: '#0a0a0f'
                }}
              >
                <MaterialIcons 
                  name="camera-alt" 
                  size={12} 
                  color="#000000" 
                />
              </TouchableOpacity>
            </View>
            <TouchableOpacity>
              <Text style={{
                fontSize: 13,
                fontWeight: '500',
                color: '#00D4AA'
              }}>
                Change Photo
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <InputField
            label="Display Name"
            value={formData.name}
            onChangeText={(text) => updateField('name', text)}
            placeholder="Enter your display name"
            maxLength={50}
          />

          <InputField
            label="Username"
            value={formData.username}
            onChangeText={(text) => updateField('username', text.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            placeholder="Enter your username"
            maxLength={30}
          />

          <InputField
            label="Bio"
            value={formData.bio}
            onChangeText={(text) => updateField('bio', text)}
            placeholder="Tell people about yourself..."
            multiline={true}
            maxLength={150}
          />

          <View style={{
            borderTopWidth: 0.5,
            borderTopColor: 'rgba(255, 255, 255, 0.1)',
            paddingTop: 16,
            marginTop: 4,
            marginBottom: 8
          }}>
            <Text style={{
              fontSize: 14,
              fontWeight: '500',
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: 16,
              textAlign: 'left'
            }}>
              Contact Information
            </Text>
          </View>

          <InputField
            label="Email"
            value={formData.email}
            onChangeText={(text) => updateField('email', text)}
            placeholder="Enter your email"
            keyboardType="email-address"
          />

          <InputField
            label="Phone"
            value={formData.phone}
            onChangeText={(text) => updateField('phone', text)}
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
          />

          <InputField
            label="Location"
            value={formData.location}
            onChangeText={(text) => updateField('location', text)}
            placeholder="Enter your location"
            maxLength={50}
          />

          {/* Privacy Note */}
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            padding: 12,
            borderRadius: 8,
            borderWidth: 0.5,
            borderColor: 'rgba(255, 255, 255, 0.08)',
            marginBottom: 16
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <MaterialIcons 
                name="info-outline" 
                size={14} 
                color="rgba(255, 255, 255, 0.5)" 
                style={{ marginRight: 6, marginTop: 1 }}
              />
              <Text style={{
                fontSize: 12,
                color: 'rgba(255, 255, 255, 0.5)',
                lineHeight: 16,
                flex: 1
              }}>
                Email and phone are private. Location is optional.
              </Text>
            </View>
          </View>

          <View style={{ height: insets.bottom + 20 }} />
        </ScrollView>
      </View>
    </View>
  );
}