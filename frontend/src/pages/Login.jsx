import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { School, Lock, Mail, ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [platformName, setPlatformName] = useState('School Management Cloud');
  const [platformColor, setPlatformColor] = useState('#2563eb');
  const { user, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await apiRequest('/platform/settings');
        if (res.success && res.settings) {
          if (res.settings.platform_name) setPlatformName(res.settings.platform_name);
          if (res.settings.theme_color) {
            setPlatformColor(res.settings.theme_color);
            document.documentElement.style.setProperty('--primary', res.settings.theme_color);
            document.documentElement.style.setProperty('--primary-light', res.settings.theme_color + '15');
          }
        }
      } catch (err) {
        // Fallback to defaults
      }
    };
    fetchSettings();
  }, []);

  // If already authenticated, redirect straight to their dashboard
  useEffect(() => {
    if (user) {
      if (user.role === 'root_admin') navigate('/master', { replace: true });
      else if (user.role === 'super_admin') navigate('/admin', { replace: true });
      else if (user.role === 'teacher') navigate('/teacher', { replace: true });
      else navigate('/student', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loggedUser = await login(email, password);
      if (loggedUser.role === 'root_admin') navigate('/master');
      else if (loggedUser.role === 'super_admin') navigate('/admin');
      else if (loggedUser.role === 'teacher') navigate('/teacher');
      else navigate('/student');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemo = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  return (
    <div className="auth-wrapper" style={{ flexDirection: 'column', gap: '16px' }}>
      <div style={{ width: '100%', maxWidth: '440px', display: 'flex', justifyContent: 'flex-start' }}>
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--secondary)',
            textDecoration: 'none',
            fontSize: '0.88rem',
            fontWeight: 600,
            padding: '6px 12px',
            borderRadius: '6px',
            background: 'rgba(255, 255, 255, 0.8)',
            border: '1px solid var(--border)'
          }}
        >
          <ArrowLeft size={16} />
          <span>Ku Laabo Bogga Hore (Back to Home)</span>
        </Link>
      </div>

      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            display: 'inline-flex',
            padding: '12px',
            background: 'var(--primary-light)',
            color: platformColor,
            borderRadius: '12px',
            marginBottom: '12px'
          }}>
            <School size={32} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>
            School Portal Login
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            {platformName}
          </p>
        </div>

        {error && (
          <div style={{
            background: 'var(--danger-bg)',
            color: 'var(--danger)',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            marginBottom: '16px',
            border: '1px solid #fecaca'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="form-input"
                style={{ paddingLeft: '36px' }}
                placeholder="name@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="form-input"
                style={{ paddingLeft: '36px' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '8px', padding: '10px' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="demo-box">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '8px' }}>
            <ShieldCheck size={16} color="var(--primary)" />
            <span>Click to fill Demo Accounts (Password: Password123!):</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{ fontWeight: 600, gridColumn: 'span 2', borderColor: 'var(--primary)' }}
              onClick={() => setDemo('axmedjidhe12@gmail.com')}
            >
              Master Admin (Sayid Aladiih)
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setDemo('admin@greenwood.edu')}
            >
              Principal (Greenwood)
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setDemo('admin@stpatricks.edu')}
            >
              Principal (St. Patrick)
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setDemo('principal@halgan.edu')}
            >
              Principal (Halgan)
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setDemo('sarah.jenkins@greenwood.edu')}
            >
              Teacher (Greenwood)
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setDemo('john.doe@student.greenwood.edu')}
            >
              Student (Greenwood)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
