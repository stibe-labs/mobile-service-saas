'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

export default function TechniciansPage() {
  const { isTenantAdmin } = useAuth();
  const [technicians, setTechnicians] = useState([]);
  const [branches, setBranches] = useState([]);
  const [branchFilter, setBranchFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', branchId: '' });

  const loadTechnicians = (branch) => {
    setLoading(true);
    const query = branch ? { branchId: branch } : {};
    api.getTechnicians(query)
      .then((data) => setTechnicians(data.technicians))
      .catch((err) => setError(err.error || 'Failed to load technicians'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isTenantAdmin) {
      api.getBranches().then(res => setBranches(res.branches || [])).catch(() => {});
    }
  }, [isTenantAdmin]);

  useEffect(() => { loadTechnicians(branchFilter); }, [branchFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.createTechnician(form);
      setShowModal(false);
      setForm({ name: '', email: '', password: '', branchId: '' });
      loadTechnicians(branchFilter);
    } catch (err) {
      setError(err.error || 'Failed to save technician');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this technician?')) return;
    try {
      await api.deleteTechnician(id);
      loadTechnicians(branchFilter);
    } catch (err) { 
      setError(err.error || 'Failed to delete technician'); 
    }
  };

  return (
    <>
      <AppLayout>
        <div className="page-header">
          <div>
            <h1 className="page-title">⚙ Technicians</h1>
            <p className="page-subtitle">{isTenantAdmin ? 'Manage service technicians across company' : 'Manage service technicians for this branch'}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {isTenantAdmin && (
              <select className="form-select" value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} style={{ width: '200px' }}>
                <option value="">All Branches</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            )}
            <button className="btn btn-primary" onClick={() => { setForm({ name: '', email: '', password: '', branchId: '' }); setShowModal(true); }}>
              + Add Technician
            </button>
          </div>
        </div>

        {error && <div className="alert alert-error">! {error}</div>}

        {loading ? (
          <div className="loading-screen" style={{ minHeight: '200px' }}><div className="spinner"></div></div>
        ) : technicians.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">⚙</div>
              <div className="empty-state-text">No technicians added yet</div>
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            <div className="table-wrap" style={{ border: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    {isTenantAdmin && <th>Branch</th>}
                    <th>Name</th>
                    <th>Email</th>
                    <th>Added On</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {technicians.map((tech) => (
                    <tr key={tech.id}>
                      {isTenantAdmin && <td>{branches.find(b => b.id === tech.branch_id)?.name || 'Unknown'}</td>}
                      <td><strong>{tech.name}</strong></td>
                      <td>{tech.email}</td>
                      <td>{new Date(tech.created_at).toLocaleDateString()}</td>
                      <td>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(tech.id)}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </AppLayout>

      {/* Add Technician Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">+ Add New Technician</h2>
            <form onSubmit={handleSubmit}>
              {isTenantAdmin && (
                <div className="form-group">
                  <label className="form-label">Branch *</label>
                  <select className="form-select" value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })} required>
                    <option value="">Select a branch...</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Technician Name *</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Email (Login ID) *</label>
                <input className="form-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input type="password" className="form-input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Technician</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
