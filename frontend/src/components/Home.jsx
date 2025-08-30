import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from "../assets/styles/Home.module.css"; // Assuming you have a CSS file for styling
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
      icon: <Leaf className={styles["feature-icon"]} />,
      title: "Prakriti Assessment",
      description: "Discover your unique Ayurvedic constitution through comprehensive dosha analysis",
      color: styles["bg-green"]
    },
    {
      icon: <Brain className={styles["feature-icon"]} />,
      title: "AI Symptom Checker",
      description: "Get instant health insights with our advanced AI-powered symptom analysis",
      color: styles["bg-blue"]
    },
    {
      icon: <Cloud className={styles["feature-icon"]} />,
      title: "Medical Records",
      description: "Securely store and access your medical documents from anywhere",
      color: styles["bg-purple"]
    },
    {
      icon: <Calendar className={styles["feature-icon"]} />,
      title: "Doctor Appointments",
      description: "Book and manage appointments with certified healthcare professionals",
      color: styles["bg-orange"]
    },
    {
      icon: <Mic className={styles["feature-icon"]} />,
      title: "Smart Consultations",
      description: "AI-powered consultation recording with automated report generation",
      color: styles["bg-red"]
    },
    {
      icon: <FileText className={styles["feature-icon"]} />,
      title: "Health Reports",
      description: "Comprehensive health analytics and personalized recommendations",
      color: styles["bg-teal"]
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
    <div className={styles["home-container"]}>
      {/* Header */}
      <header className={styles["header"]}>
        <div className={styles["nav-container"]}>
          <div className={styles["nav-wrapper"]}>
            <div className={styles["logo"]}>
              <div className={styles["logo-icon"]}>
                <Heart className={styles["logo-heart"]} />
              </div>
              <h1 className={styles["logo-text"]} onClick={() => handleNavigation('/')}>AYUMATE</h1>
            </div>

            {/* Desktop Navigation */}
            <nav className={styles["desktop-nav"]}>
              <button 
                onClick={() => handleNavigation('/dosha')}
                className={styles["nav-link"]}
              >
                Prakriti Check
              </button>
              <button 
                onClick={() => handleNavigation('/chatBot')}
                className={styles["nav-link"]}
              >
                AI Symptom Checker
              </button>
              <div className={styles["auth-buttons"]}>
                <button 
                  onClick={() => handleNavigation('/patient-login')}
                  className={styles["login-btn"]}
                >
                  Patient Login
                </button>
                <button 
                  onClick={() => handleNavigation('/doctor-login')}
                  className={styles["login-btn"]}
                >
                  Doctor Login
                </button>
                <button 
                  onClick={() => handleNavigation('/admin-login')}
                  className={styles["admin-btn"]}
                >
                  Admin
                </button>
              </div>
            </nav>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={styles["mobile-menu-btn"]}
            >
              {isMenuOpen ? <X className={styles["menu-icon"]} /> : <Menu className={styles["menu-icon"]} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className={styles["mobile-nav"]}>
            <div className={styles["mobile-nav-container"]}>
              <button 
                onClick={() => handleNavigation('/dosha')}
                className={styles["mobile-nav-link"]}
              >
                Prakriti Check
              </button>
              <button 
                onClick={() => handleNavigation('/chatBot')}
                className={styles["mobile-nav-link"]}
              >
                AI Symptom Checker
              </button>
              <div className={styles["mobile-auth"]}>
                <button 
                  onClick={() => handleNavigation('/patient-login')}
                  className={styles["mobile-login"]}
                >
                  Patient Login
                </button>
                <button 
                  onClick={() => handleNavigation('/patient-register')}
                  className={styles["mobile-register"]}
                >
                  Patient Register
                </button>
                <button 
                  onClick={() => handleNavigation('/doctor-login')}
                  className={styles["mobile-login"]}
                >
                  Doctor Login
                </button>
                <button 
                  onClick={() => handleNavigation('/doctor-register')}
                  className={styles["mobile-register"]}
                >
                  Doctor Register
                </button>
                <button 
                  onClick={() => handleNavigation('/admin-login')}
                  className={styles["mobile-admin"]}
                >
                  Admin Login
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className={styles["hero"]}>
        <div className={styles["hero-bg"]}></div>
        <div className={styles["hero-container"]}>
          <div className={styles["hero-content"]}>
            <h2 className={styles["hero-title"]}>
              Your Complete
              <span className={styles["hero-highlight"]}>
                Ayurvedic Health
              </span>
              Companion
            </h2>
            <p className={styles["hero-subtitle"]}>
              Discover personalized healthcare through ancient Ayurvedic wisdom combined with modern AI technology
            </p>
            <div className={styles["hero-actions"]}>
              <button 
                onClick={() => handleNavigation('/dosha')}
                className={styles["cta-primary"]}
              >
                <Leaf className={styles["btn-icon"]} />
                <span>Check Your Prakriti</span>
                <ChevronRight className={styles["btn-icon"]} />
              </button>
              <button 
                onClick={() => handleNavigation('/chatBot')}
                className={styles["cta-secondary"]}
              >
                <Brain className={styles["btn-icon"]} />
                <span>AI Health Check</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Access Cards */}
      <section className={styles["quick-access"]}>
        <div className={styles["access-container"]}>
          <div className={styles["access-grid"]}>
            <div 
              onClick={() => handleNavigation('/patient-register')}
              className={`${styles["access-card"]} ${styles["access-card-green"]}`}
            >
              <UserCheck className={styles["card-icon"]} />
              <h3 className={styles["card-title"]}>Patient Portal</h3>
              <p className={styles["card-desc"]}>Register and access your personalized health dashboard</p>
              <ChevronRight className={styles["card-arrow"]} />
            </div>

            <div 
              onClick={() => handleNavigation('/doctor-register')}
              className={`${styles["access-card"]} ${styles["access-card-blue"]}`}
            >
              <Stethoscope className={styles["card-icon"]} />
              <h3 className={styles["card-title"]}>Doctor Portal</h3>
              <p className={styles["card-desc"]}>Join our network of certified healthcare professionals</p>
              <ChevronRight className={styles["card-arrow"]} />
            </div>

            <div 
              onClick={() => handleNavigation('/dosha')}
              className={`${styles["access-card"]} ${styles["access-card-orange"]}`}
            >
              <Activity className={styles["card-icon"]} />
              <h3 className={styles["card-title"]}>Dosha Analysis</h3>
              <p className={styles["card-desc"]}>Discover your Ayurvedic constitution and body type</p>
              <ChevronRight className={styles["card-arrow"]} />
            </div>

            <div 
              onClick={() => handleNavigation('/chatBot')}
              className={`${styles["access-card"]} ${styles["access-card-purple"]}`}
            >
              <Brain className={styles["card-icon"]} />
              <h3 className={styles["card-title"]}>AI Diagnosis</h3>
              <p className={styles["card-desc"]}>Get instant health insights with AI technology</p>
              <ChevronRight className={styles["card-arrow"]} />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles["features"]}>
        <div className={styles["features-container"]}>
          <div className={styles["features-header"]}>
            <h2 className={styles["section-title"]}>
              Comprehensive Health Features
            </h2>
            <p className={styles["section-subtitle"]}>
              Experience the perfect blend of traditional Ayurveda and modern technology for your complete wellness journey
            </p>
          </div>

          <div className={styles["features-grid"]}>
            {features.map((feature, index) => (
              <div 
                key={index}
                className={styles["feature-card"]}
              >
                <div className={`${styles["feature-icon-container"]} ${feature.color}`}>
                  {React.cloneElement(feature.icon, { className: styles["feature-icon-white"] })}
                </div>
                <h3 className={styles["feature-title"]}>
                  {feature.title}
                </h3>
                <p className={styles["feature-description"]}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Health Information Section */}
      <section className={styles["info"]}>
        <div className={styles["info-container"]}>
          <div className={styles["info-content"]}>
            <div className={styles["info-text"]}>
              <h2 className={styles["info-title"]}>
                Why Choose AYUMATE?
              </h2>
              <div className={styles["info-points"]}>
                <div className={styles["info-point"]}>
                  <CheckCircle className={`${styles["check-icon"]} ${styles["check-green"]}`} />
                  <div>
                    <h3 className={styles["point-title"]}>
                      Personalized Ayurvedic Care
                    </h3>
                    <p className={styles["point-desc"]}>
                      Get customized health recommendations based on your unique prakriti and current health status
                    </p>
                  </div>
                </div>
                <div className={styles["info-point"]}>
                  <CheckCircle className={`${styles["check-icon"]} ${styles["check-blue"]}`} />
                  <div>
                    <h3 className={styles["point-title"]}>
                      AI-Powered Insights
                    </h3>
                    <p className={styles["point-desc"]}>
                      Advanced machine learning algorithms provide accurate symptom analysis and health predictions
                    </p>
                  </div>
                </div>
                <div className={styles["info-point"]}>
                  <CheckCircle className={`${styles["check-icon"]} ${styles["check-purple"]}`} />
                  <div>
                    <h3 className={styles["point-title"]}>
                      Complete Health Ecosystem
                    </h3>
                    <p className={styles["point-desc"]}>
                      From consultation to treatment tracking, manage your entire health journey in one place
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles["info-visual"]}>
              <div className={styles["visual-grid"]}>
                <div className={`${styles["visual-card"]} ${styles["visual-green"]}`}>
                  <Users className={styles["visual-icon"]} />
                  <div className={styles["stat-number"]}>10K+</div>
                  <div className={styles["stat-label"]}>Happy Patients</div>
                </div>
                <div className={`${styles["visual-card"]} ${styles["visual-blue"]}`}>
                  <Stethoscope className={styles["visual-icon"]} />
                  <div className={styles["stat-number"]}>500+</div>
                  <div className={styles["stat-label"]}>Expert Doctors</div>
                </div>
                <div className={`${styles["visual-card"]} ${styles["visual-purple"]}`}>
                  <Brain className={styles["visual-icon"]} />
                  <div className={styles["stat-number"]}>95%</div>
                  <div className={styles["stat-label"]}>AI Accuracy</div>
                </div>
                <div className={`${styles["visual-card"]} ${styles["visual-orange"]}`}>
                  <Activity className={styles["visual-icon"]} />
                  <div className={styles["stat-number"]}>24/7</div>
                  <div className={styles["stat-label"]}>Support</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className={styles["testimonials"]}>
        <div className={styles["testimonials-container"]}>
          <div className={styles["testimonials-header"]}>
            <h2 className={styles["section-title"]}>
              What Our Users Say
            </h2>
            <p className={styles["section-subtitle"]}>
              Real experiences from our community of patients and healthcare professionals
            </p>
          </div>

          <div className={styles["testimonial-slider"]}>
            <div className={styles["testimonial-card"]}>
              <div className={styles["rating"]}>
                {[...Array(testimonials[currentSlide].rating)].map((_, i) => (
                  <Star key={i} className={styles["star"]} />
                ))}
              </div>
              <p className={styles["testimonial-text"]}>
                "{testimonials[currentSlide].content}"
              </p>
              <div className={styles["testimonial-author"]}>
                <div className={styles["author-name"]}>
                  {testimonials[currentSlide].name}
                </div>
                <div className={styles["author-role"]}>
                  {testimonials[currentSlide].role}
                </div>
              </div>
            </div>

            <div className={styles["slider-dots"]}>
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`${styles["dot"]} ${index === currentSlide ? styles["dot-active"] : ''}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className={styles["cta"]}>
        <div className={styles["cta-container"]}>
          <h2 className={styles["cta-title"]}>
            Start Your Health Journey Today
          </h2>
          <p className={styles["cta-subtitle"]}>
            Join thousands of users who have transformed their health with AYUMATE's personalized approach to wellness
          </p>
          <div className={styles["cta-buttons"]}>
            <button 
              onClick={() => handleNavigation('/patient-register')}
              className={styles["cta-btn-primary"]}
            >
              <UserCheck className={styles["btn-icon"]} />
              <span>Get Started as Patient</span>
            </button>
            <button 
              onClick={() => handleNavigation('/doctor-register')}
              className={styles["cta-btn-secondary"]}
            >
              <Stethoscope className={styles["btn-icon"]} />
              <span>Join as Healthcare Provider</span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles["footer"]}>
        <div className={styles["footer-container"]}>
          <div className={styles["footer-content"]}>
            <div className={styles["footer-brand"]}>
              <div className={styles["footer-logo"]}>
                <div className={styles["logo-icon"]}>
                  <Heart className={styles["footer-heart"]} />
                </div>
                <h3 className={styles["footer-title"]}>AYUMATE</h3>
              </div>
              <p className={styles["footer-desc"]}>
                Your comprehensive Ayurvedic health companion, combining ancient wisdom with modern technology for optimal wellness.
              </p>
            </div>

            <div className={styles["footer-links"]}>
              <h4 className={styles["footer-heading"]}>Quick Links</h4>
              <ul className={styles["footer-list"]}>
                <li><button onClick={() => handleNavigation('/dosha')} className={styles["footer-link"]}>Prakriti Assessment</button></li>
                <li><button onClick={() => handleNavigation('/chatBot')} className={styles["footer-link"]}>AI Symptom Checker</button></li>
                <li><button onClick={() => handleNavigation('/patient-register')} className={styles["footer-link"]}>Patient Portal</button></li>
                <li><button onClick={() => handleNavigation('/doctor-register')} className={styles["footer-link"]}>Doctor Portal</button></li>
              </ul>
            </div>

            <div className={styles["footer-features"]}>
              <h4 className={styles["footer-heading"]}>Features</h4>
              <ul className={styles["footer-list"]}>
                <li className={styles["footer-item"]}>Medical Records Storage</li>
                <li className={styles["footer-item"]}>Doctor Appointments</li>
                <li className={styles["footer-item"]}>Smart Consultations</li>
                <li className={styles["footer-item"]}>Health Analytics</li>
              </ul>
            </div>

            <div className={styles["footer-contact"]}>
              <h4 className={styles["footer-heading"]}>Support</h4>
              <ul className={styles["footer-list"]}>
                <li className={styles["footer-item"]}>24/7 Customer Support</li>
                <li className={styles["footer-item"]}>Help Center</li>
                <li className={styles["footer-item"]}>Privacy Policy</li>
                <li className={styles["footer-item"]}>Terms of Service</li>
              </ul>
            </div>
          </div>

          <div className={styles["footer-bottom"]}>
            <p className={styles["copyright"]}>
              © 2025 AYUMATE. All rights reserved. Empowering health through technology and tradition.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;