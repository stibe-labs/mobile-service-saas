# Mobile Service Shop SaaS Business Plan

Since the current MVP is lean and focused strictly on operational workflow, we have a fantastic opportunity to build a tiered SaaS pricing model. We can offer the core workflow for free or cheap to acquire users, and then upsell them on the advanced financial, analytics, and automation features that businesses need as they grow.

Here is a strategic 3-tier SaaS Payment Plan to transition this project into a profitable subscription business.

---

## 🟢 Tier 1: Starter (The "Basic Operations" Plan)
**Target Audience:** Independent single-location repair shops looking to digitize paper job cards.
**Pricing:** $10/month

**Limits:** 
- 1 Branch only
- Up to 2 Technicians
- Up to 100 Job Cards per month

**Features Included (Current MVP):**
- Create and manage digital Job Cards
- Track Service Status (Received, Checking, Repaired, Delivered)
- Track Advance Payments
- Basic Parts Catalog (Add/Edit parts)
- Record Technician & Repair Notes
- Dedicated Technician Dashboard
- Standard Printable Job Card

---

## 🔵 Tier 2: Professional (The "Growth & Communication" Plan)
**Target Audience:** Growing businesses with a few branches that need better communication and inventory oversight.
**Pricing:** $20/month

**Limits:** 
- Up to 3 Branches
- Up to 10 Technicians
- Unlimited Job Cards

**Features Included:**
- *Everything in Starter, plus:*
- **Multi-Branch Management:** Unified dashboard to see jobs across branches.
- **Printable Service Receipts:** (Currently a feature toggle, unlocked at this tier).
- **Inventory Alerts:** Low-stock warnings for the parts catalog.
- **Outside Purchase Tracking:** Ability to track parts bought from external vendors on the fly.
- *(Future Feature)* **WhatsApp / SMS Notifications:** Automatically text the customer when status changes to "Repaired".
- *(Future Feature)* **Customer Portal:** A simple link where customers can check their repair status.

---

## 🟣 Tier 3: Enterprise (The "Full Financial Suite" Plan)
**Target Audience:** Large repair franchises that need deep financial analytics and employee performance tracking.
**Pricing:** $39/month

**Limits:** 
- Unlimited Branches
- Unlimited Technicians
- Dedicated Support

**Features Included:**
- *Everything in Professional, plus the advanced features stripped from v1.0:*
- **Financial Analytics:** Auto-profit calculation, sales/revenue tracking, and branch-wise P&L reports.
- **Payment Splitting:** Track Cash vs. Bank vs. Credit Card payments.
- **Technician Performance & Commission:** Track how many devices a technician fixed and calculate commissions.
- **Daily Closing Reports:** Auto-generated end-of-day financial reconciliation.
- **Audit Logs:** Track exactly which user changed what data and when.
- **Data Export:** PDF and Excel exports for accounting purposes.

---

## 🚀 Development Roadmap to SaaS

To get the app ready for this SaaS model, here is what we need to build next:

> [!IMPORTANT]
> **Phase 1: Billing & Subscription Engine**
> We need to integrate a payment gateway (like Stripe or Razorpay) and a subscription tracking table in the database so the Super Admin can restrict features automatically based on the tenant's active subscription tier.

> [!TIP]
> **Phase 2: Automated Communication**
> Implementing SMS/WhatsApp APIs (like Twilio) is the biggest selling point for the **Professional Tier**. Shop owners love automated customer updates.

> [!NOTE]
> **Phase 3: Restoring Financial Modules**
> Rebuilding the profit calculation and daily closing reports will be the key to unlocking the high-ticket **Enterprise Tier**.
