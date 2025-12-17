import React, { useState } from 'react';
import { Text, View, TouchableOpacity, ScrollView, StatusBar, Alert, Linking, TextInput, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { contactService } from '../../../services/contact/contactService';
import { ContactMessageRequest } from '../../../types/api';

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
    category: 'General Support',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const handleContactSubmit = async () => {
    // Validate category (3-50 characters)
    if (!contactForm.category || contactForm.category.length < 3 || contactForm.category.length > 50) {
      Alert.alert('Validation Error', 'Category must be between 3 and 50 characters.');
      return;
    }

    // Validate subject (3-100 characters)
    if (!contactForm.subject.trim() || contactForm.subject.trim().length < 3) {
      Alert.alert('Validation Error', 'Subject must be at least 3 characters long.');
      return;
    }
    if (contactForm.subject.trim().length > 100) {
      Alert.alert('Validation Error', 'Subject must not exceed 100 characters.');
      return;
    }

    // Validate message (10-500 characters)
    if (!contactForm.message.trim() || contactForm.message.trim().length < 10) {
      Alert.alert('Validation Error', 'Message must be at least 10 characters long.');
      return;
    }
    if (contactForm.message.trim().length > 500) {
      Alert.alert('Validation Error', 'Message must not exceed 500 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      const request: ContactMessageRequest = {
        category: contactForm.category,
        subject: contactForm.subject,
        message: contactForm.message,
      };

      await contactService.submitContactMessage(request);

      Alert.alert(
        'Message Sent',
        'Thank you for your message. Our support team will get back to you within 24 hours.',
        [{ text: 'OK', onPress: () => {
          setContactForm({ category: 'General Support', subject: '', message: '' });
        }}]
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.message || 'Failed to send message. Please try again later.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const openExternalLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open link. Please try again later.');
    });
  };

  const faqs = [
    {
      question: "How do I create a bet?",
      answer: "Go to your group, tap the '+' button, and fill in the bet details: title, category (sports, crypto, politics, etc.), what you're betting on, and the social stake (like 'loser buys coffee'). Set the deadline and choose who can resolve the bet."
    },
    {
      question: "What are social stakes?",
      answer: "Social stakes are fun, real-world consequences for losing a bet — no real money involved. Examples include buying the winner coffee, doing a dare, or any creative stake you agree on with friends."
    },
    {
      question: "How do I join a bet?",
      answer: "Open the bet from your group's Bets tab, review the details and social stake, then pick your side. Once the deadline passes and the outcome is determined, the loser fulfills the stake."
    },
    {
      question: "How do I create or join a group?",
      answer: "Tap the Group tab to see your groups. To create a new group, tap the '+' button and set up your group name and privacy settings. To join, you'll need an invite from an existing member."
    },
    {
      question: "How does the group chat work?",
      answer: "Each group has a built-in chat where members can discuss bets, trash talk, and celebrate wins. Go to your group and tap the Chat tab to start messaging."
    },
    {
      question: "How do I add friends?",
      answer: "Go to your Profile tab and tap on your friends count, then tap 'Find Friends'. Search for users by username and send them a friend request."
    },
    {
      question: "How do I change my profile picture?",
      answer: "Go to your Profile tab, tap 'Edit Profile', then tap on your current profile picture. You can choose to take a new photo or select one from your gallery."
    },
    {
      question: "How do I reset my password?",
      answer: "On the login screen, tap 'Forgot Password' and enter your email address. You'll receive a link to reset your password. You can also change it in Settings > Account."
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
            Find answers to common questions about using RivalPicks.
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

        {/* Contact & Support */}
        <Section title="Contact & Support">
          <Paragraph>
            Need help? Fill out the form below and we'll get back to you within 24 hours.
          </Paragraph>
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 12,
            padding: 20,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.05)'
          }}>
            {/* Category Picker */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.8)',
                marginBottom: 8,
                letterSpacing: 0.1
              }}>
                Category
              </Text>
              <TouchableOpacity
                onPress={() => setShowCategoryPicker(true)}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: 8,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
                activeOpacity={0.7}
              >
                <Text style={{
                  color: '#ffffff',
                  fontSize: 15
                }}>
                  {contactForm.category}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={20} color="rgba(255, 255, 255, 0.6)" />
              </TouchableOpacity>
            </View>

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

        {/* Category Picker Modal */}
        <Modal
          visible={showCategoryPicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowCategoryPicker(false)}
        >
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              justifyContent: 'center',
              alignItems: 'center'
            }}
            activeOpacity={1}
            onPress={() => setShowCategoryPicker(false)}
          >
            <View style={{
              backgroundColor: '#1a1a1f',
              borderRadius: 12,
              padding: 20,
              width: '80%',
              maxWidth: 300
            }}>
              <Text style={{
                fontSize: 18,
                fontWeight: '600',
                color: '#ffffff',
                marginBottom: 16
              }}>
                Select Category
              </Text>

              {['General Support', 'Bug Report'].map((category) => (
                <TouchableOpacity
                  key={category}
                  onPress={() => {
                    setContactForm(prev => ({ ...prev, category }));
                    setShowCategoryPicker(false);
                  }}
                  style={{
                    paddingVertical: 14,
                    borderBottomWidth: category === 'Bug Report' ? 0 : 0.5,
                    borderBottomColor: 'rgba(255, 255, 255, 0.1)'
                  }}
                  activeOpacity={0.7}
                >
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <Text style={{
                      fontSize: 15,
                      color: contactForm.category === category ? '#00D4AA' : 'rgba(255, 255, 255, 0.85)'
                    }}>
                      {category}
                    </Text>
                    {contactForm.category === category && (
                      <MaterialIcons name="check" size={20} color="#00D4AA" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

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
            RivalPicks v1.0.0
          </Text>
          <Text style={{
            fontSize: 12,
            color: 'rgba(255, 255, 255, 0.3)',
            textAlign: 'center',
            marginTop: 8,
            letterSpacing: 0.2
          }}>
            © 2025 RivalPicks. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
