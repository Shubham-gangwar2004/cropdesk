// About.jsx
import React from 'react';
import "../styles/About.css";

export default function About() {
  return (
    <div className="about-page">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1>About CropDesk</h1>
          <p className="hero-subtitle">
            Your gateway to farming marketplace. Buy, sell, and produce with ease.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        
        {/* Our Story */}
        <section className="story-section">
          <h2>Our Story</h2>
          <div className="story-content">
            <p>
              We are a company dedicated to providing the best services to our customers. 
              CropDesk was born from a simple vision: to create a seamless bridge between 
              farmers and buyers, making agricultural commerce accessible, transparent, and 
              efficient for everyone.
            </p>
            <p>
              In today's rapidly evolving agricultural landscape, we recognized the need for 
              a platform that empowers farmers to reach wider markets while giving buyers 
              direct access to fresh, quality produce. Our marketplace removes traditional 
              barriers and creates opportunities for growth and prosperity across the farming 
              community.
            </p>
            <p>
              Whether you're a small-scale farmer looking to expand your reach or a buyer 
              seeking fresh, locally-sourced products, CropDesk provides the tools, support, 
              and community you need to thrive.
            </p>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="mission-vision-section">
          <div className="mission-vision-grid">
            <div className="mission-card">
              <div className="card-icon">🎯</div>
              <h3>Our Mission</h3>
              <p>
                To revolutionize agricultural commerce by creating a transparent, efficient, 
                and user-friendly marketplace that empowers farmers and connects them directly 
                with buyers, fostering sustainable growth and prosperity in farming communities.
              </p>
            </div>
            
            <div className="vision-card">
              <div className="card-icon">📈</div>
              <h3>Our Vision</h3>
              <p>
                To become the leading agricultural marketplace that transforms how farming 
                products are bought and sold, creating a thriving ecosystem where farmers 
                prosper, buyers access quality products, and communities grow stronger together.
              </p>
            </div>
          </div>
        </section>

        {/* Core Values */}
        <section className="values-section">
          <h2>Our Core Values</h2>
          <div className="values-grid">
            <div className="value-card">
              <div className="value-icon">❤️</div>
              <h4>Integrity</h4>
              <p>
                We operate with honesty and transparency, building trust with every 
                transaction and interaction.
              </p>
            </div>
            
            <div className="value-card">
              <div className="value-icon">👥</div>
              <h4>Community</h4>
              <p>
                We believe in the power of collaboration and supporting each other's 
                growth and success.
              </p>
            </div>
            
            <div className="value-card">
              <div className="value-icon">🏆</div>
              <h4>Excellence</h4>
              <p>
                We strive for excellence in everything we do, from platform features 
                to customer service.
              </p>
            </div>
          </div>
        </section>

        {/* What We Offer */}
        <section className="offer-section">
          <h2>What We Offer</h2>
          <div className="offer-grid">
            <div className="offer-card">
              <div className="offer-icon">🌱</div>
              <h4>For Farmers</h4>
              <ul>
                <li>Easy listing and management of your crops and produce</li>
                <li>Direct access to buyers without middlemen</li>
                <li>Fair pricing and transparent transactions</li>
                <li>Tools to grow your farming business</li>
              </ul>
            </div>
            
            <div className="offer-card">
              <div className="offer-icon">👨‍🌾</div>
              <h4>For Buyers</h4>
              <ul>
                <li>Wide selection of fresh, quality agricultural products</li>
                <li>Direct connection with local farmers</li>
                <li>Competitive prices and secure transactions</li>
                <li>Reliable delivery and customer support</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="cta-section">
          <h2>Join Our Growing Community</h2>
          <p className="cta-text">
            Whether you're looking to sell your produce or find the best agricultural 
            products, CropDesk is here to help you succeed.
          </p>
          <div className="cta-buttons">
            <button className="btn-primary">Get Started</button>
            <button className="btn-secondary">Contact Us</button>
          </div>
        </section>
      </div>
      {/* <div id="maintenance-overlay">
        <div class="maintenance-box">
            <h2>Under Maintenance</h2>
            <p>We are currently performing scheduled maintenance to improve your experience.</p>
            <p>We apologize for any inconvenience and appreciate your patience.</p>
            <p><b>Please contact Shubham Gangwar!</b></p>
            <h2><button className="btn-primary" onClick={() => window.location.href = '/'}>Go to Homepage</button></h2>
        </div>
    </div> */}

    </div>
  );
}