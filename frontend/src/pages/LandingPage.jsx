import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import {
  School,
  ShieldCheck,
  CheckCircle2,
  Users,
  BookOpen,
  Award,
  CalendarCheck,
  CreditCard,
  Mail,
  ArrowRight,
  Sparkles,
  Server,
  Lock,
  ChevronRight,
  MapPin,
  Clock,
  Layers,
  Database,
  Building2,
  Check
} from 'lucide-react';

export const LandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [platformData, setPlatformData] = useState({
    settings: {
      platform_name: 'School Cloud Platform',
      platform_tagline: 'Enterprise Multi-Tenant School Management Platform',
      platform_motto: 'Security, Excellence & Next-Gen Education',
      theme_color: '#2563eb',
      banner_announcement: 'Welcome to the Next-Generation Multi-Tenant School Cloud Platform.',
      contact_email: 'axmedjidhe12@gmail.com',
      contact_phone: '+252 61 5000000',
      logo_url: '',
      footer_text: '2026 School Cloud Platform. All rights reserved.'
    },
    schools: [],
    metrics: {
      total_schools: 4,
      total_students: 120,
      total_teachers: 24,
      total_classes: 18,
      total_emails_sent: 45
    }
  });

  const [loading, setLoading] = useState(true);

  // Scroll Animation Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px'
      }
    );

    const revealElements = document.querySelectorAll('.scroll-reveal');
    revealElements.forEach((el) => observer.observe(el));

    return () => {
      revealElements.forEach((el) => observer.unobserve(el));
    };
  }, [loading, platformData]);

  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        const res = await apiRequest('/platform/settings');
        if (res.success) {
          setPlatformData(res);
          if (res.settings?.theme_color) {
            document.documentElement.style.setProperty('--primary', res.settings.theme_color);
            document.documentElement.style.setProperty('--primary-light', res.settings.theme_color + '15');
          }
        }
      } catch (err) {
        console.error('Failed to load platform settings for landing page:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLandingData();
  }, []);

  const handlePortalEntry = () => {
    if (user) {
      if (user.role === 'root_admin') navigate('/master');
      else if (user.role === 'super_admin') navigate('/admin');
      else if (user.role === 'teacher') navigate('/teacher');
      else navigate('/student');
    } else {
      navigate('/login');
    }
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const { settings, schools, metrics } = platformData;

  return (
    <div className="landing-page">
      {/* Top Announcement Bar */}
      {settings.banner_announcement && (
        <div className="landing-announcement">
          <Sparkles size={14} color="#38bdf8" />
          <span>{settings.banner_announcement}</span>
          <span style={{ opacity: 0.4 }}>|</span>
          <strong>Cloud Multi-Tenant SaaS v2.0</strong>
        </div>
      )}

      {/* Sticky Header / Navigation */}
      <header className="landing-header">
        <div className="landing-nav-inner">
          <div
            className="brand"
            onClick={() => scrollToSection('home')}
            style={{ cursor: 'pointer' }}
          >
            <div className="brand-icon" style={{ background: settings.theme_color || 'var(--primary)' }}>
              <School size={22} />
            </div>
            <div>
              <span style={{ fontWeight: 800, fontSize: '1.15rem', color: '#0f172a' }}>
                {settings.platform_name || 'School Cloud Platform'}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', fontWeight: 500 }}>
                {settings.platform_motto || 'Enterprise Education Management'}
              </span>
            </div>
          </div>

          <nav>
            <ul className="landing-nav-links">
              <li>
                <span className="landing-nav-link" onClick={() => scrollToSection('home')}>
                  Home
                </span>
              </li>
              <li>
                <span className="landing-nav-link" onClick={() => scrollToSection('about')}>
                  About
                </span>
              </li>
              <li>
                <span className="landing-nav-link" onClick={() => scrollToSection('services')}>
                  Services
                </span>
              </li>
              <li>
                <span className="landing-nav-link" onClick={() => scrollToSection('schools')}>
                  Partner Schools
                </span>
              </li>
              <li>
                <span className="landing-nav-link" onClick={() => scrollToSection('security')}>
                  Security & Cloud
                </span>
              </li>
            </ul>
          </nav>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={handlePortalEntry}
              className="btn btn-primary"
              style={{
                padding: '9px 18px',
                fontSize: '0.9rem',
                fontWeight: 600,
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
              }}
            >
              {user ? (
                <>
                  <span>Open Dashboard</span>
                  <ArrowRight size={16} />
                </>
              ) : (
                <>
                  <span>Portal Login</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="landing-hero" style={{ overflow: 'hidden' }}>
        <div className="glow-bg" />

        <div style={{ maxWidth: '960px', margin: '0 auto', position: 'relative', zIndex: 1 }} className="scroll-reveal">
          <div className="landing-hero-badge">
            <ShieldCheck size={16} />
            <span>Next-Gen Multi-Tenant Architecture</span>
          </div>

          <h1 className="landing-hero-title">
            Unified Cloud Platform for <span>Modern School Management</span>
          </h1>

          <p className="landing-hero-sub">
            Streamline your academic operations with smart daily roll-call attendance,
            instant grade publishing, transparent tuition invoicing, and automated
            parental email alerts on one unified, high-security cloud platform.
          </p>

          <div className="landing-hero-actions">
            <button
              onClick={handlePortalEntry}
              className="btn btn-primary"
              style={{ padding: '14px 28px', fontSize: '1.05rem', fontWeight: 700, borderRadius: '10px' }}
            >
              {user ? 'Open Your Dashboard' : 'Access School Portal'}
              <ArrowRight size={18} />
            </button>

            <button
              onClick={() => scrollToSection('services')}
              className="btn btn-outline"
              style={{ padding: '14px 24px', fontSize: '1.05rem', fontWeight: 600, borderRadius: '10px', background: '#ffffff' }}
            >
              Explore Services
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Live Metrics Ribbon */}
        <div className="metrics-ribbon scroll-reveal delay-200" style={{ position: 'relative', zIndex: 1 }}>
          <div className="metric-card">
            <div className="metric-value">{metrics.total_schools || schools.length || 4}+</div>
            <div className="metric-label">Active Partner Schools</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{metrics.total_students || 120}+</div>
            <div className="metric-label">Enrolled Students</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{metrics.total_classes || 10}+</div>
            <div className="metric-label">Academic Classes & Cohorts</div>
          </div>
          <div className="metric-card">
            <div className="metric-value" style={{ color: 'var(--success)' }}>
              {metrics.total_emails_sent || 18}+
            </div>
            <div className="metric-label">Automated Email Notifications Sent</div>
          </div>
        </div>

        {/* Interactive Hero SaaS Mockup Preview */}
        <div style={{ maxWidth: '1060px', margin: '52px auto 0', position: 'relative', zIndex: 1 }} className="scroll-reveal delay-300">
          <div
            className="animate-float"
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.15)',
              overflow: 'hidden'
            }}
          >
            {/* Mockup Top Window Bar */}
            <div
              style={{
                background: '#f8fafc',
                borderBottom: '1px solid var(--border)',
                padding: '12px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }} />
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b' }} />
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981' }} />
              </div>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  padding: '4px 16px',
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  fontFamily: 'monospace'
                }}
              >
                https://portal.schoolcloud.edu/admin/dashboard
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600 }}>
                <CheckCircle2 size={14} />
                <span>Multi-Tenant Active</span>
              </div>
            </div>

            {/* Mockup Body Content */}
            <div style={{ padding: '24px', background: '#fdfdfd' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                <div style={{ padding: '16px', background: '#eff6ff', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e40af' }}>Daily Roll-Call Attendance</span>
                    <CalendarCheck size={18} color="#2563eb" />
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e3a8a' }}>98.6% Present</div>
                  <span style={{ fontSize: '0.75rem', color: '#3b82f6' }}>Instant parental absence alert dispatched</span>
                </div>

                <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#166534' }}>Exams & Grade Records</span>
                    <Award size={18} color="#16a34a" />
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#14532d' }}>Term 1 - Published</div>
                  <span style={{ fontSize: '0.75rem', color: '#15803d' }}>Cumulative GPA calculated automatically</span>
                </div>

                <div style={{ padding: '16px', background: '#faf5ff', borderRadius: '10px', border: '1px solid #e9d5ff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6b21a8' }}>Tuition & Invoicing</span>
                    <CreditCard size={18} color="#9333ea" />
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#581c87' }}>Automated Receipts</div>
                  <span style={{ fontSize: '0.75rem', color: '#7e22ce' }}>Real-time balance settlement tracking</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="landing-section">
        <div className="section-head scroll-reveal">
          <span className="section-badge">Platform Architecture</span>
          <h2 className="section-title">Why Modern Institutions Choose School Cloud</h2>
          <p className="section-subtitle">
            Built from the ground up for security, seamless collaboration, and high reliability,
            giving school leadership complete command over their institution.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '36px', alignItems: 'center' }}>
          <div className="scroll-reveal delay-100">
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Layers size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '6px' }}>Multi-Tenant Data Isolation</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.55 }}>
                  Every educational institution operates within its own isolated tenant environment. School records, students, and finances are fully protected against cross-school data leaks.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'var(--success-bg)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Mail size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '6px' }}>Automated SMTP Parental Alerts</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.55 }}>
                  Guardians and parents receive verified real-time notifications for unexcused student absences, published term exam grades, and formal payment receipts.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ShieldCheck size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '6px' }}>Strict Role-Based Access Control (RBAC)</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.55 }}>
                  Enforced privilege boundaries between Platform Master Admin, School Principals (Super Admin), Department Teachers, and Enrolled Students.
                </p>
              </div>
            </div>
          </div>

          <div
            className="scroll-reveal delay-200"
            style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              color: '#ffffff',
              padding: '38px',
              borderRadius: '20px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div style={{ display: 'inline-flex', padding: '8px 14px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontSize: '0.8rem', fontWeight: 600, marginBottom: '16px' }}>
              Cloud Infrastructure
            </div>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '14px', lineHeight: 1.25 }}>
              Security, High Performance & 24/7 Availability
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '24px' }}>
              Engineered with transactional integrity (MySQL/MariaDB), secure Bcrypt password encryption, JWT authentication, and soft-delete safeguards against accidental loss.
            </p>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#e2e8f0', fontSize: '0.9rem' }}>
                <CheckCircle2 size={18} color="#38bdf8" />
                <span>99.9% Uptime with automated daily data backups</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#e2e8f0', fontSize: '0.9rem' }}>
                <CheckCircle2 size={18} color="#38bdf8" />
                <span>Dedicated custom branding and theme colors per tenant</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#e2e8f0', fontSize: '0.9rem' }}>
                <CheckCircle2 size={18} color="#38bdf8" />
                <span>Immediate technical support and platform maintenance</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="landing-section" style={{ background: '#f8fafc', maxWidth: '100%' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div className="section-head scroll-reveal">
            <span className="section-badge">Core Capabilities</span>
            <h2 className="section-title">All-in-One Cloud Management Suite</h2>
            <p className="section-subtitle">
              Comprehensive tools designed to manage students, academic grades, faculty, tuition fees, and administrative audits seamlessly.
            </p>
          </div>

          <div className="landing-grid-3">
            {/* Feature 1 */}
            <div className="feature-box scroll-reveal delay-100">
              <div className="feature-icon-wrapper">
                <School size={24} />
              </div>
              <h4>Multi-Tenant Campus Network</h4>
              <p>
                Each school manages its own independent dashboard, custom classes, students, and curriculum, while Master Admin retains platform-level observability.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="feature-box scroll-reveal delay-200">
              <div className="feature-icon-wrapper" style={{ background: '#ecfdf5', color: '#059669' }}>
                <CalendarCheck size={24} />
              </div>
              <h4>Smart Roll-Call Attendance</h4>
              <p>
                Teachers mark attendance in seconds on desktop or mobile. Students marked absent automatically trigger an urgent email alert directly to parents.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="feature-box scroll-reveal delay-300">
              <div className="feature-icon-wrapper" style={{ background: '#fef3c7', color: '#d97706' }}>
                <Award size={24} />
              </div>
              <h4>Examinations & Grade Publishing</h4>
              <p>
                Publish exam scores, calculate term GPAs, generate academic report cards, and notify families as soon as results are finalized.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="feature-box scroll-reveal delay-100">
              <div className="feature-icon-wrapper" style={{ background: '#faf5ff', color: '#7c3aed' }}>
                <CreditCard size={24} />
              </div>
              <h4>Tuition & Financial Invoicing</h4>
              <p>
                Track tuition payments, monitor outstanding dues, generate official payment receipts, and maintain clear bursar records.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="feature-box scroll-reveal delay-200">
              <div className="feature-icon-wrapper" style={{ background: '#eff6ff', color: '#2563eb' }}>
                <Mail size={24} />
              </div>
              <h4>Enterprise SMTP Email Engine</h4>
              <p>
                Connected directly to Google SMTP and SendGrid gateways for 100% reliable automated delivery of notices and official audit records.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="feature-box scroll-reveal delay-300">
              <div className="feature-icon-wrapper" style={{ background: '#fdf2f8', color: '#db2777' }}>
                <ShieldCheck size={24} />
              </div>
              <h4>Platform Master Control</h4>
              <p>
                Live MySQL database maintenance, query optimization, global web design personalization, and tenant provisioning.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Member Schools Showcase (ONLY School Name and Location) */}
      <section id="schools" className="landing-section">
        <div className="section-head scroll-reveal">
          <span className="section-badge">Academic Institutions</span>
          <h2 className="section-title">Our Partner Schools</h2>
          <p className="section-subtitle">
            Leading academic institutions and colleges powered by the School Cloud Platform.
          </p>
        </div>

        <div className="schools-grid-minimal">
          {schools && schools.length > 0 ? (
            schools.map((s, index) => {
              const delayClass = `delay-${((index % 4) + 1) * 100}`;
              return (
                <div
                  key={s.id}
                  className={`school-card-minimal scroll-reveal ${delayClass}`}
                  style={{ '--card-color': s.theme_color || 'var(--primary)' }}
                >
                  <div className="school-avatar" style={{ background: s.theme_color || 'var(--primary)' }}>
                    {s.logo_url ? (
                      <img
                        src={s.logo_url}
                        alt={s.school_name}
                        style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover' }}
                      />
                    ) : (
                      <School size={26} color="#ffffff" />
                    )}
                  </div>

                  <div className="school-info">
                    <h3 className="school-name">
                      {s.school_name}
                    </h3>
                    <div className="school-location">
                      <MapPin size={16} color={s.theme_color || 'var(--primary)'} />
                      <span>{s.address || 'Academic Campus'}</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              No partner schools registered currently.
            </div>
          )}
        </div>
      </section>

      {/* Security & Tech Banner */}
      <section id="security" style={{ padding: '0 20px' }}>
        <div className="tech-banner scroll-reveal">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'inline-flex', padding: '6px 12px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontSize: '0.78rem', fontWeight: 600, marginBottom: '14px' }}>
                Enterprise Grade Protection
              </div>
              <h3>Your Institutional Data is Encrypted & Secure</h3>
              <p>
                We adhere to enterprise security standards to protect student privacy and school records. All network traffic is encrypted via SSL/TLS, and credentials are protected with salted Bcrypt hashing.
              </p>
              <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
                <button
                  onClick={handlePortalEntry}
                  className="btn btn-primary"
                  style={{ padding: '10px 20px', borderRadius: '8px', fontWeight: 600 }}
                >
                  Access School Portal
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '18px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <Lock size={20} color="#38bdf8" style={{ marginBottom: '8px' }} />
                <h5 style={{ margin: '0 0 4px 0', fontSize: '0.95rem' }}>Encrypted Credentials</h5>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>Salted Bcrypt algorithms</p>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '18px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <Database size={20} color="#38bdf8" style={{ marginBottom: '8px' }} />
                <h5 style={{ margin: '0 0 4px 0', fontSize: '0.95rem' }}>MariaDB / MySQL</h5>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>ACID Transaction safety</p>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '18px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <Server size={20} color="#38bdf8" style={{ marginBottom: '8px' }} />
                <h5 style={{ margin: '0 0 4px 0', fontSize: '0.95rem' }}>Automated Backups</h5>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>Zero data loss protection</p>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '18px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <Mail size={20} color="#38bdf8" style={{ marginBottom: '8px' }} />
                <h5 style={{ margin: '0 0 4px 0', fontSize: '0.95rem' }}>Google SMTP Active</h5>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>100% Delivery rate</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="landing-footer scroll-reveal">
        <div className="footer-inner">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ background: settings.theme_color || 'var(--primary)', color: '#fff', padding: '8px', borderRadius: '8px', display: 'flex' }}>
                <School size={20} />
              </div>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
                {settings.platform_name || 'School Cloud Platform'}
              </span>
            </div>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.6, maxWidth: '320px', color: '#94a3b8' }}>
              {settings.platform_tagline || 'Next-generation educational technology for modern academies and schools.'}
            </p>
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
              {settings.contact_email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={15} color="#38bdf8" />
                  <span>{settings.contact_email}</span>
                </div>
              )}
              {settings.contact_phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building2 size={15} color="#38bdf8" />
                  <span>{settings.contact_phone}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h5 style={{ color: '#ffffff', fontSize: '0.95rem', marginBottom: '16px', fontWeight: 700 }}>
              Quick Navigation
            </h5>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem' }}>
              <li>
                <span style={{ cursor: 'pointer', color: '#94a3b8' }} onClick={() => scrollToSection('home')}>
                  Home
                </span>
              </li>
              <li>
                <span style={{ cursor: 'pointer', color: '#94a3b8' }} onClick={() => scrollToSection('about')}>
                  About Platform
                </span>
              </li>
              <li>
                <span style={{ cursor: 'pointer', color: '#94a3b8' }} onClick={() => scrollToSection('services')}>
                  Services & Modules
                </span>
              </li>
              <li>
                <span style={{ cursor: 'pointer', color: '#94a3b8' }} onClick={() => scrollToSection('schools')}>
                  Partner Schools
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h5 style={{ color: '#ffffff', fontSize: '0.95rem', marginBottom: '16px', fontWeight: 700 }}>
              Portals & Access
            </h5>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem' }}>
              <li>
                <span style={{ cursor: 'pointer', color: '#38bdf8' }} onClick={() => navigate('/login')}>
                  School Portal Login
                </span>
              </li>
              <li>
                <span style={{ cursor: 'pointer', color: '#94a3b8' }} onClick={() => navigate('/login')}>
                  Principal Dashboard
                </span>
              </li>
              <li>
                <span style={{ cursor: 'pointer', color: '#94a3b8' }} onClick={() => navigate('/login')}>
                  Teacher Portal
                </span>
              </li>
              <li>
                <span style={{ cursor: 'pointer', color: '#94a3b8' }} onClick={() => navigate('/login')}>
                  Student & Parent Portal
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h5 style={{ color: '#ffffff', fontSize: '0.95rem', marginBottom: '16px', fontWeight: 700 }}>
              Security & Privacy
            </h5>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem' }}>
              <li><span>Data Isolation Policy</span></li>
              <li><span>Terms of Service</span></li>
              <li><span>Cloud Security Compliance</span></li>
              <li><span>Release v2.0 (Active)</span></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p style={{ margin: 0 }}>
            {settings.footer_text || '2026 School Cloud Platform. All rights reserved.'}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
