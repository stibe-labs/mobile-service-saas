'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Cpu, Plus, PlusCircle, Search, Edit2, Trash2, Check, X } from 'lucide-react';

export default function PartsPage() {
  const { isFeatureEnabled, isTenantAdmin } = useAuth();
  const [parts, setParts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [branchFilter, setBranchFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editPart, setEditPart] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', costPrice: '', sellingPrice: '', branchId: '' });
  
  // Inline delete confirmation
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);

  const loadParts = (q, branch) => {
    setLoading(true);
    const query = {};
    if (q) query.search = q;
    if (branch) query.branchId = branch;

    api.getParts(query)
      .then((data) => setParts(data.parts))
      .catch((err) => setError(err.error))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isTenantAdmin) {
      api.getBranches().then(res => setBranches(res.branches || [])).catch(() => {});
    }
  }, [isTenantAdmin]);

  useEffect(() => { loadParts(search, branchFilter); }, [branchFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editPart) {
        await api.updatePart(editPart.id, form);
      } else {
        await api.createPart(form);
      }
      setShowModal(false);
      setEditPart(null);
      setForm({ name: '', costPrice: '', sellingPrice: '', branchId: '' });
      loadParts(search, branchFilter);
    } catch (err) {
      setError(err.error || 'Failed to save part');
    }
  };

  const handleEdit = (part) => {
    setEditPart(part);
    setForm({ name: part.name, costPrice: part.cost_price, sellingPrice: part.selling_price, branchId: part.branch_id });
    setShowModal(true);
  };

  const handleDeletePrompt = (id) => {
    setConfirmingDeleteId(id);
  };

  const confirmDelete = async (id) => {
    try {
      await api.deletePart(id);
      setConfirmingDeleteId(null);
      loadParts(search, branchFilter);
    } catch (err) { 
      setError(err.error); 
      setConfirmingDeleteId(null);
    }
  };

  const cancelDelete = () => {
    setConfirmingDeleteId(null);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadParts(search, branchFilter);
  };

  return (
    <>
      <AppLayout>
        <div className="page-header">
          <div>
            <h1 className="page-title"><Cpu size={28} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }}/> Parts Management</h1>
            <p className="page-subtitle">{isTenantAdmin ? 'Manage catalogue across company' : 'Manage your parts catalogue'}</p>
          </div>
          {isFeatureEnabled('add_part') && (
            <button className="btn btn-primary" onClick={() => { setEditPart(null); setForm({ name: '', costPrice: '', sellingPrice: '', branchId: '' }); setShowModal(true); }}>
              <Plus size={18} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }}/> Add Part
            </button>
          )}
        </div>

        {error && <div className="alert alert-error">! {error}</div>}

        <div className="card" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', flex: 1 }}>
              <input className="form-input" placeholder="Search parts..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1 }} />
              <button type="submit" className="btn btn-primary" style={{ padding: '0 16px', display: 'flex', alignItems: 'center' }}><Search size={18} /></button>
            </form>
            {isTenantAdmin && (
              <select className="form-select" value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} style={{ width: '200px' }}>
                <option value="">All Branches</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            )}
          </div>
        </div>

        {loading ? (
          <div className="loading-screen" style={{ minHeight: '200px' }}><div className="spinner"></div></div>
        ) : parts.length === 0 ? (
          <div className="card"><div className="empty-state"><div className="empty-state-icon"><Cpu size={48} color="var(--text-muted)" /></div><div className="empty-state-text">No parts yet</div></div></div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            <div className="table-wrap" style={{ border: 'none' }}>
              <table className="table">
                <thead>
                  <tr>{isTenantAdmin && <th>Branch</th>}<th>Part Name</th><th>Cost Price</th><th>Selling Price</th><th>Compatible Models</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {parts.map((p) => (
                    <tr key={p.id}>
                      {isTenantAdmin && <td>{branches.find(b => b.id === p.branch_id)?.name || 'Unknown'}</td>}
                      <td><strong>{p.name}</strong></td>
                      <td>₹{p.cost_price}</td>
                      <td>₹{p.selling_price}</td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {p.compatible_models?.length > 0
                          ? p.compatible_models.map((m) => `${m.brand} ${m.name}`).join(', ')
                          : '—'}
                      </td>
                      <td style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(p)} style={{ padding: '6px', display: 'flex' }}><Edit2 size={16} /></button>
                        {confirmingDeleteId === p.id ? (
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Sure?</span>
                            <button className="btn btn-sm btn-success" onClick={() => confirmDelete(p.id)} style={{ padding: '4px', display: 'flex' }}><Check size={14} /></button>
                            <button className="btn btn-sm btn-ghost" onClick={cancelDelete} style={{ padding: '4px', display: 'flex' }}><X size={14} /></button>
                          </div>
                        ) : (
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeletePrompt(p.id)} style={{ padding: '6px', display: 'flex' }}><Trash2 size={16} /></button>
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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">
              {editPart ? <><Edit2 size={24} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }}/> Edit Part</> : <><PlusCircle size={24} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }}/> Add New Part</>}
            </h2>
            <form onSubmit={handleSubmit}>
              {isTenantAdmin && !editPart && (
                <div className="form-group">
                  <label className="form-label">Branch *</label>
                  <select className="form-select" value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })} required>
                    <option value="">Select a branch...</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Part Name *</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Cost Price</label>
                  <input className="form-input" type="number" step="0.01" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Selling Price</label>
                  <input className="form-input" type="number" step="0.01" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editPart ? 'Update' : 'Add Part'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
