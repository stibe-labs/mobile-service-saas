'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Briefcase, Plus, Trash2, Check, X, UserPlus } from 'lucide-react';

export default function SalesStaffPage() {
  const { isTenantAdmin } = useAuth();
  const [salesStaff, setSalesStaff] = useState([]);
  const [branches, setBranches] = useState([]);
  const [branchFilter, setBranchFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Inline delete confirmation
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', branchId: '' });

  const loadSalesStaff = (branch) => {
    setLoading(true);
    const query = branch ? { branchId: branch } : {};
    api.getSalesStaff(query)
      .then((data) => setSalesStaff(data.salesStaff))
      .catch((err) => setError(err.error || 'Failed to load sales staff'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isTenantAdmin) {
      api.getBranches().then(res => setBranches(res.branches || [])).catch(() => {});
    }
  }, [isTenantAdmin]);

  useEffect(() => { loadSalesStaff(branchFilter); }, [branchFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.createSalesStaff(form);
      setShowModal(false);
      setForm({ name: '', email: '', password: '', branchId: '' });
      loadSalesStaff(branchFilter);
    } catch (err) {
      setError(err.error || 'Failed to save sales staff');
    }
  };

  const handleDeletePrompt = (id) => {
    setConfirmingDeleteId(id);
  };

  const confirmDelete = async (id) => {
    try {
      await api.deleteSalesStaff(id);
      setConfirmingDeleteId(null);
      loadSalesStaff(branchFilter);
    } catch (err) { 
      setError(err.error || 'Failed to delete sales staff'); 
      setConfirmingDeleteId(null);
    }
  };

  const cancelDelete = () => {
    setConfirmingDeleteId(null);
  };

  return (
    <>
      <AppLayout>
        <div className="page-header">
          <div>
            <h1 className="page-title"><Briefcase size={28} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }}/> Sales Staff</h1>
            <p className="page-subtitle">{isTenantAdmin ? 'Manage sales staff across the company' : 'Manage sales staff for this branch'}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {isTenantAdmin && (
              <select className="form-select" value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} style={{ width: '200px' }}>
                <option value="">All Branches</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            )}
            <button className="btn btn-primary" onClick={() => { setForm({ name: '', email: '', password: '', branchId: '' }); setShowModal(true); }}>
              <Plus size={18} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }}/> Add Sales Staff
            </button>
          </div>
        </div>

        {error && <div className="alert alert-error">! {error}</div>}

        {loading ? (
          <div className="loading-screen" style={{ minHeight: '200px' }}><div className="spinner"></div></div>
        ) : salesStaff.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon"><Briefcase size={48} color="var(--text-muted)" /></div>
              <div className="empty-state-text">No sales staff added yet</div>
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
                  {salesStaff.map((staff) => (
                    <tr key={staff.id}>
                      {isTenantAdmin && <td>{branches.find(b => b.id === staff.branch_id)?.name || 'Unknown'}</td>}
                      <td><strong>{staff.name}</strong></td>
                      <td>{staff.email}</td>
                      <td>{new Date(staff.created_at).toLocaleDateString()}</td>
                      <td>
                        {confirmingDeleteId === staff.id ? (
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Sure?</span>
                            <button className="btn btn-sm btn-success" onClick={() => confirmDelete(staff.id)} style={{ padding: '4px', display: 'flex' }}><Check size={14} /></button>
                            <button className="btn btn-sm btn-ghost" onClick={cancelDelete} style={{ padding: '4px', display: 'flex' }}><X size={14} /></button>
                          </div>
                        ) : (
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeletePrompt(staff.id)} style={{ padding: '6px', display: 'flex' }}><Trash2 size={16} /></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </AppLayout>

      {/* Add Sales Staff Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title"><UserPlus size={24} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }}/> Add New Sales Staff</h2>
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
                <label className="form-label">Staff Name *</label>
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
                <button type="submit" className="btn btn-primary">Add Sales Staff</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
