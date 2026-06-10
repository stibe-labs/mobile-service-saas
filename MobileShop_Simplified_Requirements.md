# Mobile Service Shop — Management Web App
### Simplified Requirements Document · v2.0 · June 2026
> Scope reduced from full-feature system to a lean MVP

---

## 1. Project Overview

A lightweight web-based service management system for a mobile phone repair business with 5 branches. This document defines a **simplified MVP scope** — the heavy financial-automation features from v1.0 have been removed. The focus is on digital job-card management, basic service tracking, and a new Super Admin control layer.

| Item | Detail |
|---|---|
| Business | Mobile phone service / repair shop |
| Branches | 5 branch locations |
| User Roles | Super Admin · Tenant User |
| Scope | Internal use by shop staff only (not customer-facing) |
| Replaces | Manual handwritten job cards and paper records |
| What is removed | Auto profit calc, billing split, Excel/PDF export, audit log |

---

## 2. User Roles

Two roles — each isolated from the other.

| Role | Who | Access Level |
|---|---|---|
| **Super Admin** | Platform owner (you & your team) | Full platform control — manage tenants, approve accounts, enable/disable features globally |
| **Tenant User** | Shop owner / staff | Access their own shop only — create jobs, update service status, manage parts & models |

---

## 3. Super Admin *(New Role)*

The Super Admin is the platform-level owner. This role sits above all tenant accounts and controls what each tenant is allowed to do inside the app.

### 3.1 Dashboard Overview
- See a list of all registered tenants (shop accounts)
- See total number of active users per tenant
- See whether each tenant's account is active or suspended
- Casual summary view — no deep financial data

### 3.2 Tenant & User Management
- Approve or reject new tenant (shop) registrations
- Set the maximum number of Tenant User accounts allowed per tenant
- Suspend or reactivate a tenant account
- Reset passwords for tenant users

### 3.3 Feature Toggle Controls

Super Admin can enable or disable the following features **per tenant individually**:

| Feature / Button | Controlled By | Default Status |
|---|---|---|
| Add New Service (Job Card) button | Super Admin | ✅ Enabled |
| Add New Part option | Super Admin | ✅ Enabled |
| Add New Device Model option | Super Admin | ✅ Enabled |
| Service Status Update | Super Admin | ✅ Enabled |
| Parts Management module | Super Admin | ✅ Enabled |
| Printable Job Card | Super Admin | ✅ Enabled |
| Printable Service Receipt | Super Admin | ⛔ Disabled |
| Branch Dashboard access | Super Admin | ✅ Enabled |

> **Note:** Disabling a feature hides the button/section from that tenant's users without deleting any data.

---

## 4. Tenant User Role

Each shop has one Tenant User account. This is the shop owner or staff member who manages day-to-day service operations. Each tenant user sees **only their own shop data**.

### 4.1 Dashboard
- See today's open and completed jobs
- See pending jobs list
- Quick access to add a new service

### 4.2 Capabilities
- Create new service / job cards
- Update service status and technician notes
- Add parts used in a service
- Add and manage device brands and models
- Add and manage parts (name, cost, selling price)
- View and search own job records with filters
- Print job card and service receipt *(if enabled by Super Admin)*

---

## 5. Core Modules

### 5.1 Job Card / Service Entry

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

### 5.2 Service Update
- Add repaired / fixed items
- Add replaced parts (from parts list)
- Add technician notes
- Add customer approval notes
- Update delivery date
- View service history / update log

> **Note:** Parts cost at time of entry is saved with the service record. Future cost changes do not affect historical records.

### 5.3 Parts Management
- Add new parts with name, cost price, selling price
- Assign compatible device models
- Update prices *(historical records unaffected)*

### 5.4 Device Model Management
- Manage brands: Apple, Samsung, Xiaomi, Vivo, Oppo, Other
- Add / edit models per brand
- Models appear in dropdowns when creating a job card

---

## 6. Search & Filters

- Search by Customer Name
- Search by Phone Number
- Search by IMEI Number
- Search by Job Card Number
- Filter by Date Range
- Filter by Service Status

---

## 7. Feature Changes — Old vs New

| Feature | Old Version | New Version |
|---|---|---|
| User roles | Admin + Branch User | **Super Admin + Tenant User** |
| Profit auto-calculation | Full formula included | ❌ Removed |
| Sales / revenue tracking | Auto-generated totals | ❌ Removed |
| Cash / Bank / Credit payment split | Full payment breakdown | ❌ Removed |
| Branch-wise profit reports | Admin dashboard widget | ❌ Removed |
| Technician performance report | Included | ❌ Removed |
| Parts usage report | Included | ❌ Removed |
| Excel export | Included | ❌ Removed |
| PDF export | Included | ❌ Removed |
| Data backup module | Included | ❌ Removed |
| Audit log | Full update history | ❌ Removed |
| Daily closing report | Auto-generated | ❌ Removed |
| Job Card (printable) | Included | ✅ Kept |
| Service Receipt (printable) | Included | ✅ Kept — toggle |
| Service status tracking | Included | ✅ Kept |
| Parts management | Included | ✅ Kept |
| Device model management | Included | ✅ Kept |
| Search & filters | Included | ✅ Kept |
| Super Admin role | Not present | 🆕 Added |
| Feature toggle controls | Not present | 🆕 Added |
| Tenant / user quota management | Not present | 🆕 Added |

---

## 8. MVP Screens

| # | Screen | Role |
|---|---|---|
| 1 | Login | All |
| 2 | Super Admin Dashboard | Super Admin |
| 3 | Tenant Management | Super Admin |
| 4 | Feature Toggle Settings | Super Admin |
| 5 | Tenant User Dashboard | Tenant User |
| 6 | Add New Service / Job Card | Tenant User |
| 7 | Service List (with search/filter) | Tenant User |
| 8 | Service Details / Update | Tenant User |
| 9 | Parts Management | Tenant User |
| 10 | Device Models Management | Tenant User |

---

## 9. Recommended Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js or Next.js |
| Backend | Node.js (Express) or Django |
| Database | PostgreSQL or Supabase |
| Authentication | JWT-based secure login (role-aware) |
| Hosting | Cloud-based (accessible from all branches) |

---

> This document supersedes v1.0. Financial modules can be re-added in a future phase once the core service tracking workflow is stable.
