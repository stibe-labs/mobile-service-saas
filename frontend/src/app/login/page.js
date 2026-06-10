'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

const features = [
  {
    title: "Real-time Service Analytics",
    description: "Track repair statuses, team performance, and revenue forecasting — all the insights you need to scale confidently."
  },
  {
    title: "Seamless Shop Management",
    description: "Manage technicians, track parts inventory, and handle customer communications from one unified dashboard."
  },
  {
    title: "Automated Workflows",
    description: "Trigger instant SMS notifications and automated status updates the moment a repair is completed."
  }
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [currentFeature, setCurrentFeature] = useState(0);
  const { login } = useAuth();
  const router = useRouter();

  // Carousel logic
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      // The AuthContext handles routing internally upon success
    } catch (err) {
      setError(err.error || err.message || 'Invalid credentials. Please try again.');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
      
      {/* LEFT SIDE - FEATURE CAROUSEL */}
      <div className="login-left-panel" style={{
        flex: '0 0 65%',
        position: 'relative',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '60px',
        color: 'white',
        backgroundColor: 'var(--primary-dark)',
        backgroundImage: 'url(/login_bg_minimal.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
        
        {/* Dark overlay for text readability */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.1) 100%)', zIndex: 1 }}></div>



        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '480px' }}>
          <div style={{ marginBottom: '30px' }}>
            <div style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.2)' }}>
              <span style={{ fontSize: '24px', color: 'var(--accent)' }}>📈</span>
            </div>
            
            <div style={{ minHeight: '140px' }}>
              <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '16px', lineHeight: 1.2, transition: 'opacity 0.3s ease' }}>
                {features[currentFeature].title}
              </h2>
              <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, transition: 'opacity 0.3s ease' }}>
                {features[currentFeature].description}
              </p>
            </div>
          </div>

          {/* Dots */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {features.map((_, idx) => (
              <div 
                key={idx}
                style={{
                  width: idx === currentFeature ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  background: idx === currentFeature ? 'var(--accent)' : 'rgba(255,255,255,0.3)',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Branding */}
        <div style={{ position: 'absolute', top: '40px', left: '60px', zIndex: 2 }}>
          <img src="/Stibe-logo-white.png" alt="Stibe CRM" style={{ height: '48px', width: 'auto', objectFit: 'contain' }} />
        </div>
      </div>

      {/* RIGHT SIDE - LOGIN FORM */}
      <div style={{
        flex: '0 0 35%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        backgroundColor: 'var(--card-bg)'
      }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          
          <div style={{ marginBottom: '40px' }}>
            <img src="/Stibe-logo-black.png" alt="Stibe" style={{ height: '48px', width: 'auto', objectFit: 'contain', marginBottom: '24px' }} className="mobile-only-logo" />
            <h1 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.5px' }}>
              Welcome back
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>Sign in to your account to continue</p>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '24px', padding: '12px 16px', borderRadius: 'var(--radius-sm)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label" style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', letterSpacing: '1px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ width: '100%', padding: '14px 16px', fontSize: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: '32px' }}>
              <label className="form-label" style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', letterSpacing: '1px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: '100%', padding: '14px 16px', fontSize: '1rem', letterSpacing: '2px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', outline: 'none' }}
              />
              <div style={{ textAlign: 'right', marginTop: '12px' }}>
                <a href="#" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>Forgot password?</a>
              </div>
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '16px', fontSize: '1.05rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
              Sign In →
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '40px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            © 2026 Mobile Service. All rights reserved.
          </div>
        </div>
      </div>

    </div>
  );
}
