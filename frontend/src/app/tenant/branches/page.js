'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';

export default function BranchesPage() {
  const { isTenantAdmin, loading } = useAuth();
  const router = useRouter();

  const [branches, setBranches] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Create Modal State
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    branchCode: '',
    address: '',
    phone: '',
    email: '',
    password: '',
  });

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ id: '', name: '', branchCode: '', address: '', phone: '' });

  // Inline delete confirmation
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!loading && !isTenantAdmin) {
      router.push('/dashboard');
    } else if (!loading && isTenantAdmin) {
      loadBranches();
    }
  }, [loading, isTenantAdmin]);

  const loadBranches = () => {
    api.getBranches()
      .then(data => setBranches(data.branches || []))
      .catch(err => console.error('Failed to load branches', err));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.createBranch(form);
      setSuccess('Branch created successfully!');
      setShowModal(false);
      setForm({ name: '', branchCode: '', address: '', phone: '', email: '', password: '' });
      loadBranches();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.error || err.message || 'Failed to create branch');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.updateBranch(editForm.id, {
        name: editForm.name,
        branchCode: editForm.branchCode,
        address: editForm.address,
        phone: editForm.phone,
      });
      setSuccess('Branch updated successfully!');
      setShowEditModal(false);
      loadBranches();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update branch');
    }
  };

  const handleDeleteClick = (id) => {
    setConfirmingDeleteId(id);
  };

  const confirmDelete = async (id) => {
    setDeleting(true);
    setError('');
    try {
      await api.deleteBranch(id);
      setSuccess('Branch deleted successfully.');
      setConfirmingDeleteId(null);
      loadBranches();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete branch');
    } finally {
      setDeleting(false);
    }
  };

  const cancelDelete = () => {
    setConfirmingDeleteId(null);
  };

  if (loading || !isTenantAdmin) return <div className="loading">Loading...</div>;

  return (
    <div className="page-container">
      <AppLayout>
        <div className="page-header">
          <div>
            <h1 className="page-title">▣ Branch Management</h1>
            <p className="page-subtitle">Manage branches for your company</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setForm({ name: '', branchCode: '', address: '', phone: '', email: '', password: '' }); setShowModal(true); }}>
            + Add Branch
          </button>
        </div>

        {error && <div className="alert alert-error">! {error}</div>}
        {success && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{success}</div>}

        {loading ? (
          <div className="loading-screen" style={{ minHeight: '200px' }}><div className="spinner"></div></div>
        ) : branches.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">▣</div>
              <div className="empty-state-text">No branches added yet</div>
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            <div className="table-responsive" style={{ border: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Branch Code</th>
                  <th>Branch Name</th>
                  <th>Address</th>
                  <th>Phone</th>
                  <th>Users</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {branches.map((b) => (
                  <tr key={b.id}>
                    <td><strong>{b.branch_code}</strong></td>
                    <td>{b.name}</td>
                    <td>{b.address || '-'}</td>
                    <td>{b.phone || '-'}</td>
                    <td>{b.user_count}</td>
                    <td style={{ display: 'flex', gap: '6px' }}>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          setEditForm({ 
                            id: b.id, 
                            name: b.name, 
                            branchCode: b.branch_code,
                            address: b.address || '',
                            phone: b.phone || '',
                          });
                          setShowEditModal(true);
                        }}
                      >
                        ✎ Edit
                      </button>
                      {confirmingDeleteId === b.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Sure?</span>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => confirmDelete(b.id)}
                            disabled={deleting}
                            style={{ padding: '2px 8px', fontSize: '0.85rem' }}
                          >
                            {deleting ? '...' : '✓'}
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={cancelDelete}
                            disabled={deleting}
                            style={{ padding: '2px 8px', fontSize: '0.85rem' }}
                          >
                            ✗
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleDeleteClick(b.id)}
                          style={{ color: 'var(--danger-color)' }}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        )}

      {/* Create Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <h2 className="modal-title">+ Add New Branch</h2>
            {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
            
            <form onSubmit={handleCreate}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Branch Name *</label>
                  <input className="form-input" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Branch Code *</label>
                  <input className="form-input" value={form.branchCode} onChange={(e) => setForm({...form, branchCode: e.target.value})} placeholder="e.g. BR1" required />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input className="form-input" value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} />
                </div>
              </div>

              <hr style={{ margin: '1rem 0', borderColor: 'var(--border-color)' }} />
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Branch User Account</h3>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input className="form-input" type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <input className="form-input" type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} required />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Branch</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <h2 className="modal-title">✎ Edit Branch</h2>
            {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
            
            <form onSubmit={handleEditSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Branch Name *</label>
                  <input className="form-input" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Branch Code *</label>
                  <input className="form-input" value={editForm.branchCode} onChange={(e) => setEditForm({...editForm, branchCode: e.target.value})} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input className="form-input" value={editForm.address} onChange={(e) => setEditForm({...editForm, address: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} />
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
      </AppLayout>
    </div>
  );
}
