import React from 'react';
import { Text, View, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function TermsOfServiceContent() {
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
              Terms of Service
            </Text>
            <Text style={{
              fontSize: 14,
              color: 'rgba(255, 255, 255, 0.5)',
              marginTop: 4,
              letterSpacing: 0.2
            }}>
              Last updated: December 19, 2025
            </Text>
          </View>
        </View>

        {/* Content */}
        <Section title="Agreement to Terms">
          <Paragraph>
            By accessing and using RivalPicks (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), you accept and agree to be bound by the terms and provision of this agreement.
          </Paragraph>
          <Paragraph>
            If you do not agree to abide by the above, please do not use this service.
          </Paragraph>
        </Section>

        <Section title="Use License">
          <Paragraph>
            Subject to your compliance with these Terms, RivalPicks grants you a limited, non-exclusive, non-transferable, revocable license to download, install, and use the application on devices you own or control for your personal, non-commercial use.
          </Paragraph>
          <Paragraph>
            This license permits you to:
          </Paragraph>
          <ListItem>Access and use RivalPicks features including betting, groups, and social interactions</ListItem>
          <ListItem>Store your account data and betting history within the app</ListItem>
          <Paragraph>
            Under this license, you may not:
          </Paragraph>
          <ListItem>Copy, modify, or create derivative works of the app or its content</ListItem>
          <ListItem>Reverse engineer, decompile, or disassemble any part of the software</ListItem>
          <ListItem>Use the app for any commercial purpose or public display</ListItem>
          <ListItem>Remove or alter any copyright, trademark, or proprietary notices</ListItem>
          <ListItem>Transfer, sublicense, or assign your license to any third party</ListItem>
          <Paragraph>
            This license is effective until terminated. Your rights under this license will terminate automatically without notice if you fail to comply with any of these terms. Upon termination, you must cease all use of the app and delete all copies from your devices.
          </Paragraph>
        </Section>

        <Section title="User Account">
          <Paragraph>
            When you create an account with us, you must provide information that is accurate, complete, and current at all times.
          </Paragraph>
          <Paragraph>
            You are responsible for safeguarding the password and for all activities that occur under your account.
          </Paragraph>
        </Section>

        <Section title="Betting">
          <Paragraph>
            RivalPicks enables users to create and participate in bets within groups. All betting on RivalPicks is for entertainment purposes only.
          </Paragraph>
          <Paragraph>
            By using our betting features, you acknowledge and agree to the following:
          </Paragraph>
          <ListItem>You must be 18 years of age or older to use betting features</ListItem>
          <ListItem>RivalPicks does not facilitate real-money gambling or wagering</ListItem>
          <ListItem>All bets and stakes are made at your own discretion and risk</ListItem>
          <ListItem>RivalPicks does not mediate, enforce, or guarantee the fulfillment of any stakes between users</ListItem>
          <ListItem>You are solely responsible for any arrangements made with other users</ListItem>
          <ListItem>RivalPicks is not responsible for disputes arising between users</ListItem>
          <ListItem>We reserve the right to suspend or terminate accounts that violate our policies</ListItem>
        </Section>

        <Section title="Content Policy">
          <Paragraph>
            Our service allows you to post, link, store, share, and otherwise make available certain information, text, graphics, or other material (&quot;User Content&quot;). You are solely responsible for the User Content that you post to the service.
          </Paragraph>
          <Paragraph>
            You retain ownership of your User Content. By posting User Content to RivalPicks, you grant us a worldwide, non-exclusive, royalty-free, sublicensable, and transferable license to use, reproduce, modify, adapt, publish, publicly display, publicly perform, and distribute such content in connection with operating and providing the service.
          </Paragraph>
          <Paragraph>
            By posting User Content, you represent and warrant that:
          </Paragraph>
          <ListItem>You own or have the necessary rights and permissions to post the content</ListItem>
          <ListItem>Your content does not violate the rights of any third party, including intellectual property, privacy, or publicity rights</ListItem>
          <ListItem>Your content complies with all applicable laws and regulations</ListItem>
          <Paragraph>
            The following types of content are strictly prohibited:
          </Paragraph>
          <ListItem>Illegal content or content that promotes illegal activities</ListItem>
          <ListItem>Hate speech, harassment, bullying, or content that promotes violence or discrimination</ListItem>
          <ListItem>Sexually explicit or obscene material</ListItem>
          <ListItem>Spam, phishing, or malicious content</ListItem>
          <ListItem>Content that infringes on copyrights, trademarks, or other intellectual property rights</ListItem>
          <ListItem>False, misleading, or deceptive content</ListItem>
          <Paragraph>
            We reserve the right to remove any User Content at our sole discretion, without prior notice, for any reason, including content that we believe violates these Terms or is otherwise objectionable.
          </Paragraph>
          <Paragraph>
            You agree to indemnify and hold harmless RivalPicks and its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising out of or related to your User Content or your violation of these Terms.
          </Paragraph>
          <Paragraph>
            If you believe that any content on RivalPicks infringes your copyright, please contact us at rivalpicksapp@gmail.com with a description of the alleged infringement.
          </Paragraph>
        </Section>

        <Section title="Privacy Policy">
          <Paragraph>
            Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the service, to understand our practices.
          </Paragraph>
        </Section>

        <Section title="Prohibited Uses">
          <Paragraph>
            You agree not to use RivalPicks in any way that violates these Terms or applicable laws. The following activities are strictly prohibited:
          </Paragraph>
          <Paragraph>
            General Prohibitions:
          </Paragraph>
          <ListItem>Using the service for any unlawful purpose or to solicit others to perform unlawful acts</ListItem>
          <ListItem>Violating any international, federal, provincial, state, or local laws and regulations</ListItem>
          <ListItem>Infringing upon or violating our intellectual property rights or the intellectual property rights of others</ListItem>
          <ListItem>Harassing, abusing, insulting, threatening, defaming, or discriminating against any individual or group</ListItem>
          <ListItem>Submitting false, misleading, or fraudulent information</ListItem>
          <ListItem>Using the service if you are under 18 years of age</ListItem>
          <Paragraph>
            Account Abuse:
          </Paragraph>
          <ListItem>Creating multiple accounts or using fake identities</ListItem>
          <ListItem>Sharing, selling, transferring, or trading your account with others</ListItem>
          <ListItem>Using another person&apos;s account without their permission</ListItem>
          <ListItem>Impersonating any person, including other users or RivalPicks staff</ListItem>
          <Paragraph>
            Technical and Security Violations:
          </Paragraph>
          <ListItem>Attempting to gain unauthorized access to the service, other accounts, or computer systems</ListItem>
          <ListItem>Using bots, scrapers, spiders, or other automated tools to access or interact with the service</ListItem>
          <ListItem>Hacking, exploiting vulnerabilities, or attempting to compromise the security of the service</ListItem>
          <ListItem>Interfering with or disrupting the service, servers, or networks connected to the service</ListItem>
          <ListItem>Circumventing, disabling, or interfering with security features of the service</ListItem>
          <ListItem>Reverse engineering, decompiling, or disassembling any part of the service</ListItem>
          <Paragraph>
            Betting-Related Misconduct:
          </Paragraph>
          <ListItem>Match-fixing, outcome manipulation, or any form of cheating</ListItem>
          <ListItem>Colluding with other users to gain an unfair advantage</ListItem>
          <ListItem>Exploiting bugs, glitches, or errors for personal benefit</ListItem>
          <ListItem>Using insider information to influence betting outcomes</ListItem>
          <ListItem>Manipulating group standings or bet results through fraudulent means</ListItem>
          <Paragraph>
            Commercial and Spam Activities:
          </Paragraph>
          <ListItem>Advertising, promoting, or soliciting without our prior written consent</ListItem>
          <ListItem>Sending spam, chain letters, or unsolicited communications to other users</ListItem>
          <ListItem>Promoting pyramid schemes, multi-level marketing, or similar programs</ListItem>
          <ListItem>Using the service for any commercial purpose not expressly permitted</ListItem>
          <Paragraph>
            Violation of these prohibitions may result in immediate suspension or permanent termination of your account, removal of content, and potential legal action. We reserve the right to report any illegal activities to appropriate law enforcement authorities.
          </Paragraph>
        </Section>

        <Section title="Service Availability">
          <Paragraph>
            We strive to maintain reliable access to RivalPicks, but we do not guarantee uninterrupted or error-free service. The service may be temporarily unavailable due to:
          </Paragraph>
          <ListItem>Scheduled maintenance and updates (we aim to notify users in advance when possible)</ListItem>
          <ListItem>Unplanned outages, technical issues, or emergency maintenance</ListItem>
          <ListItem>Third-party service disruptions (hosting providers, data services, APIs)</ListItem>
          <ListItem>Circumstances beyond our control, including natural disasters, cyberattacks, or infrastructure failures</ListItem>
          <Paragraph>
            We reserve the right to modify, suspend, or discontinue any part of the service at any time, with or without notice. This includes adding, removing, or changing features, functionality, or content.
          </Paragraph>
          <Paragraph>
            In the event of planned service changes or discontinuation, we will make reasonable efforts to notify users through the app or via email. However, we are not obligated to maintain, support, or update the service indefinitely.
          </Paragraph>
          <Paragraph>
            RivalPicks is not liable for any loss, damage, or inconvenience caused by service unavailability, interruptions, or modifications. Your continued use of the service after any changes constitutes acceptance of those changes.
          </Paragraph>
        </Section>

        <Section title="Disclaimer">
          <Paragraph>
            RivalPicks is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either express or implied, including but not limited to:
          </Paragraph>
          <ListItem>Merchantability or fitness for a particular purpose</ListItem>
          <ListItem>Uninterrupted, secure, or error-free operation</ListItem>
          <ListItem>Accuracy or reliability of any information or content</ListItem>
          <ListItem>Results or outcomes of any bets or predictions</ListItem>
          <Paragraph>
            RivalPicks is an entertainment platform. We do not guarantee any particular outcome and are not responsible for interactions, disputes, or arrangements between users.
          </Paragraph>
        </Section>

        <Section title="Limitation of Liability">
          <Paragraph>
            To the maximum extent permitted by applicable law, RivalPicks and its owner shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, goodwill, use, or other intangible losses, resulting from:
          </Paragraph>
          <ListItem>Your access to, use of, or inability to use the service</ListItem>
          <ListItem>Any conduct or content of other users or third parties on the service</ListItem>
          <ListItem>Any bets, predictions, outcomes, or stakes made through the service</ListItem>
          <ListItem>Disputes or arrangements between you and other users</ListItem>
          <ListItem>Unauthorized access to or alteration of your data or account</ListItem>
          <ListItem>Service interruptions, errors, or data loss</ListItem>
          <Paragraph>
            In no event shall our total liability to you for all claims exceed the greater of fifty dollars ($50 USD) or the amount you have paid to RivalPicks in the twelve (12) months preceding the claim.
          </Paragraph>
          <Paragraph>
            Some jurisdictions do not allow the exclusion or limitation of certain damages. If these laws apply to you, some or all of the above exclusions or limitations may not apply, and you may have additional rights.
          </Paragraph>
          <Paragraph>
            You acknowledge that RivalPicks is an entertainment platform and that you use the service at your own risk. We are not responsible for any real-world consequences arising from your use of the betting features.
          </Paragraph>
        </Section>

        <Section title="Assumption of Risk">
          <Paragraph>
            BY USING RIVALPICKS, YOU EXPRESSLY ACKNOWLEDGE AND AGREE THAT YOUR USE OF THE SERVICE IS AT YOUR SOLE RISK. You voluntarily assume all risks associated with:
          </Paragraph>
          <ListItem>Participation in any betting, prediction, or competition features</ListItem>
          <ListItem>Any stakes, wagers, or arrangements made with other users</ListItem>
          <ListItem>Interactions with other users, whether online or offline</ListItem>
          <ListItem>Reliance on any information, content, or predictions provided through the service</ListItem>
          <ListItem>Any financial, social, or personal consequences arising from your use of the service</ListItem>
          <Paragraph>
            You understand that betting and prediction activities involve inherent risks, including the possibility of loss. RivalPicks makes no guarantees regarding outcomes, and you accept full responsibility for your decisions and actions while using the service.
          </Paragraph>
          <Paragraph>
            You acknowledge that you are solely responsible for complying with all applicable laws and regulations in your jurisdiction regarding betting, gaming, or related activities. RivalPicks does not represent or warrant that the service is legal in your jurisdiction.
          </Paragraph>
        </Section>

        <Section title="Indemnification">
          <Paragraph>
            You agree to defend, indemnify, and hold harmless RivalPicks, its owner, affiliates, licensors, and service providers, and their respective officers, directors, employees, contractors, agents, licensors, suppliers, successors, and assigns from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable attorneys&apos; fees) arising out of or relating to:
          </Paragraph>
          <ListItem>Your violation of these Terms of Service</ListItem>
          <ListItem>Your User Content or any content you submit, post, or transmit through the service</ListItem>
          <ListItem>Your use or misuse of the service</ListItem>
          <ListItem>Your violation of any law, rule, or regulation, or the rights of any third party</ListItem>
          <ListItem>Any dispute or issue between you and any other user</ListItem>
          <ListItem>Any stakes, bets, or arrangements you make with other users</ListItem>
          <ListItem>Your negligent or wrongful conduct</ListItem>
          <Paragraph>
            This indemnification obligation will survive the termination of these Terms and your use of the service.
          </Paragraph>
        </Section>

        <Section title="No Professional Advice">
          <Paragraph>
            RivalPicks is an entertainment platform only. Nothing contained in the service constitutes or should be construed as:
          </Paragraph>
          <ListItem>Gambling advice or encouragement to gamble</ListItem>
          <ListItem>Financial, investment, or trading advice</ListItem>
          <ListItem>Legal advice or legal opinion</ListItem>
          <ListItem>Professional advice of any kind</ListItem>
          <Paragraph>
            Any predictions, picks, analysis, or information provided through the service are for entertainment purposes only and should not be relied upon for making financial decisions. You should consult with appropriate professionals before making any decisions based on information obtained through the service.
          </Paragraph>
          <Paragraph>
            RivalPicks is not a licensed gambling operator, bookmaker, or financial advisor. We do not facilitate real-money gambling transactions. Any arrangements users make among themselves are entirely at their own risk and discretion.
          </Paragraph>
        </Section>

        <Section title="Governing Law">
          <Paragraph>
            These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law provisions.
          </Paragraph>
        </Section>

        <Section title="Dispute Resolution and Arbitration">
          <Paragraph>
            PLEASE READ THIS SECTION CAREFULLY. IT AFFECTS YOUR LEGAL RIGHTS, INCLUDING YOUR RIGHT TO FILE A LAWSUIT IN COURT.
          </Paragraph>
          <Paragraph>
            Informal Resolution: Before filing any claim, you agree to first contact us at rivalpicksapp@gmail.com to attempt to resolve the dispute informally. We will attempt to resolve the dispute by contacting you via email. If a dispute is not resolved within sixty (60) days of submission, you or RivalPicks may proceed with formal dispute resolution as outlined below.
          </Paragraph>
          <Paragraph>
            Binding Arbitration: If we cannot resolve a dispute informally, any dispute, claim, or controversy arising out of or relating to these Terms or your use of RivalPicks, including the determination of the scope or applicability of this agreement to arbitrate, shall be determined by binding arbitration administered by JAMS pursuant to its Streamlined Arbitration Rules and Procedures. The arbitration will be conducted in the State of Delaware, unless you and RivalPicks agree otherwise. Judgment on the award rendered by the arbitrator may be entered in any court having jurisdiction.
          </Paragraph>
          <Paragraph>
            CLASS ACTION WAIVER: YOU AND RIVALPICKS AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS, COLLECTIVE, OR REPRESENTATIVE PROCEEDING. Unless both you and RivalPicks agree otherwise, the arbitrator may not consolidate more than one person&apos;s claims and may not otherwise preside over any form of a representative or class proceeding.
          </Paragraph>
          <Paragraph>
            Waiver of Jury Trial: BY AGREEING TO THESE TERMS, YOU ARE WAIVING YOUR RIGHT TO A JURY TRIAL. You may opt out of this arbitration agreement by sending written notice of your decision to opt out to rivalpicksapp@gmail.com within thirty (30) days of first accepting these Terms. Your notice must include your name, address, and a clear statement that you wish to opt out of this arbitration agreement.
          </Paragraph>
          <Paragraph>
            Exceptions: Notwithstanding the above, either party may bring an individual action in small claims court for disputes or claims within the scope of its jurisdiction. Additionally, either party may seek injunctive or other equitable relief in any court of competent jurisdiction to prevent the actual or threatened infringement, misappropriation, or violation of a party&apos;s copyrights, trademarks, trade secrets, patents, or other intellectual property rights.
          </Paragraph>
        </Section>

        <Section title="Severability and Waiver">
          <Paragraph>
            If any provision of these Terms is found by a court of competent jurisdiction to be invalid, illegal, or unenforceable, such provision shall be modified to the minimum extent necessary to make it valid and enforceable, or if modification is not possible, shall be severed from these Terms. The remaining provisions will continue in full force and effect.
          </Paragraph>
          <Paragraph>
            Our failure to enforce any right or provision of these Terms shall not constitute a waiver of such right or provision. Any waiver of any provision of these Terms will be effective only if in writing and signed by RivalPicks.
          </Paragraph>
        </Section>

        <Section title="Entire Agreement">
          <Paragraph>
            These Terms of Service, together with our Privacy Policy and any other legal notices or agreements published by us on the service, constitute the entire agreement between you and RivalPicks regarding your use of the service.
          </Paragraph>
          <Paragraph>
            These Terms supersede any prior agreements, communications, or understandings between you and RivalPicks, whether oral or written, regarding the subject matter hereof.
          </Paragraph>
          <Paragraph>
            No waiver of any term of these Terms shall be deemed a further or continuing waiver of such term or any other term, and RivalPicks&apos;s failure to assert any right or provision under these Terms shall not constitute a waiver of such right or provision.
          </Paragraph>
        </Section>

        <Section title="Assignment">
          <Paragraph>
            You may not assign, transfer, or sublicense any of your rights or obligations under these Terms without our prior written consent. RivalPicks may assign, transfer, or sublicense any or all of its rights and obligations under these Terms without restriction or notification to you.
          </Paragraph>
        </Section>

        <Section title="Changes to Terms">
          <Paragraph>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will notify you of any changes by posting the updated Terms on this page and updating the &quot;Last updated&quot; date. Changes are effective immediately upon posting.
          </Paragraph>
          <Paragraph>
            Your continued use of RivalPicks after any changes constitutes your acceptance of the revised Terms. If you do not agree to the revised Terms, you must stop using the service and delete your account.
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
