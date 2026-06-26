# Mobile Service Shop — Management Web App
### Requirements Document · v3.0 · June 2026
> This document supersedes v2.0. All v2.0 service/repair features are retained. v3.0 adds the phone sales module, inventory management, branch pricing & commission system, sales dashboards, and universal IMEI device lookup.

**Prepared for:** Internal development use only  
**Company:** Stibe Labs Pvt Ltd · Kochi, Kerala, India

---

## 🆕 New in v3.0

- **Sales Staff Role** — Phone inventory management (new & second-hand phones)
- **Branch Pricing + Staff Commission** — Auto inventory deduction on sale
- **Sales & Profit Dashboard** — Main branch & sub-branch visibility
- **Receipt Generation** — Phone sale receipt
- **Universal IMEI Device Lookup** — Accessible by all user roles

---

## 1. Project Overview

This document defines the v3.0 feature upgrade for the Mobile Service Shop Management Web App. It extends the lean v2.0 MVP (job cards, service tracking, Super Admin controls) with a **full phone sales module**, **inventory management**, **branch pricing & staff commission system**, **sales & profit dashboards**, and **universal IMEI device lookup**.

| Item | Detail |
|---|---|
| Business | Mobile phone repair & sales shop |
| Branches | 5 branch locations (1 Main + 4 Sub-Branches) |
| User Roles | Super Admin · Branch Manager · Tenant User · Sales Staff · Technician |
| Scope | Internal staff use — not customer-facing |
| Base Version | v2.0 (June 2026 MVP — job card & service tracking) |
| This Version | v3.0 — Phone Sales, Inventory, Pricing, Commission, IMEI Lookup |
| Builds On | All v2.0 features retained; new modules added alongside |

> **Scope Note:** v3.0 adds new capabilities on top of the existing v2.0 system. All service/repair job card features from v2.0 remain unchanged. The new Sales Staff role, phone inventory, pricing engine, and IMEI lookup operate as separate but integrated modules.

---

## 2. User Roles

Updated role matrix — v3.0 adds Sales Staff & Branch Manager.

| Role | Who | Access Level | Status |
|---|---|---|---|
| 👑 Super Admin | Platform owner / Stibe Labs team | Full platform — tenants, feature toggles, user quotas | v2.0 |
| 🏪 Branch Manager (Main Branch) | Main shop owner / senior manager | Own branch full control + view all sub-branches sales & profit + set pricing rules | 🆕 v3.0 |
| 🏢 Sub-Branch Manager | Branch manager at sub-location | Own branch only — jobs, sales, own pricing, own profit view | 🆕 v3.0 |
| 🛒 Sales Staff | Phone sales floor staff | Add phone inventory (new/second-hand), record sales, add commission | 🆕 v3.0 |
| 🛠️ Technician | Repair technician | Assigned jobs only — update status & notes + IMEI device lookup | v2.0 |
| 👤 Tenant User | General shop staff | Job cards, parts, device models (as in v2.0) | v2.0 |

---

## 3. Super Admin

*Unchanged from v2.0 — platform-level control*

The Super Admin role remains identical to v2.0. Key responsibilities:

| Capability | Description |
|---|---|
| Dashboard | View all registered tenants — active users, account status |
| Tenant Management | Approve/reject registrations, suspend/reactivate accounts, reset passwords |
| User Quotas | Set max Tenant User count per tenant |
| Feature Toggles | Enable/disable individual features per tenant (job cards, parts, receipts, etc.) |
| v3.0 Additions | Feature toggles now include: Sales Module, Inventory Module, Commission Toggle, Sales Receipt, IMEI Lookup |

### 3.1 Feature Toggle Controls — Updated for v3.0

| Feature / Toggle | Controlled By | Default | Version |
|---|---|---|---|
| Add New Service (Job Card) | Super Admin | ✅ Enabled | v2.0 |
| Parts Management | Super Admin | ✅ Enabled | v2.0 |
| Device Model Management | Super Admin | ✅ Enabled | v2.0 |
| Printable Job Card | Super Admin | ✅ Enabled | v2.0 |
| Printable Service Receipt | Super Admin | ⛔ Disabled | v2.0 |
| Sales Module (Phone Sales) | Super Admin | ✅ Enabled | 🆕 v3.0 |
| Inventory Module | Super Admin | ✅ Enabled | 🆕 v3.0 |
| Branch Pricing / Profit Margin | Super Admin | ✅ Enabled | 🆕 v3.0 |
| Sales Staff Commission | Super Admin | ✅ Enabled | 🆕 v3.0 |
| Sales Receipt (Phone Sale) | Super Admin | ✅ Enabled | 🆕 v3.0 |
| IMEI Device Lookup | Super Admin | ✅ Enabled | 🆕 v3.0 |
| Branch Sales Dashboard | Super Admin | ✅ Enabled | 🆕 v3.0 |

