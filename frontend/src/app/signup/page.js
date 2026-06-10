'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Wrap the main content in a component that uses useSearchParams
function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan') || 'starter';

  const [formData, setFormData] = useState({
    shopName: '',
    fullName: '',
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Register the pending tenant account
      const regRes = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const regData = await regRes.json();
      if (!regRes.ok) throw new Error(regData.error || 'Registration failed');

      const tenantId = regData.tenant.id;

      // 2. Create Razorpay Checkout Session
      const checkoutRes = await fetch('http://localhost:5000/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, tenantId }),
      });

      const checkoutData = await checkoutRes.json();
      if (!checkoutRes.ok) throw new Error(checkoutData.error || 'Checkout failed');

      // 3. Load Razorpay script
      const res = await loadRazorpay();
      if (!res) throw new Error('Razorpay SDK failed to load. Are you online?');

      // 4. Open Razorpay modal
      const options = {
        key: checkoutData.key_id,
        order_id: checkoutData.order_id,
        name: "FixFlow SaaS",
        description: `FixFlow ${plan.toUpperCase()} Plan`,
        handler: async function (response) {
          try {
            setLoading(true);
            // Verify payment
            const verifyRes = await fetch('http://localhost:5000/api/billing/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                tenantId: checkoutData.tenant_id,
                plan: checkoutData.plan
              })
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error || 'Payment verification failed');
            
            // Redirect to login after successful payment
            window.location.href = `/login?message=Subscription active. Please log in.`;
          } catch (err) {
            setError(err.message);
            setLoading(false);
          }
        },
        prefill: {
          name: formData.fullName,
          email: formData.email,
        },
        theme: {
          color: "#2563eb"
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){
        setError("Payment failed: " + response.error.description);
      });
      rzp.open();
      
      // We stop the spinning loader here because the Razorpay modal is handling the UI now
      setLoading(false);

    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-box">
        <div className="header">
          <h2>Create Your Account</h2>
          <p>You're signing up for the <strong>{plan.toUpperCase()}</strong> plan.</p>
        </div>

        {error && <div className="error-alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Shop Name</label>
            <input type="text" name="shopName" value={formData.shopName} onChange={handleChange} required placeholder="e.g. Quick Fix Mobiles" />
          </div>

          <div className="form-group">
            <label>Owner Name</label>
            <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required placeholder="Your full name" />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="owner@shop.com" />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="Min. 6 characters" minLength={6} />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Setting up...' : 'Continue to Payment'}
          </button>
        </form>
        <div className="footer">
          Already have an account? <Link href="/login">Log in here</Link>
        </div>
      </div>

      <style jsx>{`
        .signup-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f3f4f6; font-family: 'Inter', sans-serif; padding: 20px; }
        .signup-box { background: #fff; padding: 40px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); width: 100%; max-width: 500px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h2 { margin: 0; font-size: 28px; color: #111827; }
        .header p { color: #6b7280; margin-top: 8px; }
        .error-alert { background: #fee2e2; color: #b91c1c; padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 14px; text-align: center; }
        .form-group { margin-bottom: 20px; }
        .form-row { display: flex; gap: 15px; }
        .form-row .form-group { flex: 1; }
        label { display: block; margin-bottom: 6px; font-weight: 500; color: #374151; font-size: 14px; }
        input { width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 15px; box-sizing: border-box; }
        input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
        .submit-btn { width: 100%; background: #2563eb; color: #fff; border: none; padding: 14px; font-size: 16px; font-weight: 600; border-radius: 8px; cursor: pointer; transition: 0.2s; margin-top: 10px; }
        .submit-btn:hover:not(:disabled) { background: #1d4ed8; }
        .submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .footer { text-align: center; margin-top: 24px; font-size: 14px; color: #6b7280; }
        .footer a { color: #2563eb; text-decoration: none; font-weight: 500; }
        .footer a:hover { text-decoration: underline; }
      `}</style>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>}>
      <SignupForm />
    </Suspense>
  );
}
