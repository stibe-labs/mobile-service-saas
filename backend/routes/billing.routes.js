const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { query } = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});

// ─── POST /api/billing/checkout ───────────────────────────
// Flow: Create Razorpay Order
router.post('/checkout', async (req, res) => {
  try {
    const { plan, tenantId } = req.body;
    
    // Determine amount based on plan (in paise, so 999 INR = 99900)
    let amount = 0;
    if (plan === 'starter') amount = 99900;
    else if (plan === 'pro') amount = 299900;
    else if (plan === 'enterprise') amount = 999900;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required.' });
    }

    // Create Order
    const order = await razorpay.orders.create({
      amount: amount,
      currency: "INR",
      receipt: ("rcpt_" + tenantId).substring(0, 40),
      notes: {
        tenant_id: tenantId,
        plan_tier: plan
      }
    });

    res.json({
      order_id: order.id,
      key_id: razorpay.key_id,
      tenant_id: tenantId,
      plan: plan
    });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: 'Failed to create Razorpay order.' });
  }
});

// ─── POST /api/billing/verify ─────────────────────────────
// Flow: Verify Payment Signature & Provision Immediately
router.post('/verify', async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, tenantId, plan } = req.body;

    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'dummy_secret')
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Determine limits based on plan
    let maxBranches = 1;
    let maxTechnicians = 2;
    let printableReceipt = false;

    if (plan === 'pro') {
      maxBranches = 3;
      maxTechnicians = 10;
      printableReceipt = true;
    } else if (plan === 'enterprise') {
      maxBranches = 999;
      maxTechnicians = 999;
      printableReceipt = true;
    }

    // 1. Update tenant account status and limits
    await query(`
      UPDATE tenants 
      SET status = 'active', 
          razorpay_subscription_id = $1, 
          plan_tier = $2,
          max_branches = $3,
          max_technicians = $4
      WHERE id = $5
    `, [razorpay_order_id, plan, maxBranches, maxTechnicians, tenantId]);

    // 2. Update feature toggles
    await query(`
      UPDATE feature_toggles 
      SET printable_receipt = $1
      WHERE tenant_id = $2
    `, [printableReceipt, tenantId]);

    // 3. Add to subscriptions table
    await query(`
      INSERT INTO subscriptions (tenant_id, razorpay_customer_id, razorpay_subscription_id, plan_id, status)
      VALUES ($1, 'unknown', $2, $3, 'active')
      ON CONFLICT (razorpay_subscription_id) DO UPDATE SET status = 'active'
    `, [tenantId, razorpay_order_id, plan]);

    res.json({ success: true });
  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

module.exports = router;