> **Note:** Disabling a feature hides the button/section from that tenant's users without deleting any data.

---

## 4. Branch Manager *(🆕 New in v3.0)*

The Branch Manager oversees operations and sales for their specific branch. The **Main Branch Manager** can additionally view consolidated data across all sub-branches. The key new capability is setting **profit margins per device model**, which drives the automatic selling price calculation.

### 4.1 Main Branch Manager — Capabilities

| Capability | Description |
|---|---|
| 🏪 Own Branch Full Access | All Tenant User capabilities for their branch — job cards, parts, models |
| 📊 Cross-Branch Sales View | View total sales, revenue, and profit from all 5 branches in one consolidated view |
| 📈 Per-Branch Breakdown | Drill down into individual sub-branch sales, stock, and performance |
| 💰 Set Branch Profit Margin | Set a profit amount (₹) per device model for own branch and globally if needed |
| 📦 Inventory Oversight | View stock levels across all branches — new phones & second-hand phones |
| 👥 Staff Management | View sales staff activity and individual commission amounts per sale |
| 🧾 Sales Reports | View daily, weekly, monthly sales and profit reports for all branches |

### 4.2 Sub-Branch Manager — Capabilities

| Capability | Description |
|---|---|
| 🏢 Own Branch Only | All operations restricted to their own sub-branch only |
| 💰 Set Branch Profit Margin | Set profit margin (₹) per device model for their own branch |
| 📊 Own Branch Sales View | View sales, revenue, and profit for their branch only — no cross-branch access |
| 📦 Own Inventory | View and manage stock at their own branch location |
| 👥 Staff Commission View | View commissions added by sales staff in their branch |

> **Access Rule:** Branch Managers CANNOT see data from other branches (except the Main Branch Manager). Profit margin settings made by a Branch Manager only apply to their own branch unless they hold Main Branch role.

---

## 5. Sales Staff *(🆕 New Role in v3.0)*

The Sales Staff user handles all phone sales operations. They can add new phones and second-hand phones to inventory, record sales, and optionally add a personal commission to each sale transaction. They have **no access** to the service/repair job card module.

### 5.1 Sales Staff — Capabilities

| Capability | Description | Access |
|---|---|---|
| 📦 Add to Inventory | Add new phones or second-hand phones with quantity, IMEI, purchase price | ✅ Full |
| 🛒 Record Phone Sale | Select phone from inventory, confirm quantity sold, finalize sale price | ✅ Full |
| 💸 Add Commission | Optionally add a personal commission amount (₹) to any sale | ✅ Full |
| 📋 View Own Sales | View their own sales history and commission totals | ✅ Own only |
| 📱 IMEI Lookup | Search any device by IMEI — see inventory status, repair history if any | ✅ Full |
| 🧾 Generate Receipt | Print or digital receipt after each completed phone sale | ✅ Full |
| 🔧 Job Card Module | Cannot create or view repair job cards | ⛔ No Access |
| 💰 Pricing / Margin | Cannot change branch profit margins — view only | 👁️ View Only |

---

## 6. Inventory Management Module *(🆕 New in v3.0)*

A dedicated inventory module tracks all phones held in stock at each branch. Inventory covers two categories: **New Phones** and **Second-Hand Phones**. Stock levels update automatically whenever a phone is sold.

### 6.1 Phone Entry Fields

| Field | Details | Type |
|---|---|---|
| Phone Category | New Phone / Second-Hand Phone | Dropdown |
| Brand | Apple, Samsung, Xiaomi, Vivo, Oppo, Other — linked to device model list | Dropdown |
| Model | Specific model from device model master list | Dropdown |
| IMEI Number(s) | Unique IMEI per unit — each handset tracked individually by IMEI | Text / Scan |
| Color / Variant | Color name and storage variant (e.g. 128GB Midnight Black) | Free Text |
| Quantity Added | Number of units being added to stock in this entry | Number |
| Purchase Price (₹) | Cost price per unit — set by Sales Staff or Branch Manager | Number |
| Condition Grade | New / Excellent / Good / Fair — for second-hand phones | Dropdown |
| Date Received | Date units were added to inventory | Auto / Editable |
| Supplier / Source | Optional: supplier name or acquisition source | Free Text |
| Branch | Auto-assigned to the logged-in user's branch | Auto |
| Notes | Optional internal notes about the lot or condition | Free Text |

