import React, { useState } from 'react';
import { Text, View, TouchableOpacity, ScrollView, StatusBar, Alert, Linking, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AuthInput from '../components/auth/AuthInput';

export default function HelpSupport() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState(0);
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tabs = ['FAQ', 'Contact', 'Guides'];

  const handleContactSubmit = async () => {
    if (!contactForm.subject.trim() || !contactForm.message.trim()) {
      Alert.alert('Error', 'Please fill in all fields before submitting.');
      return;
    }

    setIsSubmitting(true);
    
    setTimeout(() => {
      Alert.alert(
        'Message Sent',
        'Thank you for your message. Our support team will get back to you within 24 hours.',
        [{ text: 'OK', onPress: () => {
          setContactForm({ subject: '', message: '' });
          setIsSubmitting(false);
        }}]
      );
    }, 1000);
  };

  const openExternalLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open link. Please try again later.');
    });
  };

  const ModernCard = ({ children, style = {} }: { children: React.ReactNode; style?: any }) => (
    <View style={{
      backgroundColor: 'rgba(255, 255, 255, 0.02)',
      borderRadius: 20,
      padding: 24,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.06)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 8,
      ...style
    }}>
      {children}
    </View>
  );

  const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    return (
      <TouchableOpacity 
        onPress={() => setIsExpanded(!isExpanded)}
        style={{
          backgroundColor: isExpanded ? 'rgba(0, 212, 170, 0.04)' : 'rgba(255, 255, 255, 0.02)',
          borderRadius: 16,
          padding: 20,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: isExpanded ? 'rgba(0, 212, 170, 0.2)' : 'rgba(255, 255, 255, 0.05)',
        }}
        activeOpacity={0.7}
      >
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: isExpanded ? 16 : 0
        }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: '#ffffff',
            flex: 1,
            marginRight: 12,
            lineHeight: 22
          }}>
            {question}
          </Text>
          <View style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: isExpanded ? 'rgba(0, 212, 170, 0.15)' : 'rgba(255, 255, 255, 0.08)',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <MaterialIcons 
              name={isExpanded ? 'expand-less' : 'expand-more'} 
              size={20} 
              color={isExpanded ? '#00D4AA' : 'rgba(255, 255, 255, 0.6)'} 
            />
          </View>
        </View>
        {isExpanded && (
          <Text style={{
            fontSize: 15,
            color: 'rgba(255, 255, 255, 0.75)',
            lineHeight: 22,
            letterSpacing: 0.2
          }}>
            {answer}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const QuickActionCard = ({ 
    icon, 
    title, 
    description, 
    onPress,
    gradientColors = ['rgba(0, 212, 170, 0.15)', 'rgba(0, 212, 170, 0.05)'],
    iconColor = '#00D4AA'
  }: {
    icon: string;
    title: string;
    description: string;
    onPress: () => void;
    gradientColors?: string[];
    iconColor?: string;
  }) => (
    <TouchableOpacity 
      onPress={onPress}
      style={{
        marginBottom: 16,
        borderRadius: 20,
        overflow: 'hidden'
      }}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 20,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.08)',
        }}
      >
        <View style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 20,
          shadowColor: iconColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        }}>
          <MaterialIcons 
            name={icon as any} 
            size={28} 
            color={iconColor} 
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 17,
            fontWeight: '700',
            color: '#ffffff',
            marginBottom: 4,
            letterSpacing: 0.3
          }}>
            {title}
          </Text>
          <Text style={{
            fontSize: 14,
            color: 'rgba(255, 255, 255, 0.7)',
            lineHeight: 20,
            letterSpacing: 0.2
          }}>
            {description}
          </Text>
        </View>
        <View style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <MaterialIcons 
            name="arrow-forward" 
            size={18} 
            color="rgba(255, 255, 255, 0.8)" 
          />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const GuideCard = ({ 
    icon, 
    title, 
    description, 
    onPress,
    color 
  }: {
    icon: string;
    title: string;
    description: string;
    onPress: () => void;
    color: string;
  }) => (
    <TouchableOpacity 
      onPress={onPress}
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: 18,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
        width: '48%'
      }}
      activeOpacity={0.8}
    >
      <View style={{
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: `${color}20`,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16
      }}>
        <MaterialIcons 
          name={icon as any} 
          size={24} 
          color={color} 
        />
      </View>
      <Text style={{
        fontSize: 16,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 8,
        lineHeight: 20
      }}>
        {title}
      </Text>
      <Text style={{
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.6)',
        lineHeight: 18,
        letterSpacing: 0.2
      }}>
        {description}
      </Text>
    </TouchableOpacity>
  );

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
          paddingTop: insets.top + 20, 
          paddingBottom: insets.bottom + 40,
          paddingHorizontal: 20
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Modern Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 40
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity 
              onPress={() => router.back()}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
              }}
              activeOpacity={0.8}
            >
              <MaterialIcons 
                name="arrow-back" 
                size={20} 
                color="#ffffff" 
              />
            </TouchableOpacity>
            
            <View>
              <Text style={{
                fontSize: 28,
                fontWeight: '800',
                color: '#ffffff',
                letterSpacing: 0.5
              }}>
                Help Center
              </Text>
              <Text style={{
                fontSize: 14,
                color: 'rgba(255, 255, 255, 0.6)',
                marginTop: 2,
                letterSpacing: 0.3
              }}>
                We're here to help you
              </Text>
            </View>
          </View>
        </View>

        {/* Hero Quick Actions */}
        <ModernCard style={{ marginBottom: 32 }}>
          <Text style={{
            fontSize: 20,
            fontWeight: '700',
            color: '#ffffff',
            marginBottom: 20,
            letterSpacing: 0.3
          }}>
            Quick Support
          </Text>
          
          <QuickActionCard
            icon="chat"
            title="Live Chat"
            description="Get instant help from our support team"
            onPress={() => Alert.alert('Live Chat', 'Live chat feature coming soon!')}
            gradientColors={['rgba(0, 212, 170, 0.15)', 'rgba(0, 212, 170, 0.05)']}
            iconColor="#00D4AA"
          />
          
          <QuickActionCard
            icon="email"
            title="Email Support"
            description="Send us a detailed message"
            onPress={() => openExternalLink('mailto:support@groupreels.com')}
            gradientColors={['rgba(59, 130, 246, 0.15)', 'rgba(59, 130, 246, 0.05)']}
            iconColor="#3B82F6"
          />
          
          <QuickActionCard
            icon="phone"
            title="Phone Support"
            description="Speak directly with our team"
            onPress={() => openExternalLink('tel:+1-555-0123')}
            gradientColors={['rgba(16, 185, 129, 0.15)', 'rgba(16, 185, 129, 0.05)']}
            iconColor="#10B981"
          />
        </ModernCard>

        {/* Modern Tab Navigation */}
        <View style={{
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          borderRadius: 20,
          padding: 6,
          marginBottom: 32,
          flexDirection: 'row',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
        }}>
          {tabs.map((tab, index) => {
            const isActive = index === activeTab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(index)}
                style={{
                  flex: 1,
                  paddingVertical: 16,
                  borderRadius: 16,
                  backgroundColor: isActive ? '#00D4AA' : 'transparent',
                  alignItems: 'center',
                  shadowColor: isActive ? '#00D4AA' : 'transparent',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isActive ? 0.3 : 0,
                  shadowRadius: 8,
                }}
                activeOpacity={0.8}
              >
                <Text style={{
                  fontSize: 16,
                  fontWeight: isActive ? '700' : '600',
                  color: isActive ? '#000000' : 'rgba(255, 255, 255, 0.7)',
                  letterSpacing: 0.3
                }}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tab Content */}
        {activeTab === 0 && (
          /* Modern FAQ Tab */
          <ModernCard>
            <Text style={{
              fontSize: 20,
              fontWeight: '700',
              color: '#ffffff',
              marginBottom: 24,
              letterSpacing: 0.3
            }}>
              Frequently Asked Questions
            </Text>
            
            <FAQItem
              question="How do I create a bet?"
              answer="To create a bet, go to the Bet tab, tap the '+' button, fill in the bet details including title, description, stake amount, and deadline. You can invite friends from your groups to participate."
            />
            <FAQItem
              question="How do group bets work?"
              answer="Group bets allow multiple members to participate in the same betting event. The creator sets the terms, and group members can join by placing their stakes. Winners are determined based on the outcome."
            />
            <FAQItem
              question="How do I invite friends to a group?"
              answer="In your group, go to the Members tab and tap 'Invite Members'. You can search for friends by username or send them an invitation link to join your group."
            />
            <FAQItem
              question="What happens if I lose a bet?"
              answer="If you lose a bet, the stake amount will be deducted from your account balance. The winnings are distributed among the winners according to the bet terms."
            />
            <FAQItem
              question="How do I change my profile picture?"
              answer="Go to your Profile tab, tap 'Edit Profile', then tap on your current profile picture. You can choose to take a new photo or select one from your gallery."
            />
            <FAQItem
              question="How do I reset my password?"
              answer="On the login screen, tap 'Forgot Password' and enter your email address. You'll receive a link to reset your password. You can also change it in Settings > Account Security."
            />
          </ModernCard>
        )}

        {activeTab === 1 && (
          /* Modern Contact Tab */
          <ModernCard>
            <Text style={{
              fontSize: 20,
              fontWeight: '700',
              color: '#ffffff',
              marginBottom: 12,
              letterSpacing: 0.3
            }}>
              Get in Touch
            </Text>
            <Text style={{
              fontSize: 15,
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: 32,
              lineHeight: 22,
              letterSpacing: 0.2
            }}>
              Have a question that's not answered in our FAQ? Send us a message and we'll get back to you within 24 hours.
            </Text>
            
            <AuthInput
              label="Subject"
              value={contactForm.subject}
              onChangeText={(text) => setContactForm(prev => ({ ...prev, subject: text }))}
              placeholder="What's your question about?"
              maxLength={100}
            />
            
            <View style={{ marginBottom: 32 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.8)',
                marginBottom: 12
              }}>
                Message
              </Text>
              <View style={{
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                borderRadius: 16,
                borderWidth: 1.5,
                borderColor: 'rgba(255, 255, 255, 0.1)',
                padding: 20,
                minHeight: 140
              }}>
                <AuthInput
                  label=""
                  value={contactForm.message}
                  onChangeText={(text) => setContactForm(prev => ({ ...prev, message: text }))}
                  placeholder="Describe your issue or question in detail..."
                  maxLength={500}
                  style={{
                    backgroundColor: 'transparent',
                    borderWidth: 0,
                    padding: 0,
                    margin: 0,
                    minHeight: 100,
                    textAlignVertical: 'top'
                  }}
                  multiline={true}
                  numberOfLines={4}
                />
              </View>
              <Text style={{
                fontSize: 12,
                color: 'rgba(255, 255, 255, 0.4)',
                textAlign: 'right',
                marginTop: 8
              }}>
                {contactForm.message.length}/500
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleContactSubmit}
              disabled={isSubmitting}
              style={{
                borderRadius: 16,
                paddingVertical: 18,
                alignItems: 'center',
                opacity: isSubmitting ? 0.7 : 1,
                overflow: 'hidden'
              }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#00D4AA', '#00B899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: '100%',
                  paddingVertical: 18,
                  alignItems: 'center',
                  borderRadius: 16,
                }}
              >
                <Text style={{
                  color: '#000000',
                  fontSize: 16,
                  fontWeight: '700',
                  letterSpacing: 0.3
                }}>
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </ModernCard>
        )}

        {activeTab === 2 && (
          /* Modern Guides Tab */
          <View>
            <ModernCard>
              <Text style={{
                fontSize: 20,
                fontWeight: '700',
                color: '#ffffff',
                marginBottom: 24,
                letterSpacing: 0.3
              }}>
                Getting Started
              </Text>
              
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                flexWrap: 'wrap'
              }}>
                <GuideCard
                  icon="play-circle-outline"
                  title="App Tutorial"
                  description="Watch a quick video tutorial"
                  onPress={() => Alert.alert('Tutorial', 'Video tutorial coming soon!')}
                  color="#EF4444"
                />
                <GuideCard
                  icon="groups"
                  title="Create Group"
                  description="Step-by-step guide"
                  onPress={() => Alert.alert('Guide', 'Group creation guide coming soon!')}
                  color="#8B5CF6"
                />
                <GuideCard
                  icon="casino"
                  title="First Bet"
                  description="Learn betting basics"
                  onPress={() => Alert.alert('Guide', 'Betting guide coming soon!')}
                  color="#F59E0B"
                />
                <GuideCard
                  icon="security"
                  title="Stay Safe"
                  description="Security best practices"
                  onPress={() => Alert.alert('Security', 'Security guide coming soon!')}
                  color="#DC2626"
                />
              </View>
            </ModernCard>

            <ModernCard>
              <Text style={{
                fontSize: 20,
                fontWeight: '700',
                color: '#ffffff',
                marginBottom: 24,
                letterSpacing: 0.3
              }}>
                Advanced Features
              </Text>
              
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                flexWrap: 'wrap'
              }}>
                <GuideCard
                  icon="notifications"
                  title="Notifications"
                  description="Customize alerts"
                  onPress={() => Alert.alert('Notifications', 'Notification guide coming soon!')}
                  color="#059669"
                />
                <GuideCard
                  icon="analytics"
                  title="Statistics"
                  description="Track performance"
                  onPress={() => Alert.alert('Statistics', 'Statistics guide coming soon!')}
                  color="#0EA5E9"
                />
              </View>
            </ModernCard>
          </View>
        )}

        {/* Modern Footer Card */}
        <ModernCard style={{
          alignItems: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.01)',
        }}>
          <View style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: 'rgba(0, 212, 170, 0.1)',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16
          }}>
            <MaterialIcons name="support-agent" size={32} color="#00D4AA" />
          </View>
          
          <Text style={{
            fontSize: 18,
            fontWeight: '700',
            color: '#ffffff',
            textAlign: 'center',
            marginBottom: 8,
            letterSpacing: 0.3
          }}>
            Still need help?
          </Text>
          <Text style={{
            fontSize: 14,
            color: 'rgba(255, 255, 255, 0.6)',
            textAlign: 'center',
            lineHeight: 20,
            letterSpacing: 0.2
          }}>
            Our support team is available 24/7 to assist you with any questions or concerns.
          </Text>
          
          <TouchableOpacity
            onPress={() => openExternalLink('mailto:bugs@groupreels.com')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(249, 115, 22, 0.1)',
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 20,
              marginTop: 20,
              borderWidth: 1,
              borderColor: 'rgba(249, 115, 22, 0.2)'
            }}
            activeOpacity={0.8}
          >
            <MaterialIcons name="bug-report" size={18} color="#F97316" />
            <Text style={{
              color: '#F97316',
              fontSize: 14,
              fontWeight: '600',
              marginLeft: 8,
              letterSpacing: 0.2
            }}>
              Report a Bug
            </Text>
          </TouchableOpacity>

          <Text style={{
            fontSize: 12,
            color: 'rgba(255, 255, 255, 0.4)',
            textAlign: 'center',
            marginTop: 24,
            letterSpacing: 0.5
          }}>
            GroupReels v1.0.0
          </Text>
        </ModernCard>
      </ScrollView>
    </View>
  );
}