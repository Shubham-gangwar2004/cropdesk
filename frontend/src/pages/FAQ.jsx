import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/StaticPage.css';

const categories = [
  {
    title: 'Getting Started',
    icon: '🚀',
    items: [
      {
        q: 'What is CropDesk?',
        a: 'CropDesk is an online marketplace that connects farmers directly with dealers and buyers. Farmers can list their crops, set prices, and chat with buyers — all without middlemen.'
      },
      {
        q: 'How do I create an account?',
        a: 'Click "Register" on the top navigation bar. Choose your role (Farmer or Dealer), fill in your details, and submit. You\'ll receive a welcome email once your account is created.'
      },
      {
        q: 'Is CropDesk free to use?',
        a: 'Yes, creating an account and browsing the marketplace is completely free. We do not charge any listing fees or commissions on transactions.'
      },
      {
        q: 'What is the difference between a Farmer and a Dealer account?',
        a: 'Farmers can post crop listings, manage their inventory, and receive messages from buyers. Dealers can browse listings, contact farmers, and negotiate purchases. Both can chat with each other.'
      }
    ]
  },
  {
    title: 'Posting & Managing Crops',
    icon: '🌾',
    items: [
      {
        q: 'How do I post a crop listing?',
        a: 'Log in as a Farmer, click "Post Crop" in the navbar. Fill in the crop details — title, category, price, quantity, quality grade, location, and photos. Click "Post Crop" to publish.'
      },
      {
        q: 'Can I edit or delete my listing after posting?',
        a: 'Yes. Go to "My Listings" from the navbar. You can update the status (Available / Reserved / Sold) or delete the listing entirely.'
      },
      {
        q: 'How do I add photos to my listing?',
        a: 'On the Post Crop page, click "Upload Photos". You can select images from your device or take a photo directly using your camera on mobile devices.'
      },
      {
        q: 'What quality grades mean?',
        a: 'Grade A is premium quality — best appearance and freshness. Grade B is standard quality suitable for most buyers. Grade C is economy grade, often used for processing or bulk purchase.'
      }
    ]
  },
  {
    title: 'Location & Search',
    icon: '📍',
    items: [
      {
        q: 'How does the location-based search work?',
        a: 'When you open the Marketplace, CropDesk detects your location automatically and shows crops within 100 km by default. You can change the radius from 50 km up to Worldwide using the radius pills at the top.'
      },
      {
        q: 'Can I change my search location?',
        a: 'Yes. Click the location name at the top of the Marketplace page and type any city. Suggestions will appear as you type — select one to update your search area.'
      },
      {
        q: 'Why is my location not being detected?',
        a: 'Your browser may have blocked location access. Click the lock icon in your browser\'s address bar and allow location permissions, then refresh the page.'
      }
    ]
  },
  {
    title: 'Messaging & Chat',
    icon: '💬',
    items: [
      {
        q: 'How do I contact a seller?',
        a: 'Open any crop listing and click "Contact Seller". This opens a private chat with the farmer. You can discuss price, quantity, and delivery directly.'
      },
      {
        q: 'Can I delete messages?',
        a: 'Yes. Hover over any message to see action buttons. You can delete a message "for me" (only you won\'t see it) or "for everyone" (removes it from both sides). You can also select multiple messages and bulk delete.'
      },
      {
        q: 'What does the double tick mean?',
        a: 'A single tick (✓) means your message was sent. Double grey ticks (✓✓) mean it was delivered. Double green ticks mean the other person has read it.'
      },
      {
        q: 'Can I delete an entire conversation?',
        a: 'Yes. In the Messages list, hover over a conversation and click the trash icon. This removes the conversation from your view only — the other person\'s chat is not affected.'
      }
    ]
  },
  {
    title: 'Account & Security',
    icon: '🔐',
    items: [
      {
        q: 'How do I reset my password?',
        a: 'On the Login page, click "Forgot password?". Enter your registered email and we\'ll send you a reset link. The link expires in 1 hour.'
      },
      {
        q: 'How do I update my profile?',
        a: 'Click your profile avatar in the top-right corner and select "My Account". You can update your name, phone, bio, address, and profile photo.'
      },
      {
        q: 'Is my personal information safe?',
        a: 'Yes. We use industry-standard encryption for passwords and JWT tokens for authentication. We never share your personal data with third parties. See our Privacy Policy for full details.'
      }
    ]
  }
];

const FAQ = () => {
  const navigate = useNavigate();
  const [openItem, setOpenItem] = useState(null);
  const [search, setSearch] = useState('');

  const toggle = (key) => setOpenItem(openItem === key ? null : key);

  const filtered = search.trim()
    ? categories.map(cat => ({
        ...cat,
        items: cat.items.filter(
          item =>
            item.q.toLowerCase().includes(search.toLowerCase()) ||
            item.a.toLowerCase().includes(search.toLowerCase())
        )
      })).filter(cat => cat.items.length > 0)
    : categories;

  return (
    <div className="static-page">
      <div className="static-hero">
        <div className="static-hero-content">
          <h1>FAQ & Help Center</h1>
          <p>Find answers to the most common questions about CropDesk</p>
          <div className="faq-search-wrap">
            <input
              className="faq-search"
              type="text"
              placeholder="Search questions..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="static-content">
        {filtered.length === 0 ? (
          <div className="faq-no-results">
            <p>No results found for "<strong>{search}</strong>"</p>
            <button onClick={() => setSearch('')}>Clear search</button>
          </div>
        ) : (
          filtered.map((cat, ci) => (
            <section key={ci} className="faq-category">
              <h2 className="faq-cat-title">{cat.icon} {cat.title}</h2>
              <div className="faq-list">
                {cat.items.map((item, ii) => {
                  const key = `${ci}-${ii}`;
                  const isOpen = openItem === key;
                  return (
                    <div key={ii} className={`faq-item ${isOpen ? 'open' : ''}`}>
                      <button className="faq-question" onClick={() => toggle(key)}>
                        <span>{item.q}</span>
                        <span className="faq-chevron">{isOpen ? '▲' : '▼'}</span>
                      </button>
                      {isOpen && <div className="faq-answer">{item.a}</div>}
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}

        <div className="static-cta">
          <h2>Still need help?</h2>
          <p>Our support team is happy to assist you with any questions not covered here.</p>
          <button className="btn-primary" onClick={() => navigate('/contact')}>Contact Support</button>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