### 6.2 Inventory Tracking Logic

> **Example:** Sales Staff adds 3 units of Samsung F22. Inventory shows: **3 Available**. Staff sells 1 unit → Inventory auto-updates to **2 Available**. The sold unit's IMEI is marked as "Sold" in the system. This happens instantly at the time of sale confirmation.

| Action | Inventory Effect |
|---|---|
| Add phones to stock | Available count increases by quantity added |
| Record a sale | Available count decreases by quantity sold; IMEI marked as Sold |
| Return / Reversal | Available count restored; IMEI reverts to Available status |
| View inventory list | Shows: Model, Brand, Category, Available, Sold, Total, Purchase Price |
| Filter inventory | By branch, brand, model, category (new/second-hand), status |
| IMEI search in inventory | Find specific unit — see status (Available/Sold), sale date if sold |

---

## 7. Pricing & Commission System *(🆕 New in v3.0)*

The pricing system works as a **three-layer chain**: the purchase price (cost) is the base, the Branch Manager adds a fixed profit margin, and the Sales Staff can optionally add their personal commission. The final sale price displayed to the customer is the sum of all three.

### 7.1 Pricing Formula

```
Purchase Price (₹)   +   Branch Profit Margin (₹)   +   Staff Commission (₹)   =   Final Sale Price (₹)
  (set by Staff /          (set by Branch Manager           (optional, set by
   Branch Manager)           per device model)               Sales Staff)
```

> **Example:** Samsung F22 purchase price = ₹20,000. Branch Manager sets profit margin = ₹4,000. Base selling price = ₹24,000. Sales Staff adds commission = ₹500. **Final sale price to customer = ₹24,500.** Branch profit = ₹4,000. Staff commission = ₹500 (tracked separately).

### 7.2 Who Can Set What

| Price Component | Can Be Set By | Scope | Notes |
|---|---|---|---|
| Purchase Price (₹) | Sales Staff OR Branch Manager | Per unit / per model | Reflects actual cost paid |
| Branch Profit Margin (₹) | Branch Manager only | Per device model, per branch | Applies to all sales of that model at that branch |
| Staff Commission (₹) | Sales Staff (optional) | Per individual sale transaction | Added at time of sale — can be ₹0 |
| Final Sale Price | Auto-calculated — not manually editable | Per transaction | Purchase + Margin + Commission |

### 7.3 Branch Margin Settings

Branch Managers access a dedicated **Pricing Settings** screen where they can set a profit margin amount (₹) per device model. These settings are stored per branch so different branches can have different margins for the same model.

| Field | Details |
|---|---|
| Device Model | Select from device model master list |
| Profit Margin (₹) | Fixed amount in rupees to add on top of purchase price |
| Branch | Auto-assigned to the Branch Manager's branch |
| Effective From | Date from which this margin is active |
| Margin History | Previous margin values stored — changes do not affect past sales |

> **Important:** Changing the branch profit margin does NOT affect previously recorded sales. The margin at the time of each sale is saved with that transaction record permanently.

---

## 8. Phone Sales Module *(🆕 New in v3.0)*

### 8.1 Recording a Sale — Step by Step

| Step | Action | Details |
|---|---|---|
| 1 | Select Phone from Inventory | Browse or search available stock — filter by brand, model, category, branch |
| 2 | Select Unit / IMEI | Pick specific handset by IMEI number from available stock |
| 3 | Confirm Quantity Sold | Enter quantity (default 1 per IMEI; bulk sale possible for new phones with same model) |
| 4 | Review Pricing | System shows: Purchase Price + Branch Margin = Base Price (auto-calculated) |
| 5 | Add Staff Commission (Optional) | Sales Staff enters commission amount in ₹ — can be left at ₹0 |
| 6 | Final Price Confirmation | System displays final sale price = Purchase + Margin + Commission |
| 7 | Record Customer Details | Customer name, phone number (optional for quick sales) |
| 8 | Confirm Sale | Sale is recorded, inventory auto-deducted, IMEI marked as Sold |
| 9 | Generate Receipt | Optional — print or digital receipt generated for the customer |

### 8.2 Sale Transaction Record Fields

