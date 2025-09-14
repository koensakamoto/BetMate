import React from 'react';
import { Text, View, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function TermsOfService() {
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
      
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ 
          paddingTop: insets.top + 16,
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
              Terms of Service
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
        <Section title="Agreement to Terms">
          <Paragraph>
            By accessing and using GroupReels ("we," "our," or "us"), you accept and agree to be bound by the terms and provision of this agreement.
          </Paragraph>
          <Paragraph>
            If you do not agree to abide by the above, please do not use this service.
          </Paragraph>
        </Section>

        <Section title="Use License">
          <Paragraph>
            Permission is granted to temporarily download one copy of GroupReels per device for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
          </Paragraph>
          <ListItem>modify or copy the materials</ListItem>
          <ListItem>use the materials for any commercial purpose or for any public display</ListItem>
          <ListItem>attempt to reverse engineer any software contained in GroupReels</ListItem>
          <ListItem>remove any copyright or other proprietary notations from the materials</ListItem>
        </Section>

        <Section title="User Account">
          <Paragraph>
            When you create an account with us, you must provide information that is accurate, complete, and current at all times.
          </Paragraph>
          <Paragraph>
            You are responsible for safeguarding the password and for all activities that occur under your account.
          </Paragraph>
        </Section>

        <Section title="Betting and Gaming">
          <Paragraph>
            GroupReels facilitates social betting among friends and groups. All betting activities are subject to the following:
          </Paragraph>
          <ListItem>You must be 18 years or older to participate in betting activities</ListItem>
          <ListItem>All bets are made voluntarily between consenting participants</ListItem>
          <ListItem>GroupReels is not responsible for disputes between betting participants</ListItem>
          <ListItem>We reserve the right to suspend accounts that violate betting policies</ListItem>
        </Section>

        <Section title="Content Policy">
          <Paragraph>
            Our service allows you to post, link, store, share and otherwise make available certain information, text, graphics, or other material. You are responsible for the content that you post to the service.
          </Paragraph>
          <Paragraph>
            By posting content to GroupReels, you grant us the right to use, modify, publicly perform, publicly display, reproduce, and distribute such content.
          </Paragraph>
        </Section>

        <Section title="Privacy Policy">
          <Paragraph>
            Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the service, to understand our practices.
          </Paragraph>
        </Section>

        <Section title="Prohibited Uses">
          <Paragraph>
            You may not use our service:
          </Paragraph>
          <ListItem>For any unlawful purpose or to solicit others to perform unlawful acts</ListItem>
          <ListItem>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</ListItem>
          <ListItem>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</ListItem>
          <ListItem>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</ListItem>
          <ListItem>To submit false or misleading information</ListItem>
        </Section>

        <Section title="Service Availability">
          <Paragraph>
            We reserve the right to withdraw or amend our service, and any service or material we provide, in our sole discretion without notice.
          </Paragraph>
          <Paragraph>
            We will not be liable if for any reason all or any part of the service is unavailable at any time or for any period.
          </Paragraph>
        </Section>

        <Section title="Disclaimer">
          <Paragraph>
            The information on this app is provided on an 'as is' basis. To the fullest extent permitted by law, this company excludes all representations, warranties, conditions and terms.
          </Paragraph>
        </Section>

        <Section title="Limitation of Liability">
          <Paragraph>
            In no event shall GroupReels, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages.
          </Paragraph>
        </Section>

        <Section title="Governing Law">
          <Paragraph>
            These terms and conditions are governed by and construed in accordance with the laws of the United States and you irrevocably submit to the exclusive jurisdiction of the courts.
          </Paragraph>
        </Section>

        <Section title="Changes to Terms">
          <Paragraph>
            We reserve the right, at our sole discretion, to modify or replace these terms at any time. If a revision is material, we will try to provide at least 30 days notice.
          </Paragraph>
          <Paragraph>
            By continuing to access or use our service after those revisions become effective, you agree to be bound by the revised terms.
          </Paragraph>
        </Section>

        <Section title="Contact Information">
          <Paragraph>
            If you have any questions about these Terms of Service, please contact us at:
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
              Email: legal@groupreels.com{'\n'}
              Address: 123 App Street, Tech City, TC 12345{'\n'}
              Phone: +1 (555) 123-4567
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
            GroupReels v1.0.0
          </Text>
          <Text style={{
            fontSize: 12,
            color: 'rgba(255, 255, 255, 0.3)',
            textAlign: 'center',
            marginTop: 8,
            letterSpacing: 0.2
          }}>
            © 2025 GroupReels. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}