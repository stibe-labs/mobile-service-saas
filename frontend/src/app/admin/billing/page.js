'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

export default function BillingPage() {
  const { user } = useAuth();

  if (!user || user.role !== 'tenant_admin') {
    return <div style={{ padding: '20px' }}>Access denied. Only Shop Owners can manage billing.</div>;
  }

  return (
    <div className="billing-page">
      <h2>Subscription & Billing</h2>
      <p>Manage your SaaS plan, update payment methods, and download invoices securely via Razorpay.</p>

      <div className="billing-card">
        <h3>Account Status: <span style={{color: '#10b981'}}>Active</span></h3>
        <p>Your shop is currently active and your payments are securely managed via Razorpay.</p>
        
        <div className="info-box">
          <p><strong>Note:</strong> To upgrade your plan or download tax invoices, please contact support or check your Razorpay email receipts.</p>
        </div>
      </div>

      <style jsx>{`
        .billing-page {
          padding: 30px;
          font-family: 'Inter', sans-serif;
        }
        h2 { margin-top: 0; color: #111827; }
        p { color: #4b5563; line-height: 1.5; }
        .billing-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 30px;
          margin-top: 30px;
          max-width: 500px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        }
        .billing-card h3 { margin-top: 0; color: #1f2937; margin-bottom: 15px; }
        .info-box {
          margin-top: 25px;
          padding: 15px;
          background: #f3f4f6;
          border-radius: 8px;
          font-size: 14px;
        }
        .info-box p {
          margin: 0;
          color: #374151;
        }
      `}</style>
    </div>
  );
}