| Field | Details | Source |
|---|---|---|
| Sale ID | Auto-generated unique ID (e.g. `SL-BR1-20260603-001`) | Auto |
| Phone Model & Brand | From inventory record | Auto |
| IMEI Number | Specific unit IMEI — marks unit as sold | Auto |
| Category | New / Second-Hand | From inventory |
| Purchase Price (₹) | Cost price at time of entry — frozen at sale | From inventory |
| Branch Profit Margin (₹) | Margin set by Branch Manager — frozen at sale | From pricing settings |
| Base Selling Price (₹) | Purchase + Margin — auto-calculated | Auto |
| Staff Commission (₹) | Amount added by Sales Staff for this transaction | Staff input |
| Final Sale Price (₹) | Base Selling Price + Staff Commission | Auto-calculated |
| Customer Name | Buyer name | Optional input |
| Customer Phone | Contact number | Optional input |
| Sales Staff | Auto-linked to logged-in user | Auto |
| Branch | Branch where sale occurred | Auto |
| Sale Date & Time | Timestamp of sale completion | Auto |
| Receipt Printed | Yes / No — whether receipt was generated | Auto |

---

## 9. Sales Receipt Generation *(🆕 New in v3.0)*

After completing a phone sale, the Sales Staff can generate a printable or digital receipt. The receipt is separate from the service job card receipt and covers phone purchase transactions only.

| Receipt Section | Contents |
|---|---|
| Shop Header | Shop name, branch name, address, phone number, logo (if configured) |
| Sale Reference | Sale ID, date & time of sale, Sales Staff name |
| Customer Details | Customer name and phone number (if provided) |
| Device Details | Brand, model, color/variant, category (New/Second-Hand), condition grade, IMEI number |
| Pricing Breakdown | Purchase price is NOT shown to customer. Receipt shows: Selling Price (base) + Staff Commission (if any) = Total Amount |
| Payment | Total amount paid, payment method (Cash / UPI / Card), balance if any |
| Warranty Note | Optional warranty period or "sold as-is" note for second-hand phones |
| Footer | Thank you message, return/exchange policy note, QR code for service booking (optional) |

> **Receipt Rule:** The purchase price and branch profit margin amounts are **NEVER shown** on the customer receipt. Only the final selling price (and commission if shown) appear on the customer copy. Full pricing breakdown is visible only to Branch Manager and Super Admin in the backend.

---

## 10. Sales & Profit Dashboard *(🆕 New in v3.0)*

A dedicated sales and profit dashboard provides visibility appropriate to each role. Main Branch sees everything. Sub-Branches see their own data only. This module covers phone sales — not repair/service revenue.

### 10.1 Main Branch Dashboard — What They See

| Metric / Widget | Details |
|---|---|
| Total Sales (All Branches) | Combined revenue from all 5 branches — today, week, month, custom range |
| Total Profit (All Branches) | Sum of all branch profit margins earned across all sales |
| Per-Branch Sales Card | Individual card per branch showing: units sold, revenue, profit for the selected period |
| Top Selling Models | Ranked list of best-performing device models across all branches |
| Staff Commission Total | Total commissions paid out to Sales Staff — per branch and overall |
| Inventory Overview | Available stock count per branch — new and second-hand phones |
| Sales Trend Chart | Visual chart showing sales over time across branches |
| Recent Sales Feed | Live list of latest transactions across all branches |

### 10.2 Sub-Branch Dashboard — What They See

| Metric / Widget | Details |
|---|---|
| Own Branch Sales | Revenue from own branch only — today, week, month, custom range |
| Own Branch Profit | Profit margin earned at own branch only |
| Staff Commission | Commission amounts added by sales staff at this branch |
| Inventory at Own Branch | Current available stock at this branch |
| Recent Sales | Latest transactions at this branch |
| Top Selling Models | Best-performing models at this branch |

### 10.3 Profit Calculation Explained

> **Profit Definition:** Branch Profit = Sum of (Branch Margin per sale). Staff Commission is tracked separately and is NOT included in the Branch Profit figure. The dashboard shows both as distinct line items so managers can see true branch earnings vs staff incentive payouts.

---

## 11. Universal IMEI Device Lookup *(🆕 New in v3.0)*

Every user in the system — regardless of role — can look up a device by its IMEI number. The lookup returns all available information about that device from across the system: inventory records, repair history, and sale status.

### 11.1 Who Can Use IMEI Lookup

