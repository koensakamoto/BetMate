import React, { useState } from 'react';
import { Text, View, ScrollView, StatusBar, Image, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import AuthButton from '../../components/auth/AuthButton';
import SocialAuthButton from '../../components/auth/SocialAuthButton';
import { useGuestGuard } from '../../hooks/useAuthGuard';

const icon = require("../../assets/images/icon.png");

export default function Welcome() {
  const insets = useSafeAreaInsets();
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);

  // Redirect to app if already authenticated
  useGuestGuard('/(app)/(tabs)/group');

  const handleSocialAuth = async (provider: 'google' | 'apple') => {
    try {
      setSocialLoading(provider);
      // TODO: Implement actual social authentication
      console.log(`Authenticating with ${provider}`);
      // Simulate loading for demo purposes
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (error) {
      console.error('Social auth failed:', error);
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0a0a0f"
        translucent={true}
      />
      
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ 
          paddingTop: insets.top + 40,
          paddingBottom: insets.bottom + 20,
          paddingHorizontal: 20,
          alignItems: 'center'
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo Section */}
        <View style={{
          alignItems: 'center',
          marginBottom: 60
        }}>
          <View style={{
            width: 120,
            height: 120,
            borderRadius: 30,
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.15)',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
            shadowColor: '#00D4AA',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.1,
            shadowRadius: 16,
            elevation: 8
          }}>
            <Image 
              source={icon}
              style={{
                width: 80,
                height: 80,
                borderRadius: 20
              }}
            />
          </View>
          
          <Text style={{
            fontSize: 32,
            fontWeight: '800',
            color: '#ffffff',
            textAlign: 'center',
            letterSpacing: -1,
            marginBottom: 12
          }}>
            RivalPicks
          </Text>
          
          <Text style={{
            fontSize: 18,
            color: 'rgba(255, 255, 255, 0.7)',
            textAlign: 'center',
            lineHeight: 26,
            paddingHorizontal: 20
          }}>
            Join the ultimate betting community
          </Text>
        </View>

        {/* Value Proposition */}
        <View style={{
          width: '100%',
          marginBottom: 40
        }}>
          {[
            { icon: 'group', title: 'Connect & Compete', desc: 'Join betting groups with friends' },
            { icon: 'casino', title: 'Smart Betting', desc: 'Make informed predictions together' },
            { icon: 'monetization-on', title: 'Earn Rewards', desc: 'Win credits and unlock exclusive items' }
          ].map((feature, index) => (
            <View key={index} style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 20,
              paddingHorizontal: 8
            }}>
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: 'rgba(0, 212, 170, 0.15)',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 16
              }}>
                <MaterialIcons name={feature.icon as any} size={24} color="#00D4AA" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#ffffff',
                  marginBottom: 2
                }}>
                  {feature.title}
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: 'rgba(255, 255, 255, 0.6)',
                  lineHeight: 18
                }}>
                  {feature.desc}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={{
          width: '100%',
          gap: 16
        }}>
          <AuthButton
            title="Get Started"
            onPress={() => router.push('/auth/signup')}
            variant="primary"
          />
          
          <AuthButton
            title="Sign In"
            onPress={() => router.push('/auth/login')}
            variant="outline"
          />
          
          {/* Divider */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginVertical: 8
          }}>
            <View style={{
              flex: 1,
              height: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            }} />
            <Text style={{
              fontSize: 14,
              color: 'rgba(255, 255, 255, 0.5)',
              marginHorizontal: 16
            }}>
              or
            </Text>
            <View style={{
              flex: 1,
              height: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            }} />
          </View>
          
          <View style={{ gap: 12 }}>
            <SocialAuthButton
              provider="apple"
              onPress={() => handleSocialAuth('apple')}
              loading={socialLoading === 'apple'}
              disabled={socialLoading !== null}
            />
            <SocialAuthButton
              provider="google"
              onPress={() => handleSocialAuth('google')}
              loading={socialLoading === 'google'}
              disabled={socialLoading !== null}
            />
          </View>
        </View>

        {/* Legal Footer */}
        <View style={{
          marginTop: 40,
          alignItems: 'center'
        }}>
          <Text style={{
            fontSize: 13,
            color: 'rgba(255, 255, 255, 0.4)',
            textAlign: 'center',
            lineHeight: 18,
            marginBottom: 12
          }}>
            By continuing, you agree to our
          </Text>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16
          }}>
            <TouchableOpacity>
              <Text style={{
                fontSize: 13,
                color: '#00D4AA',
                fontWeight: '500'
              }}>
                Terms of Service
              </Text>
            </TouchableOpacity>
            <Text style={{
              fontSize: 13,
              color: 'rgba(255, 255, 255, 0.3)'
            }}>
              •
            </Text>
            <TouchableOpacity>
              <Text style={{
                fontSize: 13,
                color: '#00D4AA',
                fontWeight: '500'
              }}>
                Privacy Policy
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}