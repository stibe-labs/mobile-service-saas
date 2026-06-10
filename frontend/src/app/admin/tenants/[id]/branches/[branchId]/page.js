'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';

export default function BranchDetailsPage({ params }) {
  const router = useRouter();
  const { id, branchId } = use(params);
  const [branch, setBranch] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch branch info by getting all branches and finding this one, 
    // plus fetch tech & services filtered by branchId
    Promise.all([
      api.getTenantBranches(id),
      api.getTenantTechnicians(id, branchId),
      api.getTenantServices(id, branchId)
    ])
      .then(([branchesData, techsData, servicesData]) => {
        const foundBranch = branchesData.branches.find(b => b.id === branchId);
        setBranch(foundBranch);
        setTechnicians(techsData.technicians);
        setServices(servicesData.services);
      })
      .catch((err) => setError(err.error || 'Failed to load branch details'))
      .finally(() => setLoading(false));
  }, [id, branchId]);

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">🏢 Branch Details</h1>
          <p className="page-subtitle">
            {branch ? `${branch.name} (${branch.branch_code})` : 'Loading...'}
          </p>
        </div>
        <button className="btn btn-ghost" onClick={() => router.push(`/admin/tenants/${id}`)}>← Back to Tenant</button>
      </div>

      {error && <div className="alert alert-error">! {error}</div>}

      {loading ? (
        <div className="loading-screen" style={{ minHeight: '300px' }}><div className="spinner"></div></div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          
          {/* Technicians */}
          <div className="card" style={{ width: '100%', marginTop: '20px' }}>
            <div className="card-header">
              <div className="card-title">👥 Branch Technicians ({technicians.length})</div>
            </div>
            {technicians.length === 0 ? (
              <div className="empty-state" style={{ padding: '20px' }}><div className="empty-state-text">No technicians assigned to this branch</div></div>
            ) : (
              <div className="table-wrap" style={{ overflowX: 'auto', width: '100%' }}>
                <table className="table" style={{ width: '100%', minWidth: '600px' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '40%' }}>Name</th>
                      <th style={{ width: '30%' }}>Phone</th>
                      <th style={{ width: '30%' }}>Added On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {technicians.map((t) => (
                      <tr key={t.id}>
                        <td><strong>{t.name}</strong></td>
                        <td>{t.phone || '—'}</td>
                        <td>{new Date(t.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Services */}
          <div className="card" style={{ width: '100%' }}>
            <div className="card-header">
              <div className="card-title">≡ Branch Service Jobs ({services.length})</div>
            </div>
            {services.length === 0 ? (
              <div className="empty-state" style={{ padding: '20px' }}><div className="empty-state-text">No service jobs created in this branch</div></div>
            ) : (
              <div className="table-wrap" style={{ overflowX: 'auto', width: '100%' }}>
                <table className="table" style={{ width: '100%', minWidth: '900px' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '15%' }}>Job Card</th>
                      <th style={{ width: '20%' }}>Customer</th>
                      <th style={{ width: '20%' }}>Device</th>
                      <th style={{ width: '15%' }}>Technician</th>
                      <th style={{ width: '15%' }}>Status</th>
                      <th style={{ width: '15%' }}>Received</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((s) => (
                      <tr key={s.id}>
                        <td><strong>{s.serial_number}</strong></td>
                        <td>{s.customer_name}</td>
                        <td>{s.brand_name} {s.model_name}</td>
                        <td>{s.assigned_technician || '—'}</td>
                        <td><span className={`badge badge-${s.status}`}>{s.status.replace(/_/g, ' ')}</span></td>
                        <td>{new Date(s.received_date).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}
    </AppLayout>
  );
}