| User Role | IMEI Lookup Access | What They See |
|---|---|---|
| 👑 Super Admin | ✅ Full Access | Complete device history — inventory, sales, repair records, branch info |
| 🏪 Branch Manager (Main) | ✅ Full Access | All device info across all branches |
| 🏢 Sub-Branch Manager | ✅ Own Branch | Device info relevant to their branch; flags if device sold/repaired at other branches |
| 🛒 Sales Staff | ✅ Access | Inventory status, whether phone is available/sold, past sale if any, repair history at own branch |
| 🛠️ Technician | ✅ Access | Device details — model info, past repairs on that IMEI, current inventory status |
| 👤 Tenant User | ✅ Access | Device details — model info, repair records, inventory status |

### 11.2 IMEI Lookup Result — Information Returned

| Section | Information Shown |
|---|---|
| Device Identity | Brand, model, color, variant, category (New/Second-Hand), condition grade |
| IMEI Details | IMEI number, registration date in system, branch it belongs to |
| Inventory Status | Available / Sold / In Repair / Transferred |
| Purchase Info | Purchase price and date added to inventory — visible to Manager/Admin only |
| Sale Info (if sold) | Sale date, branch sold at, sale price, Sales Staff name |
| Repair / Service History | List of all job cards associated with this IMEI — dates, problems, technician, status |
| Current Location | Which branch currently holds or last held this device |

> **UX Note:** The IMEI lookup is accessible from a persistent search bar available in the navigation header for all user roles. It does not require navigating to any specific module. Results are filtered by what each role is permitted to see.

---

## 12. Core Service Modules *(Retained from v2.0 — Unchanged)*

All service and repair modules from v2.0 remain fully intact in v3.0.

| Module | Key Features | Status |
|---|---|---|
| Job Card / Service Entry | Auto serial number, customer details, brand/model, IMEI, problem, technician, status | ✅ v2.0 |
| Service Status Tracking | Received → Checking → Waiting for Parts → Repaired → Delivered → Cancelled | ✅ v2.0 |
| Service Update | Add repaired items, replaced parts, technician notes, customer approval, delivery date | ✅ v2.0 |
| Parts Management | Add parts with name, cost/selling price; assign to device models; price history protected | ✅ v2.0 |
| Device Model Management | Manage brands (Apple, Samsung, Xiaomi, Vivo, Oppo, Other) and models per brand | ✅ v2.0 |
| Search & Filters | By customer name, phone, IMEI, job card number, date range, service status | ✅ v2.0 |
| Printable Job Card | Formatted print view for job card — enabled by default | ✅ v2.0 |
| Printable Service Receipt | Service completion receipt — controlled by Super Admin toggle | ✅ v2.0 |

### 12.1 Job Card / Service Entry Fields

| Field | Details |
|---|---|
| Serial Number | Auto-generated (e.g. `BR1-20260603-001`) |
| Customer Name | Free text |
| Customer Phone | Free text |
| Mobile Brand & Model | Dropdown |
| IMEI Number | Free text |
| Problem Description | Free text |
| Received Date | Auto-filled, editable |
| Assigned Technician | Free text |
| Branch Name | Auto-assigned from user's branch |
| Service Status | Received · Checking · Waiting for Parts · Repaired · Delivered · Cancelled |

### 12.2 Service Update Fields

- Add repaired / fixed items
- Add replaced parts (from parts list)
- Add technician notes
- Add customer approval notes
- Update delivery date
- View service history / update log

> **Note:** Parts cost at time of entry is saved with the service record. Future cost changes do not affect historical records.

### 12.3 Search & Filter Options

- Search by Customer Name
- Search by Phone Number
- Search by IMEI Number
- Search by Job Card Number
- Filter by Date Range
- Filter by Service Status

---

## 13. MVP Screens — v3.0

