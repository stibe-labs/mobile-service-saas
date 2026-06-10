'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';

export default function TenantDashboard() {
  const { isFeatureEnabled, isTenantAdmin } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [branches, setBranches] = useState([]);
  const [branchFilter, setBranchFilter] = useState('');

  useEffect(() => {
    if (isTenantAdmin) {
      api.getBranches().then(res => setBranches(res.branches || [])).catch(() => { });
    }
  }, [isTenantAdmin]);

  useEffect(() => {
    setLoading(true);
    const query = branchFilter ? { branchId: branchFilter } : {};
    api.getDashboard(query)
      .then(setData)
      .catch((err) => setError(err.error || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, [branchFilter]);

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">⊞ Dashboard</h1>
          <p className="page-subtitle">{isTenantAdmin ? "Today's overview across your company" : "Today's overview for your shop"}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {isTenantAdmin && (
            <select
              className="form-select"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
            >
              <option value="">All Branches</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          )}
          {isFeatureEnabled('add_service') && (
            <Link href="/services/new" className="btn btn-primary">
              + Add New Service
            </Link>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error">! {error}</div>}

      {loading ? (
        <div className="loading-screen" style={{ minHeight: '300px' }}><div className="spinner"></div></div>
      ) : data && (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-icon blue">●</div>
              <div>
                <div className="stat-value">{data.today.today_total}</div>
                <div className="stat-label">Today's Jobs</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon amber">•</div>
              <div>
                <div className="stat-value">{data.pending.count}</div>
                <div className="stat-label">Pending Jobs</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green">+</div>
              <div>
                <div className="stat-value">{data.today.today_delivered}</div>
                <div className="stat-label">Delivered Today</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon purple">≡</div>
              <div>
                <div className="stat-value">{data.allTime.total_jobs}</div>
                <div className="stat-label">All-Time Jobs</div>
              </div>
            </div>
          </div>

          {/* Branch Overview */}
          {data.branchStats && data.branchStats.length > 0 && (
            <div className="card" style={{ marginBottom: '20px', padding: '0' }}>
              <div className="card-header" style={{ padding: '20px 20px 0 20px', borderBottom: 'none' }}>
                <div className="card-title">🏢 Branch Overview</div>
              </div>
              <div className="table-wrap" style={{ border: 'none', borderRadius: '0 0 var(--radius-lg) var(--radius-lg)' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Branch</th>
                      <th>Today's Jobs</th>
                      <th>Pending Jobs</th>
                      <th>Delivered Today</th>
                      <th>Total Jobs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.branchStats.map(bs => (
                      <tr key={bs.id}>
                        <td><strong>{bs.name}</strong> <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({bs.branch_code})</span></td>
                        <td>{bs.today_jobs}</td>
                        <td><span className={`badge ${bs.pending_jobs > 0 ? 'badge-waiting_for_parts' : 'badge-received'}`}>{bs.pending_jobs}</span></td>
                        <td><span className={`badge ${bs.delivered_today > 0 ? 'badge-delivered' : 'badge-received'}`}>{bs.delivered_today}</span></td>
                        <td>{bs.total_jobs}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pending Jobs */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">• Pending Jobs</div>
              <Link href="/services?status=received" className="btn btn-ghost btn-sm">View All →</Link>
            </div>
            {data.pending.recentJobs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"></div>
                <div className="empty-state-text">No pending jobs!</div>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Serial #</th>
                      <th>Customer</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Technician</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.pending.recentJobs.map((job) => (
                      <tr key={job.id}>
                        <td><strong>{job.serial_number}</strong></td>
                        <td>{job.customer_name}</td>
                        <td>{job.customer_phone}</td>
                        <td><span className={`badge badge-${job.status}`}>{job.status.replace(/_/g, ' ')}</span></td>
                        <td>{job.assigned_technician || '—'}</td>
                        <td>
                          <Link href={`/services/${job.id}`} className="btn btn-ghost btn-sm">View</Link>
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
