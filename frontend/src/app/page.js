'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import './landing.css';

export default function HomePage() {
  const router = useRouter();
  
  useEffect(() => {
    // Intersection Observer for scroll animations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    
    return () => {
      observer.disconnect();
    };
  }, []);
  
  return (
    <div className="landing-page">
      <header className="navbar">
        <div className="brand" onClick={() => window.scrollTo(0, 0)}>
          <img src="/Stibe-logo-black.png" alt="Stibe Logo" className="logo-img" />
        </div>
        <div className="nav-links">
          <Link href="#features">Features</Link>
          <Link href="#pricing">Pricing</Link>
          <Link href="/login" className="login-btn">Log In</Link>
        </div>
      </header>
      
      <main>
        {/* Hero Section */}
        <section className="hero">
          <div className="hero-content slide-in-left">
            <div className="pill-badge">✨ Version 2.0 is now live</div>
            <h1>The Ultimate Operating System for <span className="highlight">Repair Shops</span></h1>
            <p>
              Leave paper job cards behind. FixFlow gives you digital repair tracking, technician management, and integrated billing all in one beautiful, lightning-fast workspace.
            </p>
            <div className="hero-buttons">
              <button className="cta-btn primary" onClick={() => router.push('#pricing')}>Start Free Trial</button>
              <button className="cta-btn secondary" onClick={() => router.push('#features')}>Explore Features</button>
            </div>
          </div>
          <div className="hero-image-wrapper slide-in-right">
             <div className="mockup-window">
               <div className="mockup-header">
                 <span className="dot red"></span>
                 <span className="dot yellow"></span>
                 <span className="dot green"></span>
               </div>
               <img src="/dashboard-mockup.png" className="mockup-img" alt="Main Branch Dashboard" />
             </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="features">
          <div className="section-header reveal">
            <h2>Everything you need to scale</h2>
            <p>Powerful tools designed specifically for mobile service centers.</p>
          </div>
          
          <div className="feature-grid">
            <div className="feature-card reveal delay-1" style={{ backgroundImage: "url('/feature_job_cards.png')" }}>
              <div className="feature-content-overlay">
                <div className="feature-icon">
                  <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                </div>
                <div className="text-content">
                  <h3>Digital Job Cards</h3>
                  <p>Create and print professional service receipts instantly. Track every device seamlessly.</p>
                </div>
              </div>
            </div>
            
            <div className="feature-card reveal delay-2" style={{ backgroundImage: "url('/feature_technician.png')" }}>
              <div className="feature-content-overlay">
                <div className="feature-icon">
                  <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </div>
                <div className="text-content">
                  <h3>Technician Portals</h3>
                  <p>Give your staff their own dedicated dashboards to update repair statuses in real-time.</p>
                </div>
              </div>
            </div>
            
            <div className="feature-card reveal delay-3" style={{ backgroundImage: "url('/feature_branches.png')" }}>
              <div className="feature-content-overlay">
                <div className="feature-icon">
                  <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>
                </div>
                <div className="text-content">
                  <h3>Multi-Branch Support</h3>
                  <p>Manage multiple storefronts from one centralized Super Admin view.</p>
                </div>
              </div>
            </div>
            
            <div className="feature-card reveal delay-4" style={{ backgroundImage: "url('/feature_inventory.png')" }}>
              <div className="feature-content-overlay">
                <div className="feature-icon">
                  <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                </div>
                <div className="text-content">
                  <h3>Inventory Tracking</h3>
                  <p>Monitor your parts catalog and know exactly what components were used in every repair.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="pricing">
          <div className="section-header reveal">
            <h2>Simple, transparent pricing</h2>
            <p>No hidden fees. Choose the plan that fits your shop's size.</p>
          </div>
          
          <div className="pricing-cards">
            {/* Starter */}
            <div className="card reveal delay-1">
              <div className="card-top">
                <h3>Starter</h3>
                <p className="card-desc">Perfect for independent shops</p>
                <div className="price-container">
                  <span className="currency">$</span>
                  <span className="price">10</span>
                  <span className="period">/mo</span>
                </div>
              </div>
              <ul className="features-list">
                <li>1 Branch only</li>
                <li>Up to 2 Technicians</li>
                <li>100 Job Cards / month</li>
                <li>Digital Job Cards</li>
              </ul>
              <button className="plan-btn" onClick={() => router.push('/signup?plan=starter')}>Get Starter</button>
            </div>
            
            {/* Professional */}
            <div className="card pro reveal delay-2">
              <div className="badge">Most Popular</div>
              <div className="card-top">
                <h3>Professional</h3>
                <p className="card-desc">For growing service centers</p>
                <div className="price-container">
                  <span className="currency">$</span>
                  <span className="price">20</span>
                  <span className="period">/mo</span>
                </div>
              </div>
              <ul className="features-list">
                <li>Up to 3 Branches</li>
                <li>Up to 10 Technicians</li>
                <li>Unlimited Job Cards</li>
                <li>Printable Receipts</li>
              </ul>
              <button className="plan-btn active" onClick={() => router.push('/signup?plan=pro')}>Start Professional Trial</button>
            </div>
            
            {/* Enterprise */}
            <div className="card reveal delay-3">
              <div className="card-top">
                <h3>Enterprise</h3>
                <p className="card-desc">For large franchises</p>
                <div className="price-container">
                  <span className="currency">$</span>
                  <span className="price">39</span>
                  <span className="period">/mo</span>
                </div>
              </div>
              <ul className="features-list">
                <li>Unlimited Branches</li>
                <li>Unlimited Technicians</li>
                <li>Financial Analytics</li>
                <li>Dedicated Support</li>
              </ul>
              <button className="plan-btn" onClick={() => router.push('/signup?plan=enterprise')}>Contact Sales</button>
            </div>
          </div>
        </section>
        
        {/* CTA Footer */}
        <section className="cta-footer">
          <h2>Ready to transform your repair shop?</h2>
          <p>Join thousands of technicians using FixFlow today.</p>
          <button className="cta-btn primary" onClick={() => router.push('#pricing')}>Get Started Now</button>
        </section>
      </main>
    </div>
  );
}
