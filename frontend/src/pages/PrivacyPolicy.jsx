import '../styles/StaticPage.css';

const sections = [
  {
    title: '1. Information We Collect',
    content: [
      {
        sub: 'Account Information',
        text: 'When you register, we collect your first name, last name, email address, password (stored as a secure hash), and your role (Farmer or Dealer).'
      },
      {
        sub: 'Profile Information',
        text: 'You may optionally provide a profile photo, phone number, bio, and address. This information is visible to other users on your public profile.'
      },
      {
        sub: 'Listing Information',
        text: 'When you post a crop, we collect the details you provide including title, description, price, quantity, location, and images.'
      },
      {
        sub: 'Location Data',
        text: 'With your permission, we collect your device\'s GPS coordinates to show nearby crops. You can deny this permission and enter your location manually at any time.'
      },
      {
        sub: 'Messages',
        text: 'We store messages exchanged between users to provide the chat functionality. Messages marked as "deleted for everyone" are removed from our servers.'
      }
    ]
  },
  {
    title: '2. How We Use Your Information',
    content: [
      { sub: 'To provide the service', text: 'We use your information to operate the marketplace, enable communication between farmers and buyers, and display relevant crop listings.' },
      { sub: 'To send emails', text: 'We send a welcome email when you register and a password reset email when requested. We do not send marketing emails without your consent.' },
      { sub: 'To improve the platform', text: 'We analyse usage patterns (such as views on listings) to improve features and user experience.' },
      { sub: 'To ensure security', text: 'We use your information to detect and prevent fraud, abuse, and unauthorised access.' }
    ]
  },
  {
    title: '3. How We Share Your Information',
    content: [
      { sub: 'With other users', text: 'Your name, role, and listing details are visible to other users on the marketplace. Your email is visible on product listings to facilitate contact.' },
      { sub: 'We do not sell your data', text: 'CropDesk does not sell, rent, or trade your personal information to third parties for marketing purposes.' },
      { sub: 'Legal requirements', text: 'We may disclose your information if required by law or in response to valid legal processes.' }
    ]
  },
  {
    title: '4. Data Storage & Security',
    content: [
      { sub: 'Storage', text: 'Your data is stored on MongoDB Atlas servers. Passwords are hashed using bcrypt and are never stored in plain text.' },
      { sub: 'Authentication', text: 'We use JSON Web Tokens (JWT) with a 7-day expiry for session management. Tokens are stored in your browser\'s localStorage.' },
      { sub: 'Images', text: 'Product and profile images are stored as base64 encoded strings in our database. We recommend not uploading images containing sensitive personal information.' }
    ]
  },
  {
    title: '5. Your Rights',
    content: [
      { sub: 'Access & Update', text: 'You can view and update your personal information at any time through the "My Account" page.' },
      { sub: 'Delete your account', text: 'You may request deletion of your account and all associated data by contacting us at support@cropdesk.in.' },
      { sub: 'Location permissions', text: 'You can revoke location access at any time through your browser settings.' }
    ]
  },
  {
    title: '6. Cookies',
    content: [
      { sub: 'We do not use tracking cookies', text: 'CropDesk does not use advertising or tracking cookies. We only use localStorage for storing your authentication token.' }
    ]
  },
  {
    title: '7. Changes to This Policy',
    content: [
      { sub: 'Updates', text: 'We may update this Privacy Policy from time to time. We will notify you of significant changes by email or by displaying a notice on the platform. Continued use of CropDesk after changes constitutes acceptance of the updated policy.' }
    ]
  },
  {
    title: '8. Contact Us',
    content: [
      { sub: 'Questions?', text: 'If you have any questions about this Privacy Policy, please contact us at privacy@cropdesk.in or through our Contact page.' }
    ]
  }
];

const PrivacyPolicy = () => (
  <div className="static-page">
    <div className="static-hero">
      <div className="static-hero-content">
        <h1>Privacy Policy</h1>
        <p>Last updated: April 2, 2026</p>
      </div>
    </div>

    <div className="static-content">
      <div className="legal-intro">
        <p>
          At CropDesk, we take your privacy seriously. This Privacy Policy explains what information
          we collect, how we use it, and your rights regarding your personal data. By using CropDesk,
          you agree to the practices described in this policy.
        </p>
      </div>

      {sections.map((sec, i) => (
        <section key={i} className="legal-section">
          <h2>{sec.title}</h2>
          {sec.content.map((item, j) => (
            <div key={j} className="legal-item">
              <h4>{item.sub}</h4>
              <p>{item.text}</p>
            </div>
          ))}
        </section>
      ))}
    </div>
  </div>
);

export default PrivacyPolicy;
