import React from 'react';
import { Link } from 'react-router-dom';
import '../assets/styles/Home.css';

const Home = () => {
  return (
    <div className="home-main-container">
      {/* Header */}
      <header className="home-header">
        <div className="home-header-container">
          <div className="home-logo-section">
            <div className="home-logo-icon">🏥</div>
            <h1 className="home-logo-text">Smart Healthcare Portal</h1>
          </div>
          <nav className="home-navigation">
            <ul className="home-nav-list">
              <li className="home-nav-item">
                <a href="#about" className="home-nav-link">About</a>
              </li>
              <li className="home-nav-item">
                <a href="#services" className="home-nav-link">Services</a>
              </li>
              <li className="home-nav-item">
                <a href="#specialists" className="home-nav-link">Specialists</a>
              </li>
              <li className="home-nav-item">
                <a href="#contact" className="home-nav-link">Contact</a>
              </li>
            </ul>
          </nav>
          <div className="home-auth-buttons">
            <Link to="/login" className="home-login-btn">Login</Link>
            <Link to="/register" className="home-register-btn">Register</Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="home-hero-section">
        <div className="home-hero-container">
          <div className="home-hero-content">
            <h1 className="home-hero-title">
              Your Health, Our Priority
            </h1>
            <p className="home-hero-subtitle">
              Advanced AI-powered symptom analysis, expert consultations, and seamless appointment booking - all in one platform
            </p>
            <div className="home-hero-buttons">
              <Link to="/chatBot" className="home-chatbot-btn">
                🤖 Try AI Symptom Checker
              </Link>
              <button className="home-book-appointment-btn">
                📅 Book Appointment
              </button>
            </div>
          </div>
          <div className="home-hero-image">
            <div className="home-hero-medical-icon">⚕️</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="home-features-section" id="services">
        <div className="home-features-container">
          <h2 className="home-features-title">Why Choose Our Healthcare Portal?</h2>
          <div className="home-features-grid">
            <div className="home-feature-card">
              <div className="home-feature-icon">🔍</div>
              <h3 className="home-feature-title">AI Symptom Analysis</h3>
              <p className="home-feature-description">
                Get instant AI-powered analysis of your symptoms with personalized recommendations and specialist referrals.
              </p>
            </div>
            <div className="home-feature-card">
              <div className="home-feature-icon">👨‍⚕️</div>
              <h3 className="home-feature-title">Expert Specialists</h3>
              <p className="home-feature-description">
                Connect with verified healthcare specialists across multiple medical domains with proven expertise.
              </p>
            </div>
            <div className="home-feature-card">
              <div className="home-feature-icon">📱</div>
              <h3 className="home-feature-title">Easy Booking</h3>
              <p className="home-feature-description">
                Book appointments seamlessly with real-time availability and instant confirmation notifications.
              </p>
            </div>
            <div className="home-feature-card">
              <div className="home-feature-icon">🔒</div>
              <h3 className="home-feature-title">Secure & Private</h3>
              <p className="home-feature-description">
                Your medical data is protected with enterprise-grade security and HIPAA compliance standards.
              </p>
            </div>
            <div className="home-feature-card">
              <div className="home-feature-icon">💬</div>
              <h3 className="home-feature-title">24/7 Support</h3>
              <p className="home-feature-description">
                Get round-the-clock assistance with our AI chatbot and dedicated customer support team.
              </p>
            </div>
            <div className="home-feature-card">
              <div className="home-feature-icon">📋</div>
              <h3 className="home-feature-title">Digital Records</h3>
              <p className="home-feature-description">
                Maintain comprehensive digital health records with easy access and sharing capabilities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="home-about-section" id="about">
        <div className="home-about-container">
          <div className="home-about-content">
            <div className="home-about-text">
              <h2 className="home-about-title">Revolutionizing Healthcare Access</h2>
              <p className="home-about-description">
                Smart Healthcare Portal bridges the gap between patients and healthcare providers using cutting-edge 
                artificial intelligence and intuitive design. Our platform empowers patients to understand their 
                symptoms, connect with the right specialists, and manage their health journey efficiently.
              </p>
              <div className="home-about-stats">
                <div className="home-stat-item">
                  <div className="home-stat-number">10,000+</div>
                  <div className="home-stat-label">Happy Patients</div>
                </div>
                <div className="home-stat-item">
                  <div className="home-stat-number">500+</div>
                  <div className="home-stat-label">Verified Doctors</div>
                </div>
                <div className="home-stat-item">
                  <div className="home-stat-number">50+</div>
                  <div className="home-stat-label">Specializations</div>
                </div>
                <div className="home-stat-item">
                  <div className="home-stat-number">24/7</div>
                  <div className="home-stat-label">Availability</div>
                </div>
              </div>
            </div>
            <div className="home-about-image">
              <div className="home-about-medical-graphic">🩺</div>
            </div>
          </div>
        </div>
      </section>

      {/* Specialists Section */}
      <section className="home-specialists-section" id="specialists">
        <div className="home-specialists-container">
          <h2 className="home-specialists-title">Our Medical Specializations</h2>
          <div className="home-specialists-grid">
            <div className="home-specialist-card">
              <div className="home-specialist-icon">❤️</div>
              <h3 className="home-specialist-name">Cardiology</h3>
              <p className="home-specialist-description">Heart and cardiovascular system care</p>
            </div>
            <div className="home-specialist-card">
              <div className="home-specialist-icon">🧠</div>
              <h3 className="home-specialist-name">Neurology</h3>
              <p className="home-specialist-description">Nervous system and brain health</p>
            </div>
            <div className="home-specialist-card">
              <div className="home-specialist-icon">🦴</div>
              <h3 className="home-specialist-name">Orthopedics</h3>
              <p className="home-specialist-description">Bone, joint, and muscle treatment</p>
            </div>
            <div className="home-specialist-card">
              <div className="home-specialist-icon">👁️</div>
              <h3 className="home-specialist-name">Ophthalmology</h3>
              <p className="home-specialist-description">Eye care and vision health</p>
            </div>
            <div className="home-specialist-card">
              <div className="home-specialist-icon">👂</div>
              <h3 className="home-specialist-name">ENT</h3>
              <p className="home-specialist-description">Ear, nose, and throat specialists</p>
            </div>
            <div className="home-specialist-card">
              <div className="home-specialist-icon">🫁</div>
              <h3 className="home-specialist-name">Pulmonology</h3>
              <p className="home-specialist-description">Respiratory and lung care</p>
            </div>
            <div className="home-specialist-card">
              <div className="home-specialist-icon">🩸</div>
              <h3 className="home-specialist-name">Hematology</h3>
              <p className="home-specialist-description">Blood disorders and treatment</p>
            </div>
            <div className="home-specialist-card">
              <div className="home-specialist-icon">🦷</div>
              <h3 className="home-specialist-name">Dentistry</h3>
              <p className="home-specialist-description">Oral health and dental care</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="home-process-section">
        <div className="home-process-container">
          <h2 className="home-process-title">How It Works</h2>
          <div className="home-process-steps">
            <div className="home-process-step">
              <div className="home-step-number">1</div>
              <div className="home-step-content">
                <h3 className="home-step-title">Describe Symptoms</h3>
                <p className="home-step-description">
                  Use our AI-powered symptom checker to describe your health concerns in simple terms.
                </p>
              </div>
            </div>
            <div className="home-process-step">
              <div className="home-step-number">2</div>
              <div className="home-step-content">
                <h3 className="home-step-title">Get AI Analysis</h3>
                <p className="home-step-description">
                  Receive instant analysis with possible conditions and recommended specialist categories.
                </p>
              </div>
            </div>
            <div className="home-process-step">
              <div className="home-step-number">3</div>
              <div className="home-step-content">
                <h3 className="home-step-title">Choose Specialist</h3>
                <p className="home-step-description">
                  Browse verified specialists, view their profiles, and select the best match for your needs.
                </p>
              </div>
            </div>
            <div className="home-process-step">
              <div className="home-step-number">4</div>
              <div className="home-step-content">
                <h3 className="home-step-title">Book & Consult</h3>
                <p className="home-step-description">
                  Schedule your appointment and get professional medical consultation when convenient.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="home-cta-section">
        <div className="home-cta-container">
          <h2 className="home-cta-title">Ready to Take Control of Your Health?</h2>
          <p className="home-cta-description">
            Join thousands of patients who trust our platform for their healthcare needs. Get started today!
          </p>
          <div className="home-cta-buttons">
            <Link to="/register" className="home-cta-primary-btn">Start Your Health Journey</Link>
            <Link to="/chatBot" className="home-cta-secondary-btn">Talk to AI Assistant</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer" id="contact">
        <div className="home-footer-container">
          <div className="home-footer-content">
            <div className="home-footer-section">
              <div className="home-footer-logo">
                <div className="home-footer-logo-icon">🏥</div>
                <h3 className="home-footer-logo-text">Smart Healthcare Portal</h3>
              </div>
              <p className="home-footer-description">
                Empowering patients with AI-driven healthcare solutions and connecting them with the best medical professionals.
              </p>
              <div className="home-social-links">
                <a href="#" className="home-social-link">📧</a>
                <a href="#" className="home-social-link">📱</a>
                <a href="#" className="home-social-link">🌐</a>
              </div>
            </div>
            
            <div className="home-footer-section">
              <h4 className="home-footer-section-title">Services</h4>
              <ul className="home-footer-links">
                <li><Link to="/chatBot" className="home-footer-link">AI Symptom Checker</Link></li>
                <li><a href="#" className="home-footer-link">Appointment Booking</a></li>
                <li><a href="#" className="home-footer-link">Specialist Consultation</a></li>
                <li><a href="#" className="home-footer-link">Digital Prescriptions</a></li>
                <li><a href="#" className="home-footer-link">Health Records</a></li>
              </ul>
            </div>
            
            <div className="home-footer-section">
              <h4 className="home-footer-section-title">Specialties</h4>
              <ul className="home-footer-links">
                <li><a href="#" className="home-footer-link">Cardiology</a></li>
                <li><a href="#" className="home-footer-link">Neurology</a></li>
                <li><a href="#" className="home-footer-link">Orthopedics</a></li>
                <li><a href="#" className="home-footer-link">Dermatology</a></li>
                <li><a href="#" className="home-footer-link">General Medicine</a></li>
              </ul>
            </div>
            
            <div className="home-footer-section">
              <h4 className="home-footer-section-title">Support</h4>
              <ul className="home-footer-links">
                <li><a href="#" className="home-footer-link">Help Center</a></li>
                <li><a href="#" className="home-footer-link">Contact Us</a></li>
                <li><a href="#" className="home-footer-link">FAQ</a></li>
                <li><a href="#" className="home-footer-link">Privacy Policy</a></li>
                <li><a href="#" className="home-footer-link">Terms of Service</a></li>
              </ul>
            </div>
            
            <div className="home-footer-section">
              <h4 className="home-footer-section-title">Contact Info</h4>
              <div className="home-contact-info">
                <div className="home-contact-item">
                  <span className="home-contact-icon">📍</span>
                  <span className="home-contact-text">123 Healthcare Ave, Medical City, MC 12345</span>
                </div>
                <div className="home-contact-item">
                  <span className="home-contact-icon">📞</span>
                  <span className="home-contact-text">+1 (555) 123-HEALTH</span>
                </div>
                <div className="home-contact-item">
                  <span className="home-contact-icon">📧</span>
                  <span className="home-contact-text">support@smarthealthcare.com</span>
                </div>
                <div className="home-contact-item">
                  <span className="home-contact-icon">🕒</span>
                  <span className="home-contact-text">24/7 Emergency Support</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="home-footer-bottom">
            <div className="home-footer-bottom-content">
              <p className="home-copyright">
                © 2024 Smart Healthcare Portal. All rights reserved.
              </p>
              <div className="home-footer-bottom-links">
                <a href="#" className="home-footer-bottom-link">Privacy</a>
                <a href="#" className="home-footer-bottom-link">Terms</a>
                <a href="#" className="home-footer-bottom-link">Cookies</a>
                <a href="#" className="home-footer-bottom-link">Accessibility</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Chat Button */}
      <div className="home-floating-chat">
        <Link to="/chatBot" className="home-chat-button">
          <span className="home-chat-icon">💬</span>
          <span className="home-chat-text">Chat with AI</span>
        </Link>
      </div>
    </div>
  );
};

export default Home;