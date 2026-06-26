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
          <Link href="#how-it-works">How It Works</Link>
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
                  <h3>Inventory & IMEI Tracking</h3>
                  <p>Full stock management with IMEI-level tracking. Know every device's journey from purchase to sale.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Extended Features Grid */}
        <section className="features-extended">
          <div className="section-header reveal">
            <h2>Built for every part of your business</h2>
            <p>From sales to analytics, FixFlow covers the complete mobile service workflow.</p>
          </div>

          <div className="extended-grid">
            <div className="extended-card reveal delay-1">
              <div className="extended-icon blue">
                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
              </div>
              <h3>Sales Module</h3>
              <p>Record device sales with automatic pricing calculation. Track revenue per branch, per staff, per device.</p>
            </div>

            <div className="extended-card reveal delay-2">
              <div className="extended-icon green">
                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
              </div>
              <h3>Branch Pricing & Margins</h3>
              <p>Set custom pricing margins per branch for new, used, and refurbished devices. Control profitability at every level.</p>
            </div>

            <div className="extended-card reveal delay-3">
              <div className="extended-icon purple">
                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 20V10"></path><path d="M18 20V4"></path><path d="M6 20v-4"></path></svg>
              </div>
              <h3>Cross-Branch Analytics</h3>
              <p>Company-wide dashboards showing total revenue, branch-wise profits, top-selling models, and staff performance.</p>
            </div>

            <div className="extended-card reveal delay-1">
              <div className="extended-icon amber">
                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              </div>
              <h3>Sales Staff & Commissions</h3>
              <p>Add sales staff under branches with dedicated dashboards. Track and manage per-sale commissions automatically.</p>
            </div>

            <div className="extended-card reveal delay-2">
              <div className="extended-icon rose">
                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
              </div>
              <h3>Printable Job Cards & Receipts</h3>
              <p>Generate professional, print-ready job cards and delivery receipts with one click. Branded to your shop.</p>
            </div>

            <div className="extended-card reveal delay-3">
              <div className="extended-icon teal">
                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
              </div>
              <h3>Device Model Catalog</h3>
              <p>Maintain a centralized catalog of brands and device models. Pre-fill service forms and inventory entries instantly.</p>
            </div>

            <div className="extended-card reveal delay-1">
              <div className="extended-icon indigo">
                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              </div>
              <h3>Role-Based Access Control</h3>
              <p>Six distinct user roles — Super Admin, Tenant Admin, Branch Manager, Sub-Branch Manager, Sales Staff, and Technician — each with fine-grained permissions.</p>
            </div>

            <div className="extended-card reveal delay-2">
              <div className="extended-icon sky">
                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </div>
              <h3>IMEI Lookup</h3>
              <p>Instantly trace any device's full history — inventory origin, sales record, repair history — all from a single IMEI search.</p>
            </div>

            <div className="extended-card reveal delay-3">
              <div className="extended-icon cyan">
                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
              </div>
              <h3>Parts Management</h3>
              <p>Manage your spare parts catalog with cost and selling prices. Track which parts went into every repair job.</p>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="how-it-works">
          <div className="section-header reveal">
            <h2>Up and running in minutes</h2>
            <p>Getting started with FixFlow is simple.</p>
          </div>

          <div className="steps-grid">
            <div className="step-card reveal delay-1">
              <div className="step-number">1</div>
              <h3>Sign Up & Choose Plan</h3>
              <p>Create your account, pick a plan, and your main branch is provisioned instantly.</p>
            </div>
            <div className="step-connector reveal delay-1">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </div>
            <div className="step-card reveal delay-2">
              <div className="step-number">2</div>
              <h3>Add Branches & Staff</h3>
              <p>Set up your sub-branches, add technicians and sales staff, and configure pricing margins.</p>
            </div>
            <div className="step-connector reveal delay-2">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </div>
            <div className="step-card reveal delay-3">
              <div className="step-number">3</div>
              <h3>Start Operating</h3>
              <p>Create job cards, manage inventory, record sales, and track everything from your dashboard.</p>
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
            <div className="pricing-card reveal delay-1">
              <div className="pricing-card-top">
                <h3>Starter</h3>
                <p className="pricing-card-desc">Perfect for independent shops</p>
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
                <li>Technician Portals</li>
                <li>Parts Management</li>
                <li>Device Model Catalog</li>
              </ul>
              <button className="plan-btn" onClick={() => router.push('/signup?plan=starter')}>Get Starter</button>
            </div>
            
            {/* Professional */}
            <div className="pricing-card pro reveal delay-2">
              <div className="badge">Most Popular</div>
              <div className="pricing-card-top">
                <h3>Professional</h3>
                <p className="pricing-card-desc">For growing service centers</p>
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
                <li>Printable Receipts & Job Cards</li>
                <li>Inventory & IMEI Tracking</li>
                <li>Sales Module</li>
                <li>Sales Staff & Commissions</li>
                <li>Branch Pricing & Margins</li>
                <li>IMEI Lookup</li>
              </ul>
              <button className="plan-btn active" onClick={() => router.push('/signup?plan=pro')}>Start Professional Trial</button>
            </div>
            
            {/* Enterprise */}
            <div className="pricing-card reveal delay-3">
              <div className="pricing-card-top">
                <h3>Enterprise</h3>
                <p className="pricing-card-desc">For large franchises</p>
                <div className="price-container">
                  <span className="currency">$</span>
                  <span className="price">39</span>
                  <span className="period">/mo</span>
                </div>
              </div>
              <ul className="features-list">
                <li>Unlimited Branches</li>
                <li>Unlimited Technicians</li>
                <li>Everything in Professional</li>
                <li>Cross-Branch Analytics</li>
                <li>Role-Based Access Control</li>
                <li>Priority Dedicated Support</li>
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
