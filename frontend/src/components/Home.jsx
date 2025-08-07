import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import "../assets/styles/Home.css"; // Assuming you have a CSS file for styling
import { 
  Heart, Stethoscope, Brain, FileText, Calendar, Mic, Cloud, Users, Star, ChevronRight, Activity, Leaf, UserCheck,
  CheckCircle, Menu, X
} from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const features = [
    {
      icon: <Leaf className="feature-icon" />,
      title: "Prakriti Assessment",
      description: "Discover your unique Ayurvedic constitution through comprehensive dosha analysis",
      color: "bg-green"
    },
    {
      icon: <Brain className="feature-icon" />,
      title: "AI Symptom Checker",
      description: "Get instant health insights with our advanced AI-powered symptom analysis",
      color: "bg-blue"
    },
    {
      icon: <Cloud className="feature-icon" />,
      title: "Medical Records",
      description: "Securely store and access your medical documents from anywhere",
      color: "bg-purple"
    },
    {
      icon: <Calendar className="feature-icon" />,
      title: "Doctor Appointments",
      description: "Book and manage appointments with certified healthcare professionals",
      color: "bg-orange"
    },
    {
      icon: <Mic className="feature-icon" />,
      title: "Smart Consultations",
      description: "AI-powered consultation recording with automated report generation",
      color: "bg-red"
    },
    {
      icon: <FileText className="feature-icon" />,
      title: "Health Reports",
      description: "Comprehensive health analytics and personalized recommendations",
      color: "bg-teal"
    }
  ];

  const testimonials = [
    {
      name: "Dr. Sarah Williams",
      role: "Ayurvedic Practitioner",
      content: "AYUMATE has revolutionized how I connect with patients and manage consultations.",
      rating: 5
    },
    {
      name: "Priya Sharma",
      role: "Patient",
      content: "The prakriti assessment helped me understand my body better than ever before.",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "Health Enthusiast",
      content: "The AI symptom checker is incredibly accurate and has saved me multiple doctor visits.",
      rating: 5
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleNavigation = (path) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  return (
    <div className="home-container">
      {/* Header */}
      <header className="header">
        <div className="nav-container">
          <div className="nav-wrapper">
            <div className="logo">
              <div className="logo-icon">
                <Heart className="logo-heart" />
              </div>
              <h1 className="logo-text">AYUMATE</h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="desktop-nav">
              <button 
                onClick={() => handleNavigation('/dosha')}
                className="nav-link"
              >
                Prakriti Check
              </button>
              <button 
                onClick={() => handleNavigation('/chatBot')}
                className="nav-link"
              >
                AI Symptom Checker
              </button>
              <div className="auth-buttons">
                <button 
                  onClick={() => handleNavigation('/patient-login')}
                  className="login-btn"
                >
                  Patient Login
                </button>
                <button 
                  onClick={() => handleNavigation('/doctor-login')}
                  className="login-btn"
                >
                  Doctor Login
                </button>
                <button 
                  onClick={() => handleNavigation('/admin-login')}
                  className="admin-btn"
                >
                  Admin
                </button>
              </div>
            </nav>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="mobile-menu-btn"
            >
              {isMenuOpen ? <X className="menu-icon" /> : <Menu className="menu-icon" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="mobile-nav">
            <div className="mobile-nav-container">
              <button 
                onClick={() => handleNavigation('/dosha')}
                className="mobile-nav-link"
              >
                Prakriti Check
              </button>
              <button 
                onClick={() => handleNavigation('/chatBot')}
                className="mobile-nav-link"
              >
                AI Symptom Checker
              </button>
              <div className="mobile-auth">
                <button 
                  onClick={() => handleNavigation('/patient-login')}
                  className="mobile-login"
                >
                  Patient Login
                </button>
                <button 
                  onClick={() => handleNavigation('/patient-register')}
                  className="mobile-register"
                >
                  Patient Register
                </button>
                <button 
                  onClick={() => handleNavigation('/doctor-login')}
                  className="mobile-login"
                >
                  Doctor Login
                </button>
                <button 
                  onClick={() => handleNavigation('/doctor-register')}
                  className="mobile-register"
                >
                  Doctor Register
                </button>
                <button 
                  onClick={() => handleNavigation('/admin-login')}
                  className="mobile-admin"
                >
                  Admin Login
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg"></div>
        <div className="hero-container">
          <div className="hero-content">
            <h2 className="hero-title">
              Your Complete
              <span className="hero-highlight">
                Ayurvedic Health
              </span>
              Companion
            </h2>
            <p className="hero-subtitle">
              Discover personalized healthcare through ancient Ayurvedic wisdom combined with modern AI technology
            </p>
            <div className="hero-actions">
              <button 
                onClick={() => handleNavigation('/dosha')}
                className="cta-primary"
              >
                <Leaf className="btn-icon" />
                <span>Check Your Prakriti</span>
                <ChevronRight className="btn-icon" />
              </button>
              <button 
                onClick={() => handleNavigation('/chatBot')}
                className="cta-secondary"
              >
                <Brain className="btn-icon" />
                <span>AI Health Check</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Access Cards */}
      <section className="quick-access">
        <div className="access-container">
          <div className="access-grid">
            <div 
              onClick={() => handleNavigation('/patient-register')}
              className="access-card access-card-green"
            >
              <UserCheck className="card-icon" />
              <h3 className="card-title">Patient Portal</h3>
              <p className="card-desc">Register and access your personalized health dashboard</p>
              <ChevronRight className="card-arrow" />
            </div>

            <div 
              onClick={() => handleNavigation('/doctor-register')}
              className="access-card access-card-blue"
            >
              <Stethoscope className="card-icon" />
              <h3 className="card-title">Doctor Portal</h3>
              <p className="card-desc">Join our network of certified healthcare professionals</p>
              <ChevronRight className="card-arrow" />
            </div>

            <div 
              onClick={() => handleNavigation('/dosha')}
              className="access-card access-card-orange"
            >
              <Activity className="card-icon" />
              <h3 className="card-title">Dosha Analysis</h3>
              <p className="card-desc">Discover your Ayurvedic constitution and body type</p>
              <ChevronRight className="card-arrow" />
            </div>

            <div 
              onClick={() => handleNavigation('/chatBot')}
              className="access-card access-card-purple"
            >
              <Brain className="card-icon" />
              <h3 className="card-title">AI Diagnosis</h3>
              <p className="card-desc">Get instant health insights with AI technology</p>
              <ChevronRight className="card-arrow" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="features-container">
          <div className="features-header">
            <h2 className="section-title">
              Comprehensive Health Features
            </h2>
            <p className="section-subtitle">
              Experience the perfect blend of traditional Ayurveda and modern technology for your complete wellness journey
            </p>
          </div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="feature-card"
              >
                <div className={`feature-icon-container ${feature.color}`}>
                  {React.cloneElement(feature.icon, { className: "feature-icon-white" })}
                </div>
                <h3 className="feature-title">
                  {feature.title}
                </h3>
                <p className="feature-description">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Health Information Section */}
      <section className="info">
        <div className="info-container">
          <div className="info-content">
            <div className="info-text">
              <h2 className="info-title">
                Why Choose AYUMATE?
              </h2>
              <div className="info-points">
                <div className="info-point">
                  <CheckCircle className="check-icon check-green" />
                  <div>
                    <h3 className="point-title">
                      Personalized Ayurvedic Care
                    </h3>
                    <p className="point-desc">
                      Get customized health recommendations based on your unique prakriti and current health status
                    </p>
                  </div>
                </div>
                <div className="info-point">
                  <CheckCircle className="check-icon check-blue" />
                  <div>
                    <h3 className="point-title">
                      AI-Powered Insights
                    </h3>
                    <p className="point-desc">
                      Advanced machine learning algorithms provide accurate symptom analysis and health predictions
                    </p>
                  </div>
                </div>
                <div className="info-point">
                  <CheckCircle className="check-icon check-purple" />
                  <div>
                    <h3 className="point-title">
                      Complete Health Ecosystem
                    </h3>
                    <p className="point-desc">
                      From consultation to treatment tracking, manage your entire health journey in one place
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="info-visual">
              <div className="visual-grid">
                <div className="visual-card visual-green">
                  <Users className="visual-icon" />
                  <div className="stat-number">10K+</div>
                  <div className="stat-label">Happy Patients</div>
                </div>
                <div className="visual-card visual-blue">
                  <Stethoscope className="visual-icon" />
                  <div className="stat-number">500+</div>
                  <div className="stat-label">Expert Doctors</div>
                </div>
                <div className="visual-card visual-purple">
                  <Brain className="visual-icon" />
                  <div className="stat-number">95%</div>
                  <div className="stat-label">AI Accuracy</div>
                </div>
                <div className="visual-card visual-orange">
                  <Activity className="visual-icon" />
                  <div className="stat-number">24/7</div>
                  <div className="stat-label">Support</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials">
        <div className="testimonials-container">
          <div className="testimonials-header">
            <h2 className="section-title">
              What Our Users Say
            </h2>
            <p className="section-subtitle">
              Real experiences from our community of patients and healthcare professionals
            </p>
          </div>

          <div className="testimonial-slider">
            <div className="testimonial-card">
              <div className="rating">
                {[...Array(testimonials[currentSlide].rating)].map((_, i) => (
                  <Star key={i} className="star" />
                ))}
              </div>
              <p className="testimonial-text">
                "{testimonials[currentSlide].content}"
              </p>
              <div className="testimonial-author">
                <div className="author-name">
                  {testimonials[currentSlide].name}
                </div>
                <div className="author-role">
                  {testimonials[currentSlide].role}
                </div>
              </div>
            </div>

            <div className="slider-dots">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`dot ${index === currentSlide ? 'dot-active' : ''}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="cta">
        <div className="cta-container">
          <h2 className="cta-title">
            Start Your Health Journey Today
          </h2>
          <p className="cta-subtitle">
            Join thousands of users who have transformed their health with AYUMATE's personalized approach to wellness
          </p>
          <div className="cta-buttons">
            <button 
              onClick={() => handleNavigation('/patient-register')}
              className="cta-btn-primary"
            >
              <UserCheck className="btn-icon" />
              <span>Get Started as Patient</span>
            </button>
            <button 
              onClick={() => handleNavigation('/doctor-register')}
              className="cta-btn-secondary"
            >
              <Stethoscope className="btn-icon" />
              <span>Join as Healthcare Provider</span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="footer-logo">
                <div className="logo-icon">
                  <Heart className="footer-heart" />
                </div>
                <h3 className="footer-title">AYUMATE</h3>
              </div>
              <p className="footer-desc">
                Your comprehensive Ayurvedic health companion, combining ancient wisdom with modern technology for optimal wellness.
              </p>
            </div>

            <div className="footer-links">
              <h4 className="footer-heading">Quick Links</h4>
              <ul className="footer-list">
                <li><button onClick={() => handleNavigation('/dosha')} className="footer-link">Prakriti Assessment</button></li>
                <li><button onClick={() => handleNavigation('/chatBot')} className="footer-link">AI Symptom Checker</button></li>
                <li><button onClick={() => handleNavigation('/patient-register')} className="footer-link">Patient Portal</button></li>
                <li><button onClick={() => handleNavigation('/doctor-register')} className="footer-link">Doctor Portal</button></li>
              </ul>
            </div>

            <div className="footer-features">
              <h4 className="footer-heading">Features</h4>
              <ul className="footer-list">
                <li className="footer-item">Medical Records Storage</li>
                <li className="footer-item">Doctor Appointments</li>
                <li className="footer-item">Smart Consultations</li>
                <li className="footer-item">Health Analytics</li>
              </ul>
            </div>

            <div className="footer-contact">
              <h4 className="footer-heading">Support</h4>
              <ul className="footer-list">
                <li className="footer-item">24/7 Customer Support</li>
                <li className="footer-item">Help Center</li>
                <li className="footer-item">Privacy Policy</li>
                <li className="footer-item">Terms of Service</li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p className="copyright">
              © 2024 AYUMATE. All rights reserved. Empowering health through technology and tradition.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;