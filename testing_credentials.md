# Mobile Service Shop — Testing Document

This document contains the credentials and quick testing steps for verifying the core features of the **Mobile Service Shop — Management Web App (MVP v2.0)**.

---

## 🔐 Credentials List

Use these credentials to log in at [http://localhost:3000/login](http://localhost:3000/login).

### 1. Super Admin Account
*   **Role**: Platform Owner (controls all tenants, quotas, and feature toggles)
*   **Username**: `stibe@superadmin`
*   **Password**: `admin123`
*   **Permissions**: Full platform-level access, cannot create jobs directly (must be done via a tenant account).

### 2. Tenant User Account (Main Branch)
*   **Role**: Shop Owner / Staff member for the "Main Branch" (BR1)
*   **Username**: `branch1`
*   **Password**: `branch123`
*   **Permissions**: Manage repair jobs, update job status, add parts, edit device models for **Main Branch (BR1)**.

---

## 🧪 Recommended Test Scenarios

### Scenario A: Super Admin Controls (Tenant & Feature Toggle Management)
1. Log in as `stibe@superadmin` with password `admin123`.
2. Navigate to the **Super Admin Dashboard**.
3. Locate **Main Branch (BR1)** in the tenant list.
4. Try toggling one of the features, for example:
    *   Disable **Printable Service Receipt** or **Parts Management**.
5. Log out, then log in as `branch1` and verify that the disabled features are hidden from the UI.

### Scenario B: Tenant Repair Workflow (Job Lifecycle)
1. Log in as `branch1` with password `branch123`.
2. Navigate to **Add New Service / Job Card**.
3. Create a job card with customer details, phone number, model, and problem description.
    *   *Note: A unique Job Card Number (e.g., `BR1-20260604-001`) will be auto-generated.*
4. Go to **Service List** and locate your newly created job card.
5. Click **Update Details** to:
    *   Change the status (e.g., `Checking` ➔ `Repaired`).
    *   Add technician notes.
    *   Add parts used from the inventory catalog.
6. Verify that the job status log updates automatically in the service history.
(the password for all test accounts is password123):

Sales Staff: sales_staff@test.com
Sub-Branch Manager: sub_manager@test.com
Main Manager: main_manager@test.com