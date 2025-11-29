import React from 'react';
import { Text, View, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function PrivacyPolicy() {
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

  const ListItem = ({ children }: { children: React.ReactNode }) => (
    <View style={{
      flexDirection: 'row',
      marginBottom: 12,
      paddingLeft: 12
    }}>
      <Text style={{
        color: 'rgba(255, 255, 255, 0.6)',
        marginRight: 12,
        fontSize: 15,
        lineHeight: 24
      }}>
        •
      </Text>
      <Text style={{
        fontSize: 15,
        lineHeight: 24,
        color: 'rgba(255, 255, 255, 0.85)',
        flex: 1,
        letterSpacing: 0.1
      }}>
        {children}
      </Text>
    </View>
  );

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
              Privacy Policy
            </Text>
            <Text style={{
              fontSize: 14,
              color: 'rgba(255, 255, 255, 0.5)',
              marginTop: 4,
              letterSpacing: 0.2
            }}>
              Last updated: September 14, 2025
            </Text>
          </View>
        </View>

        {/* Content */}
        <Section title="Introduction">
          <Paragraph>
            At RivalPicks, we respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, and safeguard your information when you use our social betting platform.
          </Paragraph>
          <Paragraph>
            By using RivalPicks, you agree to the collection and use of information in accordance with this policy.
          </Paragraph>
        </Section>

        <Section title="Information We Collect">
          <Paragraph>
            We collect several types of information to provide and improve our service:
          </Paragraph>

          <Text style={{
            fontSize: 17,
            fontWeight: '600',
            color: '#ffffff',
            marginTop: 16,
            marginBottom: 12,
            letterSpacing: 0.2
          }}>
            Personal Information
          </Text>
          <ListItem>Name, email address, and username</ListItem>
          <ListItem>Profile picture and bio information</ListItem>
          <ListItem>Phone number (optional)</ListItem>
          <ListItem>Date of birth for age verification</ListItem>

          <Text style={{
            fontSize: 17,
            fontWeight: '600',
            color: '#ffffff',
            marginTop: 24,
            marginBottom: 12,
            letterSpacing: 0.2
          }}>
            Usage Information
          </Text>
          <ListItem>Betting history and preferences</ListItem>
          <ListItem>Group memberships and interactions</ListItem>
          <ListItem>Messages and communications within groups</ListItem>
          <ListItem>App usage patterns and preferences</ListItem>

          <Text style={{
            fontSize: 17,
            fontWeight: '600',
            color: '#ffffff',
            marginTop: 24,
            marginBottom: 12,
            letterSpacing: 0.2
          }}>
            Technical Information
          </Text>
          <ListItem>Device information and identifiers</ListItem>
          <ListItem>IP address and location data</ListItem>
          <ListItem>App version and crash reports</ListItem>
          <ListItem>Network and connection information</ListItem>
        </Section>

        <Section title="How We Use Your Information">
          <Paragraph>
            We use the collected information for the following purposes:
          </Paragraph>
          <ListItem>To provide and maintain our betting platform</ListItem>
          <ListItem>To facilitate group betting and social interactions</ListItem>
          <ListItem>To process and track betting transactions</ListItem>
          <ListItem>To send you notifications about bets and group activities</ListItem>
          <ListItem>To improve our app&apos;s functionality and user experience</ListItem>
          <ListItem>To ensure compliance with age restrictions and legal requirements</ListItem>
          <ListItem>To prevent fraud and maintain platform security</ListItem>
          <ListItem>To provide customer support and respond to your inquiries</ListItem>
        </Section>

        <Section title="Information Sharing">
          <Paragraph>
            We do not sell, trade, or rent your personal information to third parties. We may share your information in the following limited circumstances:
          </Paragraph>
          <ListItem>With other users in your groups (username, profile picture, betting activity)</ListItem>
          <ListItem>With service providers who assist in operating our platform</ListItem>
          <ListItem>When required by law or to protect our legal rights</ListItem>
          <ListItem>In case of a business transfer or merger (with prior notice)</ListItem>
          <ListItem>With your explicit consent for specific purposes</ListItem>
        </Section>

        <Section title="Data Security">
          <Paragraph>
            We implement industry-standard security measures to protect your personal information:
          </Paragraph>
          <ListItem>Encryption of data in transit and at rest</ListItem>
          <ListItem>Secure authentication and access controls</ListItem>
          <ListItem>Regular security audits and vulnerability assessments</ListItem>
          <ListItem>Limited access to personal data on a need-to-know basis</ListItem>
          <ListItem>Secure data centers with physical and digital protection</ListItem>

          <Paragraph>
            However, no method of transmission over the internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.
          </Paragraph>
        </Section>

        <Section title="Data Retention">
          <Paragraph>
            We retain your personal information for as long as necessary to provide our services and comply with legal obligations:
          </Paragraph>
          <ListItem>Account information: Until account deletion</ListItem>
          <ListItem>Betting history: 7 years for legal compliance</ListItem>
          <ListItem>Messages: 2 years or until group deletion</ListItem>
          <ListItem>Usage analytics: 2 years in anonymized form</ListItem>
          <ListItem>Support communications: 3 years</ListItem>
        </Section>

        <Section title="Your Privacy Rights">
          <Paragraph>
            You have the following rights regarding your personal data:
          </Paragraph>
          <ListItem>Access: Request a copy of your personal information</ListItem>
          <ListItem>Correction: Update or correct inaccurate information</ListItem>
          <ListItem>Deletion: Request deletion of your personal data</ListItem>
          <ListItem>Portability: Export your data in a readable format</ListItem>
          <ListItem>Objection: Object to certain processing activities</ListItem>
          <ListItem>Restriction: Request limited processing of your data</ListItem>

          <Paragraph>
            To exercise these rights, contact us at rivalpicksapp@gmail.com.
          </Paragraph>
        </Section>

        <Section title="Cookies and Tracking">
          <Paragraph>
            We use cookies and similar technologies to enhance your experience:
          </Paragraph>
          <ListItem>Essential cookies for app functionality</ListItem>
          <ListItem>Analytics cookies to understand usage patterns</ListItem>
          <ListItem>Preference cookies to remember your settings</ListItem>
          <ListItem>Performance cookies to optimize app speed</ListItem>

          <Paragraph>
            You can manage cookie preferences through your device settings or by contacting us.
          </Paragraph>
        </Section>

        <Section title="Children's Privacy">
          <Paragraph>
            RivalPicks is not intended for users under 18 years of age. We do not knowingly collect personal information from children under 18.
          </Paragraph>
          <Paragraph>
            If we discover that we have collected personal information from someone under 18, we will delete that information immediately. If you believe we have collected information from a minor, please contact us.
          </Paragraph>
        </Section>

        <Section title="International Transfers">
          <Paragraph>
            Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for such transfers, including:
          </Paragraph>
          <ListItem>Standard contractual clauses approved by regulatory authorities</ListItem>
          <ListItem>Adequacy decisions for countries with equivalent protection</ListItem>
          <ListItem>Your explicit consent for specific transfers</ListItem>
        </Section>

        <Section title="Changes to This Policy">
          <Paragraph>
            We may update this privacy policy from time to time. We will notify you of any material changes by:
          </Paragraph>
          <ListItem>Sending an email notification</ListItem>
          <ListItem>Posting a prominent notice in the app</ListItem>
          <ListItem>Updating the &quot;last updated&quot; date at the top of this policy</ListItem>

          <Paragraph>
            Continued use of RivalPicks after changes constitutes acceptance of the updated policy.
          </Paragraph>
        </Section>

        <Section title="Contact Us">
          <Paragraph>
            If you have questions about this privacy policy or our data practices, please contact us:
          </Paragraph>
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 12,
            padding: 20,
            marginTop: 8,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.05)'
          }}>
            <Text style={{
              fontSize: 15,
              color: 'rgba(255, 255, 255, 0.85)',
              lineHeight: 24,
              letterSpacing: 0.1
            }}>
              Email: rivalpicksapp@gmail.com
            </Text>
          </View>
        </Section>

        {/* Footer */}
        <View style={{
          alignItems: 'center',
          paddingTop: 40,
          paddingBottom: 20,
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.05)',
          marginTop: 40
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
