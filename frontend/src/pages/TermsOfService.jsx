import '../styles/StaticPage.css';

const sections = [
  {
    title: '1. Acceptance of Terms',
    content: 'By accessing or using CropDesk, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not use the platform. We reserve the right to update these terms at any time, and continued use of the platform constitutes acceptance of any changes.'
  },
  {
    title: '2. Eligibility',
    content: 'You must be at least 18 years old to create an account on CropDesk. By registering, you confirm that the information you provide is accurate and that you have the legal capacity to enter into these terms.'
  },
  {
    title: '3. User Accounts',
    items: [
      'You are responsible for maintaining the confidentiality of your account credentials.',
      'You must not share your account with others or allow unauthorised access.',
      'You are responsible for all activity that occurs under your account.',
      'You must notify us immediately at support@cropdesk.in if you suspect unauthorised use of your account.',
      'We reserve the right to suspend or terminate accounts that violate these terms.'
    ]
  },
  {
    title: '4. Farmer Responsibilities',
    items: [
      'Listings must accurately describe the crop — title, quality, quantity, price, and location must be truthful.',
      'You must only list crops that you own or have the legal right to sell.',
      'You are responsible for fulfilling orders and communicating honestly with buyers.',
      'Fraudulent listings, fake quality grades, or misrepresentation of produce is strictly prohibited.',
      'You must comply with all applicable agricultural laws and regulations in your region.'
    ]
  },
  {
    title: '5. Dealer / Buyer Responsibilities',
    items: [
      'You must communicate respectfully and honestly with farmers.',
      'You must not make offers in bad faith or waste farmers\' time with non-serious inquiries.',
      'Any agreements made through CropDesk chat are between you and the farmer directly. CropDesk is not a party to these transactions.',
      'You are responsible for verifying the quality and quantity of produce before completing a purchase.'
    ]
  },
  {
    title: '6. Prohibited Conduct',
    content: 'The following activities are strictly prohibited on CropDesk:',
    items: [
      'Posting false, misleading, or fraudulent listings.',
      'Harassing, threatening, or abusing other users.',
      'Attempting to hack, scrape, or disrupt the platform.',
      'Using the platform for any illegal activity.',
      'Creating multiple accounts to circumvent bans or restrictions.',
      'Posting spam, unsolicited advertisements, or irrelevant content.',
      'Impersonating another person or organisation.'
    ]
  },
  {
    title: '7. Intellectual Property',
    content: 'All content on CropDesk — including the logo, design, code, and text — is the property of CropDesk and is protected by applicable intellectual property laws. You may not copy, reproduce, or distribute any part of the platform without written permission. By posting content (listings, images, messages), you grant CropDesk a non-exclusive licence to display that content on the platform.'
  },
  {
    title: '8. Disclaimer of Warranties',
    content: 'CropDesk is provided "as is" without warranties of any kind. We do not guarantee the accuracy of listings, the quality of produce, or the reliability of any transaction. We are a marketplace platform and are not responsible for disputes between farmers and buyers.'
  },
  {
    title: '9. Limitation of Liability',
    content: 'To the maximum extent permitted by law, CropDesk shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform, including but not limited to loss of profits, data, or business opportunities.'
  },
  {
    title: '10. Termination',
    content: 'We reserve the right to suspend or permanently terminate your account at our discretion if you violate these Terms of Service. You may also delete your account at any time by contacting support@cropdesk.in. Upon termination, your listings will be removed and your data will be handled as described in our Privacy Policy.'
  },
  {
    title: '11. Governing Law',
    content: 'These Terms of Service are governed by the laws of India. Any disputes arising from the use of CropDesk shall be subject to the exclusive jurisdiction of the courts of India.'
  },
  {
    title: '12. Contact',
    content: 'For questions about these Terms of Service, please contact us at legal@cropdesk.in or through our Contact page.'
  }
];

const TermsOfService = () => (
  <div className="static-page">
    <div className="static-hero">
      <div className="static-hero-content">
        <h1>Terms of Service</h1>
        <p>Last updated: April 2, 2026</p>
      </div>
    </div>

    <div className="static-content">
      <div className="legal-intro">
        <p>
          Please read these Terms of Service carefully before using CropDesk. These terms govern
          your access to and use of our platform, including all features, content, and services
          offered through cropdesk.in.
        </p>
      </div>

      {sections.map((sec, i) => (
        <section key={i} className="legal-section">
          <h2>{sec.title}</h2>
          {sec.content && <p>{sec.content}</p>}
          {sec.items && (
            <ul className="legal-list">
              {sec.items.map((item, j) => <li key={j}>{item}</li>)}
            </ul>
          )}
        </section>
      ))}
    </div>
  </div>
);

export default TermsOfService;
