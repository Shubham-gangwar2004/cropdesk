// Contact.jsx
import { useState } from 'react';
import API_URL from '../config.js';
import "../styles/Contact.css";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const [errors, setErrors] = useState({});
  const [submitStatus, setSubmitStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length === 0) {
      setSubmitting(true);
      try {
        const res = await fetch(`${API_URL}/api/contact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        const data = await res.json();
        if (res.ok) {
          setSubmitStatus('success');
          setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
          setTimeout(() => setSubmitStatus(''), 6000);
        } else {
          setSubmitStatus('error');
          setErrors({ api: data.message });
        }
      } catch {
        setSubmitStatus('error');
        setErrors({ api: 'Unable to connect. Please try again.' });
      }
      setSubmitting(false);
    } else {
      setErrors(newErrors);
      setSubmitStatus('error');
    }
  };

  return (
    <div className="contact-page">
      {/* Hero Section */}
      <div className="contact-hero">
        <div className="hero-content">
          <h1>Contact Us</h1>
          <p className="hero-subtitle">
            We'd love to hear from you. Get in touch with our team.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="contact-container">
        
        {/* Contact Info Cards */}
        <section className="contact-info-section">
          <div className="info-cards">
            <div className="info-card">
              <div className="info-icon">📍</div>
              <h3>Visit Us</h3>
              <p>Lovely Professional University<br />Phagwara, Punjab, India<br />144411</p>
            </div>
            
            <div className="info-card">
              <div className="info-icon">📧</div>
              <h3>Email Us</h3>
              <p>cropdesk.help@gmail.com<br />info@cropdesk.com</p>
            </div>
            
            <div className="info-card">
              <div className="info-icon">📞</div>
              <h3>Call Us</h3>
              <p>+91 70044 88427<br />Mon-Sat: 9AM - 6PM</p>
            </div>
          </div>
        </section>

        {/* Contact Form Section */}
        <section className="contact-form-section">
          <div className="form-container">
            <div className="form-header">
              <h2>Send Us a Message</h2>
              <p>Fill out the form below and we'll get back to you as soon as possible.</p>
            </div>

            {submitStatus === 'success' && (
              <div className="alert alert-success">
                <span className="alert-icon">✓</span>
                Thank you! Your message has been sent. We'll get back to you soon.
              </div>
            )}

            {submitStatus === 'error' && errors.api && (
              <div className="alert alert-error">
                <span className="alert-icon">✕</span>
                {errors.api}
              </div>
            )}

            {submitStatus === 'error' && !errors.api && (
              <div className="alert alert-error">
                <span className="alert-icon">✕</span>
                Please fix the errors in the form before submitting.
              </div>
            )}

            <form onSubmit={handleSubmit} className="contact-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={errors.name ? 'error' : ''}
                    placeholder="Enter your full name"
                  />
                  {errors.name && <span className="error-message">{errors.name}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={errors.email ? 'error' : ''}
                    placeholder="Enter your email"
                  />
                  {errors.email && <span className="error-message">{errors.email}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="subject">Subject *</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className={errors.subject ? 'error' : ''}
                    placeholder="What is this about?"
                  />
                  {errors.subject && <span className="error-message">{errors.subject}</span>}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="message">Message *</label>
                <textarea
                  id="message"
                  name="message"
                  rows="6"
                  value={formData.message}
                  onChange={handleChange}
                  className={errors.message ? 'error' : ''}
                  placeholder="Tell us more about your inquiry..."
                ></textarea>
                {errors.message && <span className="error-message">{errors.message}</span>}
              </div>

              <button type="submit" className="submit-btn" disabled={submitting}>
                {submitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>

          <div className="additional-info">
            <div className="info-box">
              <h3>Business Hours</h3>
              <div className="hours-list">
                <div className="hours-item">
                  <span className="day">Monday - Friday</span>
                  <span className="time">9:00 AM - 6:00 PM</span>
                </div>
                <div className="hours-item">
                  <span className="day">Saturday</span>
                  <span className="time">10:00 AM - 4:00 PM</span>
                </div>
                <div className="hours-item">
                  <span className="day">Sunday</span>
                  <span className="time">Closed</span>
                </div>
              </div>
            </div>

            <div className="info-box">
              <h3>Follow Us</h3>
              <div className="social-links">
                <a href="#" className="social-link">
                  <span className="social-icon">📘</span>
                  <span>Facebook</span>
                </a>
                <a href="#" className="social-link">
                  <span className="social-icon">🐦</span>
                  <span>Twitter</span>
                </a>
                <a href="#" className="social-link">
                  <span className="social-icon">📷</span>
                  <span>Instagram</span>
                </a>
                <a href="#" className="social-link">
                  <span className="social-icon">💼</span>
                  <span>LinkedIn</span>
                </a>
              </div>
            </div>

            <div className="info-box">
              <h3>Quick Links</h3>
              <div className="quick-links">
                <a href="/faq">FAQ</a>
                <a href="/help">Help Center</a>
                <a href="/privacy">Privacy Policy</a>
                <a href="/terms">Terms of Service</a>
              </div>
            </div>
          </div>
        </section>
      </div>
      {/* <div id="maintenance-overlay">
        <div class="maintenance-box">
            <h2>Under Maintenance</h2>
            <p>We are currently performing scheduled maintenance to improve your experience.</p>
            <p>We apologize for any inconvenience and appreciate your patience.</p>
            <p><b>Please contact Kartik Tyagi!</b></p>
            <h2><button className="btn-primary" onClick={() => window.location.href = '/'}>Go to Homepage</button></h2>
        </div>
    </div> */}
    </div>
  );
}