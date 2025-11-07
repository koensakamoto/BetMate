import React from 'react';
import { Text, View, ScrollView, StatusBar, TouchableOpacity, Linking, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function About() {
  const insets = useSafeAreaInsets();

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={{ marginBottom: 40 }}>
      <Text style={{
        fontSize: 20,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 16,
        letterSpacing: 0.2
      }}>
        {title}
      </Text>
      {children}
    </View>
  );

  const Paragraph = ({ children }: { children: React.ReactNode }) => (
    <Text style={{
      fontSize: 15,
      lineHeight: 24,
      color: 'rgba(255, 255, 255, 0.85)',
      marginBottom: 16,
      letterSpacing: 0.1
    }}>
      {children}
    </Text>
  );

  const InfoItem = ({ label, value }: { label: string; value: string }) => (
    <View style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: 'rgba(255, 255, 255, 0.1)'
    }}>
      <Text style={{
        fontSize: 15,
        color: 'rgba(255, 255, 255, 0.7)',
        letterSpacing: 0.1
      }}>
        {label}
      </Text>
      <Text style={{
        fontSize: 15,
        color: '#ffffff',
        fontWeight: '500',
        letterSpacing: 0.1
      }}>
        {value}
      </Text>
    </View>
  );

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open link. Please try again later.');
    });
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

      <ScrollView
        style={{ flex: 1, marginTop: insets.top }}
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: insets.bottom + 60,
          paddingHorizontal: 24
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Minimal Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 48,
          paddingVertical: 8
        }}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 20
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
              color: '#ffffff',
              letterSpacing: 0.3
            }}>
              About BetMate
            </Text>
            <Text style={{
              fontSize: 14,
              color: 'rgba(255, 255, 255, 0.5)',
              marginTop: 4,
              letterSpacing: 0.2
            }}>
              Social betting with friends
            </Text>
          </View>
        </View>

        {/* App Logo/Icon Section */}
        <View style={{
          alignItems: 'center',
          marginBottom: 40,
          paddingVertical: 20
        }}>
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: 'rgba(0, 212, 170, 0.1)',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16,
            borderWidth: 2,
            borderColor: 'rgba(0, 212, 170, 0.2)'
          }}>
            <Text style={{
              fontSize: 32,
              color: '#00D4AA',
              fontWeight: '700'
            }}>
              BM
            </Text>
          </View>
          <Text style={{
            fontSize: 24,
            fontWeight: '700',
            color: '#ffffff',
            marginBottom: 8,
            letterSpacing: 0.3
          }}>
            BetMate
          </Text>
          <Text style={{
            fontSize: 16,
            color: 'rgba(255, 255, 255, 0.7)',
            textAlign: 'center',
            letterSpacing: 0.2
          }}>
            Where friends bet together
          </Text>
        </View>

        {/* About the App */}
        <Section title="About the App">
          <Paragraph>
            BetMate is a social betting platform that brings friends together through friendly wagers and group competitions. Create betting groups with your friends, place bets on sports, games, or anything you can imagine, and track your wins and losses together.
          </Paragraph>
          <Paragraph>
            Our platform emphasizes responsible social betting, community building, and having fun with friends while adding excitement to the events you love watching.
          </Paragraph>
        </Section>

        {/* Key Features */}
        <Section title="Key Features">
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 12,
            padding: 20,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.05)'
          }}>
            <View style={{ flexDirection: 'row', marginBottom: 20 }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(0, 212, 170, 0.15)',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 16
              }}>
                <MaterialIcons name="group" size={20} color="#00D4AA" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#ffffff',
                  marginBottom: 6,
                  letterSpacing: 0.2
                }}>
                  Group Betting
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: 'rgba(255, 255, 255, 0.7)',
                  lineHeight: 20,
                  letterSpacing: 0.1
                }}>
                  Create private groups and bet with friends on sports, games, and events
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', marginBottom: 20 }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(0, 212, 170, 0.15)',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 16
              }}>
                <MaterialIcons name="chat-bubble" size={20} color="#00D4AA" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#ffffff',
                  marginBottom: 6,
                  letterSpacing: 0.2
                }}>
                  Real-time Chat
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: 'rgba(255, 255, 255, 0.7)',
                  lineHeight: 20,
                  letterSpacing: 0.1
                }}>
                  Discuss bets, share predictions, and celebrate wins with group messaging
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', marginBottom: 20 }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(0, 212, 170, 0.15)',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 16
              }}>
                <MaterialIcons name="analytics" size={20} color="#00D4AA" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#ffffff',
                  marginBottom: 6,
                  letterSpacing: 0.2
                }}>
                  Statistics Tracking
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: 'rgba(255, 255, 255, 0.7)',
                  lineHeight: 20,
                  letterSpacing: 0.1
                }}>
                  Track your betting performance with detailed win/loss statistics
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row' }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(0, 212, 170, 0.15)',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 16
              }}>
                <MaterialIcons name="emoji-events" size={20} color="#00D4AA" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#ffffff',
                  marginBottom: 6,
                  letterSpacing: 0.2
                }}>
                  Achievements
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: 'rgba(255, 255, 255, 0.7)',
                  lineHeight: 20,
                  letterSpacing: 0.1
                }}>
                  Unlock achievements and compete with friends for bragging rights
                </Text>
              </View>
            </View>
          </View>
        </Section>

        {/* App Information */}
        <Section title="App Information">
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.05)'
          }}>
            <InfoItem label="Version" value="1.0.0" />
            <InfoItem label="Release Date" value="September 2025" />
            <InfoItem label="Platform" value="iOS & Android" />
            <InfoItem label="Size" value="~45 MB" />
            <InfoItem label="Category" value="Social & Entertainment" />
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: 12
            }}>
              <Text style={{
                fontSize: 15,
                color: 'rgba(255, 255, 255, 0.7)',
                letterSpacing: 0.1
              }}>
                Age Rating
              </Text>
              <Text style={{
                fontSize: 15,
                color: '#ffffff',
                fontWeight: '500',
                letterSpacing: 0.1
              }}>
                18+
              </Text>
            </View>
          </View>
        </Section>

        {/* Development Team */}
        <Section title="Development Team">
          <Paragraph>
            BetMate is developed by a passionate team of developers who love bringing people together through technology and shared experiences.
          </Paragraph>
        </Section>

        {/* Technical Information */}
        <Section title="Technical Information">
          <Paragraph>
            BetMate is built using modern technologies to ensure a fast, reliable, and secure experience:
          </Paragraph>
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.05)'
          }}>
            <InfoItem label="Frontend" value="React Native & Expo" />
            <InfoItem label="Backend" value="Java Spring Boot" />
            <InfoItem label="Database" value="MySQL" />
            <InfoItem label="Real-time" value="WebSocket (STOMP)" />
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: 12
            }}>
              <Text style={{
                fontSize: 15,
                color: 'rgba(255, 255, 255, 0.7)',
                letterSpacing: 0.1
              }}>
                Security
              </Text>
              <Text style={{
                fontSize: 15,
                color: '#ffffff',
                fontWeight: '500',
                letterSpacing: 0.1
              }}>
                End-to-end Encryption
              </Text>
            </View>
          </View>
        </Section>

        {/* Contact & Support */}
        <Section title="Contact & Support">
          <Paragraph>
            Have questions, feedback, or need support? We&apos;d love to hear from you!
          </Paragraph>
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 12,
            padding: 20,
            marginTop: 8,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.05)'
          }}>
            <TouchableOpacity
              onPress={() => openLink('mailto:support@betmate.com')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                borderBottomWidth: 0.5,
                borderBottomColor: 'rgba(255, 255, 255, 0.1)'
              }}
              activeOpacity={0.7}
            >
              <MaterialIcons name="email" size={18} color="rgba(255, 255, 255, 0.7)" />
              <Text style={{
                fontSize: 15,
                color: 'rgba(255, 255, 255, 0.85)',
                marginLeft: 12,
                letterSpacing: 0.1
              }}>
                support@betmate.com
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => openLink('https://betmate.com')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                borderBottomWidth: 0.5,
                borderBottomColor: 'rgba(255, 255, 255, 0.1)'
              }}
              activeOpacity={0.7}
            >
              <MaterialIcons name="language" size={18} color="rgba(255, 255, 255, 0.7)" />
              <Text style={{
                fontSize: 15,
                color: 'rgba(255, 255, 255, 0.85)',
                marginLeft: 12,
                letterSpacing: 0.1
              }}>
                www.betmate.com
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => router.push('/help-support')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12
              }}
              activeOpacity={0.7}
            >
              <MaterialIcons name="help" size={18} color="rgba(255, 255, 255, 0.7)" />
              <Text style={{
                fontSize: 15,
                color: 'rgba(255, 255, 255, 0.85)',
                marginLeft: 12,
                letterSpacing: 0.1
              }}>
                Help & Support Center
              </Text>
            </TouchableOpacity>
          </View>
        </Section>

        {/* Legal */}
        <Section title="Legal">
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.05)'
          }}>
            <TouchableOpacity
              onPress={() => router.push('/terms-of-service')}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: 12,
                borderBottomWidth: 0.5,
                borderBottomColor: 'rgba(255, 255, 255, 0.1)'
              }}
              activeOpacity={0.7}
            >
              <Text style={{
                fontSize: 15,
                color: 'rgba(255, 255, 255, 0.85)',
                letterSpacing: 0.1
              }}>
                Terms of Service
              </Text>
              <MaterialIcons name="chevron-right" size={18} color="rgba(255, 255, 255, 0.4)" />
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => router.push('/privacy-policy')}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: 12
              }}
              activeOpacity={0.7}
            >
              <Text style={{
                fontSize: 15,
                color: 'rgba(255, 255, 255, 0.85)',
                letterSpacing: 0.1
              }}>
                Privacy Policy
              </Text>
              <MaterialIcons name="chevron-right" size={18} color="rgba(255, 255, 255, 0.4)" />
            </TouchableOpacity>
          </View>
        </Section>

        {/* Footer */}
        <View style={{
          alignItems: 'center',
          paddingTop: 24,
          paddingBottom: 16,
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.05)',
          marginTop: 32
        }}>
          <Text style={{
            fontSize: 13,
            color: 'rgba(255, 255, 255, 0.4)',
            textAlign: 'center',
            letterSpacing: 0.3
          }}>
            BetMate v1.0.0
          </Text>
          <Text style={{
            fontSize: 12,
            color: 'rgba(255, 255, 255, 0.3)',
            textAlign: 'center',
            marginTop: 8,
            letterSpacing: 0.2
          }}>
            © 2025 BetMate. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}