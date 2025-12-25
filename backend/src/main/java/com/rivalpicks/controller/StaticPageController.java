package com.rivalpicks.controller;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/legal")
public class StaticPageController {

    @GetMapping(value = "/privacy-policy", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> privacyPolicy() {
        return ResponseEntity.ok(PRIVACY_POLICY_HTML);
    }

    @GetMapping(value = "/terms-of-service", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> termsOfService() {
        return ResponseEntity.ok(TERMS_OF_SERVICE_HTML);
    }

    @GetMapping(value = "/support", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> support() {
        return ResponseEntity.ok(SUPPORT_HTML);
    }

    private static final String SUPPORT_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Support - RivalPicks</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #0a0a0f;
            color: rgba(255, 255, 255, 0.85);
            line-height: 1.6;
            padding: 40px 24px;
            max-width: 800px;
            margin: 0 auto;
        }
        h1 { color: #ffffff; font-size: 28px; font-weight: 700; margin-bottom: 8px; }
        .subtitle { color: rgba(255, 255, 255, 0.5); font-size: 16px; margin-bottom: 48px; }
        h2 { color: #ffffff; font-size: 20px; font-weight: 700; margin-top: 40px; margin-bottom: 16px; }
        p { margin-bottom: 16px; font-size: 15px; }
        ul { margin-bottom: 16px; padding-left: 24px; }
        li { margin-bottom: 12px; font-size: 15px; }
        .contact-box {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            padding: 24px;
            margin-top: 16px;
            text-align: center;
        }
        .email-link {
            color: #00D4AA;
            font-size: 18px;
            text-decoration: none;
            font-weight: 600;
        }
        .email-link:hover { text-decoration: underline; }
        .faq-item { margin-bottom: 24px; }
        .faq-question { color: #ffffff; font-weight: 600; margin-bottom: 8px; }
        .footer {
            text-align: center;
            padding-top: 40px;
            margin-top: 40px;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            color: rgba(255, 255, 255, 0.4);
            font-size: 13px;
        }
    </style>
</head>
<body>
    <h1>Support</h1>
    <p class="subtitle">We're here to help</p>

    <h2>Contact Us</h2>
    <p>Have a question, issue, or feedback? Reach out to us and we'll get back to you as soon as possible.</p>
    <div class="contact-box">
        <p style="margin-bottom: 12px; color: rgba(255, 255, 255, 0.6);">Email us at</p>
        <a href="mailto:rivalpicksapp@gmail.com" class="email-link">rivalpicksapp@gmail.com</a>
    </div>

    <h2>Frequently Asked Questions</h2>

    <div class="faq-item">
        <p class="faq-question">How do I create a bet?</p>
        <p>Tap the "+" button on the home screen, enter your bet details, set a deadline, and invite friends to participate.</p>
    </div>

    <div class="faq-item">
        <p class="faq-question">What are credits?</p>
        <p>Credits are the virtual currency used in RivalPicks for betting. They have no real-world monetary value and are just for fun.</p>
    </div>

    <div class="faq-item">
        <p class="faq-question">How do I join a group?</p>
        <p>You can join a group by receiving an invite link from a friend, or by searching for public groups in the Groups tab.</p>
    </div>

    <div class="faq-item">
        <p class="faq-question">How do I delete my account?</p>
        <p>Go to Settings → Account → Delete Account. This will permanently remove all your data.</p>
    </div>

    <div class="faq-item">
        <p class="faq-question">I forgot my password</p>
        <p>On the login screen, tap "Forgot Password" and enter your email. We'll send you a link to reset it.</p>
    </div>

    <h2>Response Time</h2>
    <p>We typically respond within 24-48 hours. For urgent issues, please include "URGENT" in your email subject.</p>

    <div class="footer">
        <p>RivalPicks v1.0.0</p>
        <p style="margin-top: 8px; font-size: 12px; color: rgba(255, 255, 255, 0.3);">© 2025 RivalPicks. All rights reserved.</p>
    </div>
</body>
</html>
""";

    private static final String PRIVACY_POLICY_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy Policy - RivalPicks</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #0a0a0f;
            color: rgba(255, 255, 255, 0.85);
            line-height: 1.6;
            padding: 40px 24px;
            max-width: 800px;
            margin: 0 auto;
        }
        h1 { color: #ffffff; font-size: 28px; font-weight: 700; margin-bottom: 8px; }
        .last-updated { color: rgba(255, 255, 255, 0.5); font-size: 14px; margin-bottom: 48px; }
        h2 { color: #ffffff; font-size: 20px; font-weight: 700; margin-top: 40px; margin-bottom: 16px; }
        h3 { color: #ffffff; font-size: 17px; font-weight: 600; margin-top: 24px; margin-bottom: 12px; }
        p { margin-bottom: 16px; font-size: 15px; }
        ul { margin-bottom: 16px; padding-left: 24px; }
        li { margin-bottom: 12px; font-size: 15px; }
        .contact-box { background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 20px; margin-top: 8px; }
        .footer { text-align: center; padding-top: 40px; margin-top: 40px; border-top: 1px solid rgba(255, 255, 255, 0.05); color: rgba(255, 255, 255, 0.4); font-size: 13px; }
        a { color: #00D4AA; }
    </style>
</head>
<body>
    <h1>Privacy Policy</h1>
    <p class="last-updated">Last updated: December 19, 2025</p>

    <h2>Introduction</h2>
    <p>At RivalPicks, we respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, and safeguard your information when you use our social betting platform.</p>
    <p>By using RivalPicks, you agree to the collection and use of information in accordance with this policy.</p>

    <h2>Information We Collect</h2>
    <p>We collect several types of information to provide and improve our service:</p>

    <h3>Personal Information</h3>
    <ul>
        <li>Name, email address, and username</li>
        <li>Profile picture and bio information</li>
    </ul>

    <h3>Usage Information</h3>
    <ul>
        <li>Betting history and preferences</li>
        <li>Group memberships and interactions</li>
        <li>Messages and communications within groups</li>
        <li>App usage patterns and preferences</li>
    </ul>

    <h3>Technical Information</h3>
    <ul>
        <li>Device platform (iOS, Android, or Web)</li>
        <li>Push notification token for delivering alerts</li>
    </ul>

    <h2>How We Use Your Information</h2>
    <p>We use the collected information for the following purposes:</p>
    <ul>
        <li>To provide and maintain our betting platform</li>
        <li>To facilitate group betting and social interactions</li>
        <li>To process and track betting transactions</li>
        <li>To send you notifications about bets and group activities</li>
        <li>To improve our app's functionality and user experience</li>
        <li>To ensure compliance with age restrictions and legal requirements</li>
        <li>To prevent fraud and maintain platform security</li>
        <li>To provide customer support and respond to your inquiries</li>
    </ul>

    <h2>Information Sharing</h2>
    <p>We do not sell, trade, or rent your personal information to third parties.</p>
    <p>We may share your information in the following limited circumstances:</p>
    <ul>
        <li>With other users within your betting groups</li>
        <li>With service providers who assist in operating our platform</li>
        <li>When required by law or to protect our legal rights</li>
        <li>In case of a business transfer or merger, with prior notice to you</li>
        <li>With your explicit consent for specific purposes</li>
    </ul>

    <h2>Data Security</h2>
    <p>We implement the following security measures to protect your personal information:</p>
    <ul>
        <li>All data transmitted between your device and our servers is encrypted using TLS (HTTPS)</li>
        <li>Passwords are securely hashed using BCrypt with a high work factor and are never stored in plain text</li>
        <li>Authentication is handled via secure JSON Web Tokens (JWT) with automatic expiration</li>
        <li>Rate limiting is applied to sensitive endpoints to prevent brute-force attacks</li>
        <li>Security headers (CSP, HSTS, X-Frame-Options) protect against common web vulnerabilities</li>
        <li>Database connections are encrypted using SSL/TLS</li>
    </ul>
    <p>However, no method of transmission over the internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.</p>

    <h2>Data Breach Notification</h2>
    <p>In the event of a data breach that affects your personal information, we will:</p>
    <ul>
        <li>Notify affected users via email within 72 hours of discovering the breach</li>
        <li>Provide details about what information was affected</li>
        <li>Describe the steps we are taking to address the breach</li>
        <li>Offer guidance on steps you can take to protect yourself</li>
        <li>Report to relevant regulatory authorities as required by law</li>
    </ul>

    <h2>Data Retention</h2>
    <p>We retain your personal information for as long as necessary to provide our services and comply with legal obligations:</p>
    <ul>
        <li>Account information: Until you delete your account</li>
        <li>Betting history: As long as your account is active</li>
        <li>Messages: Until the group is deleted</li>
        <li>Usage analytics: As long as necessary for service improvement, in anonymized form</li>
        <li>Support communications: As long as necessary to resolve and reference past issues</li>
    </ul>

    <h2>Your Privacy Rights</h2>
    <p>You have the following rights regarding your personal data:</p>
    <ul>
        <li>Access: Download your data from Settings → Account → Export Data</li>
        <li>Correction: Update your profile in Settings → Profile</li>
        <li>Deletion: Delete your account in Settings → Account</li>
        <li>Portability: Export your data in a readable JSON format</li>
    </ul>
    <p>If you need assistance, contact us at rivalpicksapp@gmail.com.</p>

    <h2>Cookies and Tracking</h2>
    <p>We use secure local storage solely to maintain your login session. We do not use analytics cookies, tracking pixels, or third-party advertising trackers. Your usage data stays on your device unless explicitly shared through app features like group betting.</p>

    <h2>Children's Privacy</h2>
    <p>RivalPicks is not intended for users under 18 years of age. We do not knowingly collect personal information from children under 18.</p>
    <p>If we discover that we have collected personal information from someone under 18, we will delete that information immediately. If you believe we have collected information from a minor, please contact us.</p>

    <h2>International Transfers</h2>
    <p>Your data is stored and processed on servers located in the United States. By using RivalPicks, you consent to your information being transferred to and processed in the United States, which may have different data protection laws than your country of residence.</p>

    <h2>Changes to This Policy</h2>
    <p>We may update this privacy policy from time to time. We will notify you of any material changes by:</p>
    <ul>
        <li>Sending an email notification</li>
        <li>Posting a prominent notice in the app</li>
        <li>Updating the "last updated" date at the top of this policy</li>
    </ul>
    <p>Continued use of RivalPicks after changes constitutes acceptance of the updated policy.</p>

    <h2>Contact Us</h2>
    <p>If you have questions about this privacy policy or our data practices, please contact us:</p>
    <div class="contact-box">
        <p>Email: <a href="mailto:rivalpicksapp@gmail.com">rivalpicksapp@gmail.com</a></p>
    </div>

    <div class="footer">
        <p>RivalPicks v1.0.0</p>
        <p style="margin-top: 8px; font-size: 12px; color: rgba(255, 255, 255, 0.3);">© 2025 RivalPicks. All rights reserved.</p>
    </div>
</body>
</html>
""";

    private static final String TERMS_OF_SERVICE_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Terms of Service - RivalPicks</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #0a0a0f;
            color: rgba(255, 255, 255, 0.85);
            line-height: 1.6;
            padding: 40px 24px;
            max-width: 800px;
            margin: 0 auto;
        }
        h1 { color: #ffffff; font-size: 28px; font-weight: 700; margin-bottom: 8px; }
        .last-updated { color: rgba(255, 255, 255, 0.5); font-size: 14px; margin-bottom: 48px; }
        h2 { color: #ffffff; font-size: 20px; font-weight: 700; margin-top: 40px; margin-bottom: 16px; }
        p { margin-bottom: 16px; font-size: 15px; }
        ul { margin-bottom: 16px; padding-left: 24px; }
        li { margin-bottom: 12px; font-size: 15px; }
        .contact-box { background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 20px; margin-top: 8px; }
        .footer { text-align: center; padding-top: 40px; margin-top: 40px; border-top: 1px solid rgba(255, 255, 255, 0.05); color: rgba(255, 255, 255, 0.4); font-size: 13px; }
        a { color: #00D4AA; }
    </style>
</head>
<body>
    <h1>Terms of Service</h1>
    <p class="last-updated">Last updated: December 19, 2025</p>

    <h2>1. Acceptance of Terms</h2>
    <p>By accessing or using RivalPicks, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the app.</p>

    <h2>2. Eligibility</h2>
    <p>You must be at least 18 years old to use RivalPicks. By using the app, you represent and warrant that you meet this age requirement.</p>

    <h2>3. Account Registration</h2>
    <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>

    <h2>4. Acceptable Use</h2>
    <p>You agree not to:</p>
    <ul>
        <li>Use the app for any illegal purpose</li>
        <li>Harass, abuse, or harm other users</li>
        <li>Attempt to gain unauthorized access to the app or its systems</li>
        <li>Use automated systems to access the app without permission</li>
        <li>Interfere with the proper functioning of the app</li>
    </ul>

    <h2>5. Virtual Credits</h2>
    <p>RivalPicks uses virtual credits for betting purposes. These credits have no real-world monetary value and cannot be exchanged for cash or other items of value.</p>

    <h2>6. Termination</h2>
    <p>We reserve the right to suspend or terminate your account at any time for violations of these terms or for any other reason at our discretion.</p>

    <h2>7. Disclaimer of Warranties</h2>
    <p>RivalPicks is provided "as is" without warranties of any kind, either express or implied.</p>

    <h2>8. Limitation of Liability</h2>
    <p>To the fullest extent permitted by law, RivalPicks shall not be liable for any indirect, incidental, special, consequential, or punitive damages.</p>

    <h2>9. Changes to Terms</h2>
    <p>We may modify these terms at any time. Continued use of the app after changes constitutes acceptance of the new terms.</p>

    <h2>10. Contact Us</h2>
    <p>If you have questions about these terms, please contact us:</p>
    <div class="contact-box">
        <p>Email: <a href="mailto:rivalpicksapp@gmail.com">rivalpicksapp@gmail.com</a></p>
    </div>

    <div class="footer">
        <p>RivalPicks v1.0.0</p>
        <p style="margin-top: 8px; font-size: 12px; color: rgba(255, 255, 255, 0.3);">© 2025 RivalPicks. All rights reserved.</p>
    </div>
</body>
</html>
""";
}
