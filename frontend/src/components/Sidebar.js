'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Building2, Wrench, BarChart2, Package, ShoppingCart, 
  Search, Network, CreditCard, Globe, PlusCircle, List, Users, Cpu, 
  Smartphone, DollarSign, LogOut, ChevronLeft, ChevronRight,
  Shield, Crown, Store, Briefcase
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Sidebar() {
  const { user, logout, isSuperAdmin, isTenantAdmin, isTechnician, isSalesStaff, isSubBranchManager, isMainBranchManager, isFeatureEnabled } = useAuth();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isActive = (path) => pathname === path || pathname.startsWith(path + '/');

  if (!user) return null;

  return (
    <aside className={`app-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Brand */}
      <div className="sidebar-brand" style={{ position: 'relative', justifyContent: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? '24px 0' : '24px' }}>
        {!isCollapsed ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.4rem', fontWeight: '900', color: 'white', letterSpacing: '-0.5px' }}>FixFlow</span>
            <span style={{ fontSize: '0.65rem', backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>SaaS</span>
          </div>
        ) : (
          <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'white' }}>S</div>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="sidebar-toggle-btn"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {isSuperAdmin ? (
          /* ─── Super Admin Navigation ─── */
          <>
            <div className="sidebar-section">
              {!isCollapsed && <div className="sidebar-section-label">Platform</div>}
              <Link href="/admin" className={`sidebar-link ${isActive('/admin') && !isActive('/admin/tenants') ? 'active' : ''}`} style={{ justifyContent: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? '12px 0' : '12px 16px' }}>
                <span className="sidebar-link-icon" style={{ marginRight: isCollapsed ? '0' : '12px', display: 'flex', alignItems: 'center' }}><LayoutDashboard size={18} /></span>
                {!isCollapsed && <span className="sidebar-link-text">Dashboard</span>}
              </Link>
              <Link href="/admin/tenants" className={`sidebar-link ${isActive('/admin/tenants') ? 'active' : ''}`} style={{ justifyContent: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? '12px 0' : '12px 16px' }}>
                <span className="sidebar-link-icon" style={{ marginRight: isCollapsed ? '0' : '12px', display: 'flex', alignItems: 'center' }}><Building2 size={18} /></span>
                {!isCollapsed && <span className="sidebar-link-text">Tenants</span>}
              </Link>
            </div>
          </>
        ) : isTechnician ? (
          /* ─── Technician Navigation ─── */
          <>
            <div className="sidebar-section">
              {!isCollapsed && <div className="sidebar-section-label">My Works</div>}
              <Link href="/technician-dashboard" className={`sidebar-link ${isActive('/technician-dashboard') ? 'active' : ''}`} style={{ justifyContent: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? '12px 0' : '12px 16px' }}>
                <span className="sidebar-link-icon" style={{ marginRight: isCollapsed ? '0' : '12px', display: 'flex', alignItems: 'center' }}><Wrench size={18} /></span>
                {!isCollapsed && <span className="sidebar-link-text">Dashboard</span>}
              </Link>
            </div>
          </>
        ) : isSalesStaff ? (
          /* ─── Sales Staff Navigation ─── */
          <>
            <div className="sidebar-section">
              {!isCollapsed && <div className="sidebar-section-label">Sales Operations</div>}
              {isFeatureEnabled('sales_module') && (
                <Link href="/sales-dashboard" className={`sidebar-link ${pathname === '/sales-dashboard' ? 'active' : ''}`} style={{ justifyContent: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? '12px 0' : '12px 16px' }}>
                  <span className="sidebar-link-icon" style={{ marginRight: isCollapsed ? '0' : '12px', display: 'flex', alignItems: 'center' }}><BarChart2 size={18} /></span>
                  {!isCollapsed && <span className="sidebar-link-text">Dashboard</span>}
                </Link>
              )}
              {isFeatureEnabled('inventory_module') && (
                <Link href="/sales-dashboard/inventory" className={`sidebar-link ${isActive('/sales-dashboard/inventory') ? 'active' : ''}`} style={{ justifyContent: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? '12px 0' : '12px 16px' }}>
                  <span className="sidebar-link-icon" style={{ marginRight: isCollapsed ? '0' : '12px', display: 'flex', alignItems: 'center' }}><Package size={18} /></span>
                  {!isCollapsed && <span className="sidebar-link-text">Inventory</span>}
                </Link>
              )}
              {isFeatureEnabled('sales_module') && (
                <Link href="/sales-dashboard/sale" className={`sidebar-link ${isActive('/sales-dashboard/sale') ? 'active' : ''}`} style={{ justifyContent: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? '12px 0' : '12px 16px' }}>
                  <span className="sidebar-link-icon" style={{ marginRight: isCollapsed ? '0' : '12px', display: 'flex', alignItems: 'center' }}><ShoppingCart size={18} /></span>
                  {!isCollapsed && <span className="sidebar-link-text">Record Sale</span>}
                </Link>
              )}
              {isFeatureEnabled('imei_lookup') && (
                <Link href="/sales-dashboard/imei" className={`sidebar-link ${isActive('/sales-dashboard/imei') ? 'active' : ''}`} style={{ justifyContent: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? '12px 0' : '12px 16px' }}>
                  <span className="sidebar-link-icon" style={{ marginRight: isCollapsed ? '0' : '12px', display: 'flex', alignItems: 'center' }}><Search size={18} /></span>
                  {!isCollapsed && <span className="sidebar-link-text">IMEI Lookup</span>}
                </Link>
              )}
            </div>
          </>
        ) : (
          /* ─── Tenant / Branch User Navigation ─── */
          <>
            {isTenantAdmin && (
              <div className="sidebar-section">
                {!isCollapsed && <div className="sidebar-section-label">Company</div>}
                <Link href="/tenant/branches" className={`sidebar-link ${isActive('/tenant/branches') ? 'active' : ''}`} style={{ justifyContent: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? '12px 0' : '12px 16px' }}>
                  <span className="sidebar-link-icon" style={{ marginRight: isCollapsed ? '0' : '12px', display: 'flex', alignItems: 'center' }}><Network size={18} /></span>
                  {!isCollapsed && <span className="sidebar-link-text">Branches</span>}
                </Link>
                <Link href="/admin/billing" className={`sidebar-link ${isActive('/admin/billing') ? 'active' : ''}`} style={{ justifyContent: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? '12px 0' : '12px 16px' }}>
                  <span className="sidebar-link-icon" style={{ marginRight: isCollapsed ? '0' : '12px', display: 'flex', alignItems: 'center' }}><CreditCard size={18} /></span>
                  {!isCollapsed && <span className="sidebar-link-text">Billing & Plan</span>}
                </Link>
              </div>
            )}
            <div className="sidebar-section">
              {!isCollapsed && <div className="sidebar-section-label">Main</div>}
              {(isTenantAdmin || isMainBranchManager) && (
                <Link href="/main-dashboard" className={`sidebar-link ${isActive('/main-dashboard') ? 'active' : ''}`} style={{ justifyContent: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? '12px 0' : '12px 16px' }}>
                  <span className="sidebar-link-icon" style={{ marginRight: isCollapsed ? '0' : '12px', display: 'flex', alignItems: 'center' }}><Globe size={18} /></span>
                  {!isCollapsed && <span className="sidebar-link-text">Cross-Branch Analytics</span>}
                </Link>
              )}
              {isFeatureEnabled('branch_dashboard') && (
                <Link href="/dashboard" className={`sidebar-link ${isActive('/dashboard') ? 'active' : ''}`} style={{ justifyContent: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? '12px 0' : '12px 16px' }}>
                  <span className="sidebar-link-icon" style={{ marginRight: isCollapsed ? '0' : '12px', display: 'flex', alignItems: 'center' }}><LayoutDashboard size={18} /></span>
                  {!isCollapsed && <span className="sidebar-link-text">Branch Dashboard</span>}
                </Link>
              )}
              {isFeatureEnabled('add_service') && (
                <Link href="/services/new" className={`sidebar-link ${isActive('/services/new') ? 'active' : ''}`} style={{ justifyContent: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? '12px 0' : '12px 16px' }}>
                  <span className="sidebar-link-icon" style={{ marginRight: isCollapsed ? '0' : '12px', display: 'flex', alignItems: 'center' }}><PlusCircle size={18} /></span>
                  {!isCollapsed && <span className="sidebar-link-text">Add Service</span>}
                </Link>
              )}
              <Link href="/services" className={`sidebar-link ${isActive('/services') && !isActive('/services/new') ? 'active' : ''}`} style={{ justifyContent: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? '12px 0' : '12px 16px' }}>
                <span className="sidebar-link-icon" style={{ marginRight: isCollapsed ? '0' : '12px', display: 'flex', alignItems: 'center' }}><List size={18} /></span>
                {!isCollapsed && <span className="sidebar-link-text">Service List</span>}
              </Link>
            </div>

            {(isSubBranchManager || isMainBranchManager) && (
              <div className="sidebar-section">
                {!isCollapsed && <div className="sidebar-section-label">Sales Operations</div>}
                {isFeatureEnabled('sales_module') && (
                  <Link href="/sales-dashboard" className={`sidebar-link ${pathname === '/sales-dashboard' ? 'active' : ''}`} style={{ justifyContent: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? '12px 0' : '12px 16px' }}>
                    <span className="sidebar-link-icon" style={{ marginRight: isCollapsed ? '0' : '12px', display: 'flex', alignItems: 'center' }}><BarChart2 size={18} /></span>
                    {!isCollapsed && <span className="sidebar-link-text">Sales Stats</span>}
                  </Link>
                )}
                {isFeatureEnabled('inventory_module') && (
                  <Link href="/sales-dashboard/inventory" className={`sidebar-link ${isActive('/sales-dashboard/inventory') ? 'active' : ''}`} style={{ justifyContent: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? '12px 0' : '12px 16px' }}>
                    <span className="sidebar-link-icon" style={{ marginRight: isCollapsed ? '0' : '12px', display: 'flex', alignItems: 'center' }}><Package size={18} /></span>
                    {!isCollapsed && <span className="sidebar-link-text">Inventory</span>}
                  </Link>
                )}
                {isFeatureEnabled('sales_module') && (
                  <Link href="/sales-dashboard/sale" className={`sidebar-link ${isActive('/sales-dashboard/sale') ? 'active' : ''}`} style={{ justifyContent: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? '12px 0' : '12px 16px' }}>
                    <span className="sidebar-link-icon" style={{ marginRight: isCollapsed ? '0' : '12px', display: 'flex', alignItems: 'center' }}><ShoppingCart size={18} /></span>
                    {!isCollapsed && <span className="sidebar-link-text">Record Sale</span>}
                  </Link>
                )}
                {isFeatureEnabled('imei_lookup') && (
                  <Link href="/sales-dashboard/imei" className={`sidebar-link ${isActive('/sales-dashboard/imei') ? 'active' : ''}`} style={{ justifyContent: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? '12px 0' : '12px 16px' }}>
                    <span className="sidebar-link-icon" style={{ marginRight: isCollapsed ? '0' : '12px', display: 'flex', alignItems: 'center' }}><Search size={18} /></span>
                    {!isCollapsed && <span className="sidebar-link-text">IMEI Lookup</span>}
                  </Link>
                )}
              </div>
            )}

            <div className="sidebar-section">
              {!isCollapsed && <div className="sidebar-section-label">Manage</div>}
              <Link href="/technicians" className={`sidebar-link ${isActive('/technicians') ? 'active' : ''}`} style={{ justifyContent: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? '12px 0' : '12px 16px' }}>
                <span className="sidebar-link-icon" style={{ marginRight: isCollapsed ? '0' : '12px', display: 'flex', alignItems: 'center' }}><Users size={18} /></span>
                {!isCollapsed && <span className="sidebar-link-text">Technicians</span>}
              </Link>
              <Link href="/sales-staff" className={`sidebar-link ${isActive('/sales-staff') ? 'active' : ''}`} style={{ justifyContent: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? '12px 0' : '12px 16px' }}>
                <span className="sidebar-link-icon" style={{ marginRight: isCollapsed ? '0' : '12px', display: 'flex', alignItems: 'center' }}><Briefcase size={18} /></span>
                {!isCollapsed && <span className="sidebar-link-text">Sales Staff</span>}
              </Link>
              {isFeatureEnabled('parts_management') && (
                <Link href="/parts" className={`sidebar-link ${isActive('/parts') ? 'active' : ''}`} style={{ justifyContent: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? '12px 0' : '12px 16px' }}>
                  <span className="sidebar-link-icon" style={{ marginRight: isCollapsed ? '0' : '12px', display: 'flex', alignItems: 'center' }}><Cpu size={18} /></span>
                  {!isCollapsed && <span className="sidebar-link-text">Parts</span>}
                </Link>
              )}
              {isFeatureEnabled('add_device_model') && (
                <Link href="/models" className={`sidebar-link ${isActive('/models') ? 'active' : ''}`} style={{ justifyContent: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? '12px 0' : '12px 16px' }}>
                  <span className="sidebar-link-icon" style={{ marginRight: isCollapsed ? '0' : '12px', display: 'flex', alignItems: 'center' }}><Smartphone size={18} /></span>
                  {!isCollapsed && <span className="sidebar-link-text">Device Models</span>}
                </Link>
              )}
              {(isSubBranchManager || isMainBranchManager || isTenantAdmin) && isFeatureEnabled('branch_pricing') && (
                <Link href="/pricing" className={`sidebar-link ${isActive('/pricing') ? 'active' : ''}`} style={{ justifyContent: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? '12px 0' : '12px 16px' }}>
                  <span className="sidebar-link-icon" style={{ marginRight: isCollapsed ? '0' : '12px', display: 'flex', alignItems: 'center' }}><DollarSign size={18} /></span>
                  {!isCollapsed && <span className="sidebar-link-text">Pricing Settings</span>}
                </Link>
              )}
            </div>
          </>
        )}
      </nav>

      {/* Footer / User */}
      <div className="sidebar-footer" style={{ paddingBottom: '40px', padding: isCollapsed ? '20px 0 40px 0' : '20px' }}>
        <div className="sidebar-user" style={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
          <div className="sidebar-avatar">
            {user.fullName?.[0] || user.email?.[0] || '?'}
          </div>
          {!isCollapsed && (
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user.fullName || user.email}</div>
              <div className="sidebar-user-role" style={{ display: 'flex', alignItems: 'center' }}>
                {isSuperAdmin ? <><Shield size={14} style={{marginRight:'4px'}} /> SUPER ADMIN</> : (isTenantAdmin ? <><Crown size={14} style={{marginRight:'4px'}} /> MAIN BRANCH</> : (isTechnician ? <><Wrench size={14} style={{marginRight:'4px'}} /> {user.branchName || 'Branch'} (Technician)</> : (isSalesStaff ? <><ShoppingCart size={14} style={{marginRight:'4px'}} /> {user.branchName || 'Branch'} (Sales)</> : (isSubBranchManager ? <><Store size={14} style={{marginRight:'4px'}} /> {user.branchName || 'Branch'} (Manager)</> : <><Store size={14} style={{marginRight:'4px'}} /> {user.branchName || user.tenantName || 'Tenant'}</>))))}
              </div>
            </div>
          )}
        </div>
        <button 
          className="sidebar-link" 
          onClick={logout} 
          style={{ marginTop: '16px', justifyContent: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? '12px 0' : '12px 16px' }}
          title="Logout"
        >
          <span className="sidebar-link-icon" style={{ marginRight: isCollapsed ? '0' : '12px', display: 'flex', alignItems: 'center' }}><LogOut size={18} /></span>
          {!isCollapsed && <span className="sidebar-link-text">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
