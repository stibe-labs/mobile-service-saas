const express = require('express');
const crypto = require('crypto');
const { query } = require('../config/db');

const router = express.Router();

router.post('/razorpay', express.json(), async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'dummy_webhook_secret';
  
  const shasum = crypto.createHmac('sha256', secret);
  shasum.update(JSON.stringify(req.body));
  const digest = shasum.digest('hex');

  if (digest !== req.headers['x-razorpay-signature']) {
    return res.status(400).send('Invalid signature');
  }

  const event = req.body;

  try {
    switch (event.event) {
      case 'subscription.charged': {
        const subscription = event.payload.subscription.entity;
        const subId = subscription.id;
        const status = subscription.status; // 'active'
        
        await query(`
          UPDATE subscriptions SET status = $1 WHERE razorpay_subscription_id = $2
        `, [status, subId]);

        await query(`
          UPDATE tenants SET status = 'active' WHERE razorpay_subscription_id = $1
        `, [subId]);

        console.log(`✅ Webhook: Subscription charged ${subId}`);
        break;
      }
      
      case 'subscription.halted':
      case 'subscription.cancelled': {
        const subscription = event.payload.subscription.entity;
        const subId = subscription.id;
        const status = subscription.status;
        
        await query(`
          UPDATE subscriptions SET status = $1 WHERE razorpay_subscription_id = $2
        `, [status, subId]);

        await query(`
          UPDATE tenants SET status = 'suspended' WHERE razorpay_subscription_id = $1
        `, [subId]);
        
        console.log(`⛔ Webhook: Suspended tenant with subscription ${subId}`);
        break;
      }
      default:
        console.log(`Unhandled event type ${event.event}`);
    }
  } catch (err) {
    console.error('Error processing webhook event:', err);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }

  res.send({ status: 'ok' });
});

module.exports = router;
