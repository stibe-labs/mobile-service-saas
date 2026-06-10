'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';

const FEATURE_LABELS = {
  add_service: { label: 'Add New Service (Job Card)', icon: '+' },
  add_part: { label: 'Add New Part', icon: '▤' },
  add_device_model: { label: 'Add New Device Model', icon: '◘' },
  service_status_update: { label: 'Service Status Update', icon: '⟳' },
  parts_management: { label: 'Parts Management Module', icon: '▤' },
  printable_job_card: { label: 'Printable Job Card', icon: '≡' },
  printable_receipt: { label: 'Printable Service Receipt', icon: '≡' },
  branch_dashboard: { label: 'Branch Dashboard Access', icon: '⊞' },
};

export default function TenantDetailsPage({ params }) {
  const router = useRouter();
  const { id } = use(params);
  const [tenant, setTenant] = useState(null);
  const [toggles, setToggles] = useState(null);
  const [branches, setBranches] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    Promise.all([
      api.getTenantToggles(id),
      api.getTenantBranches(id),
      api.getTenantTechnicians(id),
      api.getTenantServices(id)
    ])
      .then(([togglesData, branchesData, techsData, servicesData]) => {
        setTenant(togglesData);
        setToggles(togglesData.toggles);
        setBranches(branchesData.branches);
        setTechnicians(techsData.technicians);
        setServices(servicesData.services);
      })
      .catch((err) => setError(err.error || 'Failed to load tenant details'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleToggle = async (feature, value) => {
    setSaving(true);
    setError('');
    try {
      const updated = await api.updateTenantToggles(id, { [feature]: value });
      setToggles(updated.toggles);
      setSuccess('Toggle updated!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err.error || 'Failed to update toggle');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">▦ Tenant Details</h1>
          <p className="page-subtitle">
            {tenant ? `${tenant.tenant_name}` : 'Loading...'}
          </p>
        </div>
        <button className="btn btn-ghost" onClick={() => router.push('/admin/tenants')}>← Back</button>
      </div>

      {error && <div className="alert alert-error">! {error}</div>}
      {success && <div className="alert alert-success">+ {success}</div>}

      {loading ? (
        <div className="loading-screen" style={{ minHeight: '300px' }}><div className="spinner"></div></div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          
          {/* Feature Toggles */}
          {toggles && (
            <div className="card" style={{ width: '100%', marginTop: '20px' }}>
              <div className="card-header">
                <div className="card-title">⚙ Feature Controls</div>
                <div className="card-subtitle">Toggle features on/off — changes take effect immediately</div>
              </div>
              <div className="table-wrap" style={{ overflowX: 'auto', width: '100%' }}>
                <table className="table" style={{ width: '100%', minWidth: '500px' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '50%' }}>Feature</th>
                      <th style={{ width: '30%' }}>Status</th>
                      <th style={{ width: '20%' }}>Toggle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(FEATURE_LABELS).map(([key, { label, icon }]) => (
                      <tr key={key}>
                        <td>
                          <span style={{ marginRight: '8px' }}>{icon}</span>
                          {label}
                        </td>
                        <td>
                          <span className={`badge ${toggles[key] ? 'badge-active' : 'badge-suspended'}`}>
                            {toggles[key] ? '+ Enabled' : '- Disabled'}
                          </span>
                        </td>
                        <td>
                          <label className="toggle">
                            <input
                              type="checkbox"
                              checked={toggles[key] || false}
                              onChange={(e) => handleToggle(key, e.target.checked)}
                              disabled={saving}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Branches */}
          <div className="card" style={{ width: '100%' }}>
            <div className="card-header">
              <div className="card-title">🏢 Branches ({branches?.length || 0})</div>
            </div>
            {!branches || branches.length === 0 ? (
              <div className="empty-state" style={{ padding: '20px' }}><div className="empty-state-text">No branches found</div></div>
            ) : (
              <div className="table-wrap" style={{ overflowX: 'auto', width: '100%' }}>
                <table className="table" style={{ width: '100%', minWidth: '800px' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '20%' }}>Branch Name</th>
                      <th style={{ width: '20%' }}>Admin Email</th>
                      <th style={{ width: '15%' }}>Branch Code</th>
                      <th style={{ width: '15%' }}>Status</th>
                      <th style={{ width: '10%' }}>Total Jobs</th>
                      <th style={{ width: '10%' }}>Pending Jobs</th>
                      <th style={{ width: '10%' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branches.map((b) => (
                      <tr 
                        key={b.id} 
                        onClick={() => router.push(`/admin/tenants/${id}/branches/${b.id}`)}
                        style={{ cursor: 'pointer' }}
                        className="hover-row"
                      >
                        <td><strong>{b.name}</strong> {b.is_main_branch && <span className="badge badge-active" style={{marginLeft:'8px'}}>Main</span>}</td>
                        <td>{b.admin_email || '—'}</td>
                        <td>{b.branch_code}</td>
                        <td><span className={`badge badge-${b.status}`}>{b.status}</span></td>
                        <td>{b.total_jobs}</td>
                        <td><span className={`badge ${b.pending_jobs > 0 ? 'badge-waiting_for_parts' : 'badge-received'}`}>{b.pending_jobs}</span></td>
                        <td>
                          <button 
                            className="btn btn-ghost btn-sm"
                            onClick={(e) => { e.stopPropagation(); router.push(`/admin/tenants/${id}/branches/${b.id}`); }}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Technicians */}
          <div className="card" style={{ width: '100%' }}>
            <div className="card-header">
              <div className="card-title">👥 Technicians ({technicians.length})</div>
            </div>
            {technicians.length === 0 ? (
              <div className="empty-state" style={{ padding: '20px' }}><div className="empty-state-text">No technicians added yet</div></div>
            ) : (
              <div className="table-wrap" style={{ overflowX: 'auto', width: '100%' }}>
                <table className="table" style={{ width: '100%', minWidth: '600px' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '40%' }}>Name</th>
                      <th style={{ width: '30%' }}>Email</th>
                      <th style={{ width: '30%' }}>Added On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {technicians.map((t) => (
                      <tr key={t.id}>
                        <td><strong>{t.name}</strong></td>
                        <td>{t.email || '—'}</td>
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
              <div className="card-title">≡ Service Jobs ({services.length})</div>
            </div>
            {services.length === 0 ? (
              <div className="empty-state" style={{ padding: '20px' }}><div className="empty-state-text">No service jobs created yet</div></div>
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
