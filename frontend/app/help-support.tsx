import React, { useState } from 'react';
import { Text, View, TouchableOpacity, ScrollView, StatusBar, Alert, Linking, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

// Move components outside to prevent recreation on every render
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

const FAQItem = ({
  question,
  answer,
  index,
  isExpanded,
  onToggle
}: {
  question: string;
  answer: string;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  return (
    <TouchableOpacity
      onPress={onToggle}
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: 12,
        padding: 16,
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
      }}>
        <Text style={{
          fontSize: 15,
          fontWeight: '600',
          color: '#ffffff',
          flex: 1,
          marginRight: 12,
          letterSpacing: 0.1
        }}>
          {question}
        </Text>
        <MaterialIcons
          name={isExpanded ? 'expand-less' : 'expand-more'}
          size={20}
          color={isExpanded ? '#00D4AA' : 'rgba(255, 255, 255, 0.6)'}
        />
      </View>
      {isExpanded && (
        <Text style={{
          fontSize: 14,
          color: 'rgba(255, 255, 255, 0.7)',
          lineHeight: 22,
          marginTop: 12,
          letterSpacing: 0.1
        }}>
          {answer}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const ContactOption = ({
  icon,
  label,
  value,
  onPress
}: {
  icon: string;
  label: string;
  value: string;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: 'rgba(255, 255, 255, 0.1)'
    }}
    activeOpacity={0.7}
  >
    <MaterialIcons name={icon as any} size={18} color="rgba(255, 255, 255, 0.7)" />
    <View style={{ flex: 1, marginLeft: 12 }}>
      <Text style={{
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.6)',
        marginBottom: 2,
        letterSpacing: 0.1
      }}>
        {label}
      </Text>
      <Text style={{
        fontSize: 15,
        color: 'rgba(255, 255, 255, 0.85)',
        letterSpacing: 0.1
      }}>
        {value}
      </Text>
    </View>
    <MaterialIcons name="chevron-right" size={18} color="rgba(255, 255, 255, 0.4)" />
  </TouchableOpacity>
);

export default function HelpSupport() {
  const insets = useSafeAreaInsets();
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const faqs = [
    {
      question: "How do I create a bet?",
      answer: "To create a bet, go to the Bet tab, tap the '+' button, fill in the bet details including title, description, stake amount, and deadline. You can invite friends from your groups to participate."
    },
    {
      question: "How do group bets work?",
      answer: "Group bets allow multiple members to participate in the same betting event. The creator sets the terms, and group members can join by placing their stakes. Winners are determined based on the outcome."
    },
    {
      question: "How do I invite friends to a group?",
      answer: "In your group, go to the Members tab and tap 'Invite Members'. You can search for friends by username or send them an invitation link to join your group."
    },
    {
      question: "What happens if I lose a bet?",
      answer: "If you lose a bet, the stake amount will be deducted from your account balance. The winnings are distributed among the winners according to the bet terms."
    },
    {
      question: "How do I change my profile picture?",
      answer: "Go to your Profile tab, tap 'Edit Profile', then tap on your current profile picture. You can choose to take a new photo or select one from your gallery."
    },
    {
      question: "How do I reset my password?",
      answer: "On the login screen, tap 'Forgot Password' and enter your email address. You'll receive a link to reset your password. You can also change it in Settings > Account Security."
    }
  ];

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
              Help & Support
            </Text>
            <Text style={{
              fontSize: 14,
              color: 'rgba(255, 255, 255, 0.5)',
              marginTop: 4,
              letterSpacing: 0.2
            }}>
              We're here to help
            </Text>
          </View>
        </View>

        {/* FAQ Section */}
        <Section title="Frequently Asked Questions">
          <Paragraph>
            Find answers to common questions about using BetMate.
          </Paragraph>
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.05)'
          }}>
            {faqs.map((faq, index) => (
              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer}
                index={index}
                isExpanded={expandedFAQ === index}
                onToggle={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
              />
            ))}
          </View>
        </Section>

        {/* Contact Support */}
        <Section title="Contact Support">
          <Paragraph>
            Need more help? Reach out to our support team through any of these channels.
          </Paragraph>
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.05)'
          }}>
            <ContactOption
              icon="email"
              label="Email Support"
              value="support@betmate.com"
              onPress={() => openExternalLink('mailto:support@betmate.com')}
            />
            <ContactOption
              icon="phone"
              label="Phone Support"
              value="+1 (555) 012-3456"
              onPress={() => openExternalLink('tel:+1-555-0123')}
            />
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 12
            }}>
              <MaterialIcons name="schedule" size={18} color="rgba(255, 255, 255, 0.7)" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{
                  fontSize: 13,
                  color: 'rgba(255, 255, 255, 0.6)',
                  marginBottom: 2,
                  letterSpacing: 0.1
                }}>
                  Support Hours
                </Text>
                <Text style={{
                  fontSize: 15,
                  color: 'rgba(255, 255, 255, 0.85)',
                  letterSpacing: 0.1
                }}>
                  24/7 Support Available
                </Text>
              </View>
            </View>
          </View>
        </Section>

        {/* Send Message */}
        <Section title="Send Us a Message">
          <Paragraph>
            Have a specific question? Fill out the form below and we'll get back to you within 24 hours.
          </Paragraph>
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 12,
            padding: 20,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.05)'
          }}>
            <View style={{ marginBottom: 20 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.8)',
                marginBottom: 8,
                letterSpacing: 0.1
              }}>
                Subject
              </Text>
              <TextInput
                value={contactForm.subject}
                onChangeText={(text) => setContactForm(prev => ({ ...prev, subject: text }))}
                placeholder="What's your question about?"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: 8,
                  padding: 12,
                  color: '#ffffff',
                  fontSize: 15,
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.1)'
                }}
                maxLength={100}
              />
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.8)',
                marginBottom: 8,
                letterSpacing: 0.1
              }}>
                Message
              </Text>
              <TextInput
                value={contactForm.message}
                onChangeText={(text) => setContactForm(prev => ({ ...prev, message: text }))}
                placeholder="Describe your issue or question..."
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: 8,
                  padding: 12,
                  color: '#ffffff',
                  fontSize: 15,
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  minHeight: 120,
                  textAlignVertical: 'top'
                }}
                multiline
                maxLength={500}
              />
              <Text style={{
                fontSize: 12,
                color: 'rgba(255, 255, 255, 0.4)',
                textAlign: 'right',
                marginTop: 4
              }}>
                {contactForm.message.length}/500
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleContactSubmit}
              disabled={isSubmitting}
              style={{
                backgroundColor: isSubmitting ? 'rgba(0, 212, 170, 0.5)' : '#00D4AA',
                borderRadius: 8,
                paddingVertical: 14,
                alignItems: 'center'
              }}
              activeOpacity={0.8}
            >
              <Text style={{
                color: '#000000',
                fontSize: 15,
                fontWeight: '600',
                letterSpacing: 0.2
              }}>
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </Text>
            </TouchableOpacity>
          </View>
        </Section>

        {/* Report Bug */}
        <Section title="Report a Bug">
          <Paragraph>
            Found a bug? Help us improve BetMate by reporting it.
          </Paragraph>
          <TouchableOpacity
            onPress={() => openExternalLink('mailto:bugs@betmate.com')}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.05)',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialIcons name="bug-report" size={18} color="rgba(255, 255, 255, 0.7)" />
              <Text style={{
                fontSize: 15,
                color: 'rgba(255, 255, 255, 0.85)',
                marginLeft: 12,
                letterSpacing: 0.1
              }}>
                bugs@betmate.com
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={18} color="rgba(255, 255, 255, 0.4)" />
          </TouchableOpacity>
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
