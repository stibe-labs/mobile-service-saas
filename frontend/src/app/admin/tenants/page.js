'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';

export default function TenantsPage() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', branchCode: '', email: '', password: '', maxBranches: 1, maxTechnicians: 2, planTier: 'free' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Edit Tenant State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ id: '', name: '', maxBranches: 1, maxTechnicians: 2, planTier: 'free' });

  const loadTenants = () => {
    api.getTenants()
      .then((data) => setTenants(data.tenants))
      .catch((err) => setError(err.error))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadTenants(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.createTenant(form);
      setSuccess('Tenant created successfully!');
      setShowModal(false);
      setForm({ name: '', branchCode: '', email: '', password: '', maxBranches: 1, maxTechnicians: 2, planTier: 'free' });
      loadTenants();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.error || 'Failed to create tenant');
    }
  };

  const handleToggleStatus = async (tenant) => {
    const newStatus = tenant.status === 'active' ? 'suspended' : 'active';
    try {
      await api.updateTenant(tenant.id, { status: newStatus });
      loadTenants();
    } catch (err) {
      setError(err.error || 'Failed to update status');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.updateTenant(editForm.id, { name: editForm.name, planTier: editForm.planTier });
      await api.setTenantMaxBranches(editForm.id, editForm.maxBranches);
      await api.setTenantMaxTechnicians(editForm.id, editForm.maxTechnicians);
      setSuccess('Tenant updated successfully!');
      setShowEditModal(false);
      loadTenants();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.error || 'Failed to update tenant');
    }
  };

  return (
    <>
      <AppLayout>
        <div className="page-header">
          <div>
            <h1 className="page-title">▦ Tenant Management</h1>
            <p className="page-subtitle">Manage all shops on the platform</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Add Tenant
          </button>
        </div>

        {error && <div className="alert alert-error">! {error}</div>}
        {success && <div className="alert alert-success">+ {success}</div>}

        {loading ? (
          <div className="loading-screen" style={{ minHeight: '300px' }}><div className="spinner"></div></div>
        ) : (
          <div className="card" style={{ width: '100%', marginTop: '20px' }}>
            <div className="table-wrap" style={{ overflowX: 'auto', width: '100%' }}>
              <table className="table" style={{ width: '100%', minWidth: '800px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '20%' }}>Shop / Company Name</th>
                    <th style={{ width: '10%' }}>Source</th>
                    <th style={{ width: '10%' }}>Plan</th>
                    <th style={{ width: '10%' }}>Status</th>
                    <th style={{ width: '10%' }}>Active Users</th>
                    <th style={{ width: '10%' }}>Max Branches</th>
                    <th style={{ width: '10%' }}>Max Techs</th>
                    <th style={{ width: '20%' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((t) => (
                    <tr key={t.id}>
                      <td><strong>{t.name || '-'}</strong></td>
                      <td>
                        {t.source === 'self_registered' ? (
                          <span style={{ fontSize: '0.85rem', color: '#0ea5e9', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontSize: '1rem' }}>🌐</span> Website
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.85rem', color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontSize: '1rem' }}>🛡️</span> Admin
                          </span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontWeight: '500', textTransform: 'capitalize' }}>{t.plan_tier || 'Free'}</span>
                      </td>
                      <td><span className={`badge badge-${t.status}`}>{t.status}</span></td>
                      <td>{t.active_users}</td>
                      <td>{t.max_branches}</td>
                      <td>{t.max_technicians}</td>
                      <td style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            setEditForm({ id: t.id, name: t.name, maxBranches: t.max_branches, maxTechnicians: t.max_technicians, planTier: t.plan_tier || 'free' });
                            setShowEditModal(true);
                          }}
                        >
                          ✎ Edit
                        </button>
                        <button
                          className={`btn btn-sm ${t.status === 'active' ? 'btn-danger' : 'btn-success'}`}
                          onClick={() => handleToggleStatus(t)}
                        >
                          {t.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                        <a href={`/admin/tenants/${t.id}`} className="btn btn-ghost btn-sm">⚙ Toggles</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </AppLayout>

      {/* Create Tenant Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">+ Add New Tenant</h2>
            <form onSubmit={handleCreate}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Shop / Company Name *</label>
                  <input className="form-input" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Admin Email *</label>
                  <input className="form-input" type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Admin Password *</label>
                  <input className="form-input" type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Max Branches</label>
                  <input className="form-input" type="number" min="1" value={form.maxBranches} onChange={(e) => setForm({...form, maxBranches: e.target.value === '' ? '' : parseInt(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Technicians</label>
                  <input className="form-input" type="number" min="1" value={form.maxTechnicians} onChange={(e) => setForm({...form, maxTechnicians: e.target.value === '' ? '' : parseInt(e.target.value)})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Plan Tier</label>
                  <select className="form-select" value={form.planTier} onChange={(e) => setForm({...form, planTier: e.target.value})}>
                    <option value="free">Free</option>
                    <option value="starter">Starter</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div className="form-group" style={{ visibility: 'hidden' }}>
                  <label className="form-label">Placeholder</label>
                  <input className="form-input" disabled />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Tenant</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Tenant Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">✎ Edit Tenant</h2>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label className="form-label">Shop / Company Name *</label>
                <input className="form-input" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Max Branches</label>
                  <input className="form-input" type="number" min="1" value={editForm.maxBranches} onChange={(e) => setEditForm({...editForm, maxBranches: e.target.value === '' ? '' : parseInt(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Technicians</label>
                  <input className="form-input" type="number" min="1" value={editForm.maxTechnicians} onChange={(e) => setEditForm({...editForm, maxTechnicians: e.target.value === '' ? '' : parseInt(e.target.value)})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Plan Tier</label>
                  <select className="form-select" value={editForm.planTier} onChange={(e) => setEditForm({...editForm, planTier: e.target.value})}>
                    <option value="free">Free</option>
                    <option value="starter">Starter</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div className="form-group" style={{ visibility: 'hidden' }}>
                  <label className="form-label">Placeholder</label>
                  <input className="form-input" disabled />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
