import React, { useState } from 'react';
import { Text, View, StatusBar, TouchableOpacity, TextInput, Alert, Image } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function ProfileSettings() {
  const insets = useSafeAreaInsets();
  
  // Form state
  const [firstName, setFirstName] = useState('John');
  const [lastName, setLastName] = useState('Doe');
  const [username, setUsername] = useState('johndoe123');
  const [email, setEmail] = useState('john.doe@email.com');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert('Success', 'Profile updated successfully!');
    }, 1500);
  };

  const handlePhotoEdit = () => {
    Alert.alert(
      'Change Profile Photo',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: () => {} },
        { text: 'Choose from Library', onPress: () => {} },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };


  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0a0a0f"
        translucent={true}
      />

      {/* Solid background behind status bar */}
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: insets.top,
        backgroundColor: '#0a0a0f',
        zIndex: 1
      }} />

      <KeyboardAwareScrollView
        style={{ flex: 1, backgroundColor: '#0a0a0f', marginTop: insets.top }}
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: insets.bottom + 40,
          paddingHorizontal: 24
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={20}
        enableOnAndroid={true}
      >
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 32,
          paddingVertical: 8
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity 
              onPress={() => router.back()}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 16
              }}
              activeOpacity={0.7}
            >
              <MaterialIcons 
                name="arrow-back" 
                size={20} 
                color="rgba(255, 255, 255, 0.9)" 
              />
            </TouchableOpacity>
            
            <View>
              <Text style={{
                fontSize: 24,
                fontWeight: '700',
                color: '#ffffff'
              }}>
                Edit Profile
              </Text>
              <Text style={{
                fontSize: 14,
                color: 'rgba(255, 255, 255, 0.5)',
                marginTop: 2
              }}>
                Update your information
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSave}
            disabled={isLoading}
            style={{
              backgroundColor: '#00D4AA',
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 20,
              opacity: isLoading ? 0.6 : 1
            }}
            activeOpacity={0.8}
          >
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: '#ffffff'
            }}>
              {isLoading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Profile Photo Section */}
        <View style={{
          alignItems: 'center',
          marginBottom: 32
        }}>
          <TouchableOpacity 
            onPress={handlePhotoEdit}
            activeOpacity={0.8}
          >
            <View style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <Text style={{
                fontSize: 32,
                fontWeight: '700',
                color: 'rgba(255, 255, 255, 0.8)'
              }}>
                JD
              </Text>
              
              {/* Edit overlay */}
              <View style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: '#00D4AA',
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 2,
                borderColor: '#0a0a0f'
              }}>
                <MaterialIcons 
                  name="camera-alt" 
                  size={14} 
                  color="#ffffff" 
                />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={{ gap: 20 }}>
          <View style={{
            flexDirection: 'row',
            gap: 12
          }}>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '500',
                color: 'rgba(255, 255, 255, 0.7)',
                marginBottom: 8
              }}>
                First Name
              </Text>
              <View style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 8,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.08)',
                paddingHorizontal: 16,
                paddingVertical: 12
              }}>
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="First name"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  style={{
                    fontSize: 16,
                    color: '#ffffff'
                  }}
                />
              </View>
            </View>
            
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '500',
                color: 'rgba(255, 255, 255, 0.7)',
                marginBottom: 8
              }}>
                Last Name
              </Text>
              <View style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 8,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.08)',
                paddingHorizontal: 16,
                paddingVertical: 12
              }}>
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Last name"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  style={{
                    fontSize: 16,
                    color: '#ffffff'
                  }}
                />
              </View>
            </View>
          </View>

          <View>
            <Text style={{
              fontSize: 14,
              fontWeight: '500',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: 8
            }}>
              Username
            </Text>
            <View style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 8,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.08)',
              paddingHorizontal: 16,
              paddingVertical: 12
            }}>
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="Choose a unique username"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                style={{
                  fontSize: 16,
                  color: '#ffffff'
                }}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View>
            <Text style={{
              fontSize: 14,
              fontWeight: '500',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: 8
            }}>
              Email
            </Text>
            <View style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 8,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.08)',
              paddingHorizontal: 16,
              paddingVertical: 12
            }}>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="your.email@example.com"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                style={{
                  fontSize: 16,
                  color: '#ffffff'
                }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>
        </View>

      </KeyboardAwareScrollView>
    </View>
  );
}