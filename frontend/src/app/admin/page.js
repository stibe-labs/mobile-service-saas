'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Building2, CheckCircle2, Ban, Clock, Globe } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getAdminDashboard()
      .then(setData)
      .catch((err) => setError(err.error || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title"><Shield size={28} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }}/> Super Admin Dashboard</h1>
          <p className="page-subtitle">Platform overview — manage all tenants</p>
        </div>
        <Link href="/admin/tenants" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Building2 size={18}/> Manage Tenants
        </Link>
      </div>

      {error && <div className="alert alert-error">! {error}</div>}

      {loading ? (
        <div className="loading-screen" style={{ minHeight: '300px' }}>
          <div className="spinner"></div>
        </div>
      ) : data && (
        <>
          {/* Stats */}
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-icon purple"><Building2 size={24} /></div>
              <div>
                <div className="stat-value">{data.summary.total_tenants}</div>
                <div className="stat-label">Total Tenants</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green"><CheckCircle2 size={24} /></div>
              <div>
                <div className="stat-value">{data.summary.active_tenants}</div>
                <div className="stat-label">Active</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon red"><Ban size={24} /></div>
              <div>
                <div className="stat-value">{data.summary.suspended_tenants}</div>
                <div className="stat-label">Suspended</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon amber"><Clock size={24} /></div>
              <div>
                <div className="stat-value">{data.summary.pending_tenants}</div>
                <div className="stat-label">Pending</div>
              </div>
            </div>
          </div>

          {/* Tenant List */}
          <div className="card" style={{ width: '100%', marginTop: '20px' }}>
            <div className="card-header">
              <h2 className="card-title">All Tenants</h2>
            </div>
            {data.tenants.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><Building2 size={48} color="var(--text-muted)" /></div>
                <div className="empty-state-text">No tenants yet</div>
              </div>
            ) : (
              <div className="table-wrap" style={{ overflowX: 'auto', width: '100%' }}>
                <table className="table" style={{ width: '100%', minWidth: '800px' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '25%' }}>Shop Name</th>
                      <th style={{ width: '15%' }}>Source</th>
                      <th style={{ width: '15%' }}>Plan</th>
                      <th style={{ width: '15%' }}>Status</th>
                      <th style={{ width: '15%' }}>Users</th>
                      <th style={{ width: '15%' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.tenants.map((tenant) => (
                      <tr 
                        key={tenant.id}
                        onClick={() => router.push(`/admin/tenants/${tenant.id}`)}
                        style={{ cursor: 'pointer' }}
                        className="hover-row"
                      >
                        <td><strong>{tenant.name || '-'}</strong></td>
                        <td>
                          {tenant.source === 'self_registered' ? (
                            <span style={{ fontSize: '0.85rem', color: '#0ea5e9', display: 'flex', alignItems: 'center', gap: '4px' }}><Globe size={14}/> Website</span>
                          ) : (
                            <span style={{ fontSize: '0.85rem', color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '4px' }}><Shield size={14}/> Admin</span>
                          )}
                        </td>
                        <td>
                          <span style={{ fontWeight: '500', textTransform: 'capitalize' }}>{tenant.plan_tier || 'Free'}</span>
                        </td>
                        <td><span className={`badge badge-${tenant.status}`}>{tenant.status}</span></td>
                        <td>{tenant.active_users}</td>
                        <td>
                          <Link href={`/admin/tenants/${tenant.id}`} className="btn btn-ghost btn-sm" onClick={(e) => e.stopPropagation()}>
                            Settings
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </AppLayout>
  );
}