| # | Screen Name | Role(s) | Status |
|---|---|---|---|
| 1 | Login | All | v2.0 |
| 2 | Super Admin Dashboard | Super Admin | v2.0 |
| 3 | Tenant Management | Super Admin | v2.0 |
| 4 | Feature Toggle Settings | Super Admin | v2.0 + updated |
| 5 | Tenant User Dashboard | Tenant User | v2.0 |
| 6 | Add New Service / Job Card | Tenant User | v2.0 |
| 7 | Service List (search/filter) | Tenant User | v2.0 |
| 8 | Service Detail / Update | Tenant User, Technician | v2.0 |
| 9 | Parts Management | Tenant User | v2.0 |
| 10 | Device Models Management | Tenant User, Branch Manager | v2.0 |
| 11 | Sub-Branch Dashboard | Sub-Branch Manager | v2.0 |
| 12 | Technician Dashboard | Technician | v2.0 |
| 13 | Sales Staff Dashboard | Sales Staff | 🆕 v3.0 |
| 14 | Add Phone to Inventory | Sales Staff, Branch Manager | 🆕 v3.0 |
| 15 | Inventory List | Sales Staff, Branch Manager, Main Branch | 🆕 v3.0 |
| 16 | Record Phone Sale | Sales Staff | 🆕 v3.0 |
| 17 | Branch Pricing / Margin Settings | Branch Manager | 🆕 v3.0 |
| 18 | Sales Dashboard — Main Branch | Main Branch Manager | 🆕 v3.0 |
| 19 | Sales Dashboard — Sub-Branch | Sub-Branch Manager | 🆕 v3.0 |
| 20 | Sales Receipt (Phone Sale) | Sales Staff | 🆕 v3.0 |
| 21 | IMEI Device Lookup (Global Search) | All roles | 🆕 v3.0 |
| 22 | Staff Commission Tracker | Branch Manager | 🆕 v3.0 |

---

## 14. Feature Change Log — v1.0 → v2.0 → v3.0

| Feature | v1.0 | v2.0 | v3.0 |
|---|---|---|---|
| User roles | Admin + Branch User | Super Admin + Tenant | + Branch Manager, Sales Staff |
| Job card management | ✅ | ✅ | ✅ Unchanged |
| Service status tracking | ✅ | ✅ | ✅ Unchanged |
| Parts management | ✅ | ✅ | ✅ Unchanged |
| Device model management | ✅ | ✅ | ✅ Unchanged |
| Search & filters | ✅ | ✅ | ✅ Unchanged |
| Super Admin controls | ❌ | ✅ Added | ✅ Extended |
| Feature toggles | ❌ | ✅ Added | ✅ Extended |
| Printable Job Card | ✅ | ✅ | ✅ Unchanged |
| Printable Service Receipt | ✅ | ✅ toggle | ✅ Unchanged |
| Phone inventory (new & second-hand) | ❌ | ❌ | 🆕 Added |
| New phone sales | ❌ | ❌ | 🆕 Added |
| Second-hand phone sales | ❌ | ❌ | 🆕 Added |
| Branch profit margin setting | ❌ | ❌ | 🆕 Added |
| Sales Staff commission | ❌ | ❌ | 🆕 Added |
| Phone sale receipt | ❌ | ❌ | 🆕 Added |
| Branch sales dashboard | ❌ | ❌ | 🆕 Added |
| IMEI device lookup (all roles) | ❌ | ❌ | 🆕 Added |
| Staff commission tracker | ❌ | ❌ | 🆕 Added |
| Profit auto-calculation | ✅ | ❌ Removed | Partial — margin-based only |
| Sales / revenue tracking | ✅ | ❌ Removed | ✅ Re-added (sales module) |
| Branch-wise profit reports | ✅ | ❌ Removed | ✅ Re-added (dashboard) |
| Excel export | ✅ | ❌ Removed | ❌ Future phase |
| PDF export | ✅ | ❌ Removed | ❌ Future phase |
| Data backup module | ✅ | ❌ Removed | ❌ Future phase |
| Audit log | ✅ | ❌ Removed | ❌ Future phase |
| Daily closing report | ✅ | ❌ Removed | ❌ Future phase |
| Technician performance report | ✅ | ❌ Removed | ❌ Future phase |

---

## 15. Recommended Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React.js or Next.js | Role-based routing; separate dashboards per role |
| Backend | Node.js (Express) or Django | REST API; role-based middleware for all endpoints |
| Database | PostgreSQL or Supabase | Multi-tenant schema; branch-scoped data partitioning |
| Authentication | JWT-based secure login | Role-aware tokens; role claim in JWT payload |
| Inventory State | DB-level transactions | Atomic sale + deduction to prevent race conditions on stock |
| IMEI Search | Indexed DB column on IMEI field | Composite index across inventory + repair + sales tables |
| Receipts | Browser print / PDF generation | React-to-print or Puppeteer for server-side PDF |
| Hosting | Cloud-based deployment | Accessible from all branches; role-aware session management |

---

> **Document Info:** This document supersedes v2.0 (June 2026). Financial modules (auto profit calc, Excel/PDF export, audit log, daily closing) can be re-added in a future v4.0 phase once the core service tracking and phone sales workflows are stable. All pricing, commission, and inventory figures in examples are illustrative only.
