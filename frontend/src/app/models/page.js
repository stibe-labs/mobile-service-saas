'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Smartphone, Plus, PlusCircle, Check, X, Trash2, ArrowLeft } from 'lucide-react';

export default function ModelsPage() {
  const { isFeatureEnabled, isTenantAdmin } = useAuth();
  const [brands, setBrands] = useState([]);
  const [branches, setBranches] = useState([]);
  const [branchFilter, setBranchFilter] = useState('');
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Forms
  const [newBrand, setNewBrand] = useState({ name: '', branchId: '' });
  const [newModel, setNewModel] = useState('');
  const [showBrandModal, setShowBrandModal] = useState(false);

  // Inline delete confirmation (no window.confirm needed)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadBrands = (branch) => {
    setLoading(true);
    const query = branch ? { branchId: branch } : {};
    api.getBrands(query)
      .then((data) => setBrands(data.brands))
      .catch((err) => setError(err.error))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isTenantAdmin) {
      api.getBranches().then(res => setBranches(res.branches || [])).catch(() => {});
    }
  }, [isTenantAdmin]);

  useEffect(() => { loadBrands(branchFilter); }, [branchFilter]);

  const selectBrand = (brand) => {
    setSelectedBrand(brand);
    api.getBrandModels(brand.id)
      .then((data) => setModels(data.models))
      .catch((err) => setError(err.error));
  };

  const handleAddBrand = async (e) => {
    e.preventDefault();
    if (!newBrand.name.trim()) return;
    try {
      await api.createBrand(newBrand.name.trim(), newBrand.branchId);
      setNewBrand({ name: '', branchId: '' });
      setShowBrandModal(false);
      loadBrands(branchFilter);
    } catch (err) { setError(err.error || err.message || 'Failed to add brand'); }
  };

  const handleAddModel = async (e) => {
    e.preventDefault();
    if (!newModel.trim() || !selectedBrand) return;
    try {
      await api.createModel(selectedBrand.id, newModel.trim(), selectedBrand.branch_id);
      setNewModel('');
      selectBrand(selectedBrand);
      loadBrands(branchFilter);
    } catch (err) { setError(err.error || err.message || 'Failed to add model'); }
  };

  // Step 1: User clicks ✕ → show inline "Sure?" confirmation
  const handleDeleteModel = (modelId) => {
    setConfirmingDeleteId(modelId);
  };

  // Step 2: User clicks ✓ → actually delete
  const confirmDelete = async (modelId) => {
    setDeleting(true);
    setError('');
    try {
      await api.deleteModel(modelId);
      setConfirmingDeleteId(null);
      selectBrand(selectedBrand);
      loadBrands(branchFilter);
    } catch (err) {
      setError(err.error || err.message || 'Failed to delete model');
    } finally {
      setDeleting(false);
    }
  };

  // Step 2 alt: User clicks ✗ → cancel
  const cancelDelete = () => {
    setConfirmingDeleteId(null);
  };

  return (
    <>
      <AppLayout>
        <div className="page-header">
          <div>
            <h1 className="page-title"><Smartphone size={28} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }}/> Device Models</h1>
            <p className="page-subtitle">{isTenantAdmin ? 'Manage brands & models across company' : 'Manage brands & models for job cards'}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {isTenantAdmin && (
              <select className="form-select" value={branchFilter} onChange={(e) => { setBranchFilter(e.target.value); setSelectedBrand(null); }} style={{ width: '200px' }}>
                <option value="">All Branches</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            )}
            {isFeatureEnabled('add_device_model') && (
              <button className="btn btn-primary" onClick={() => setShowBrandModal(true)}>
                <Plus size={18} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }}/> Add Brand
              </button>
            )}
          </div>
        </div>

        {error && <div className="alert alert-error">! {error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px' }}>
          {/* Brands List */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: '14px' }}>Brands</div>
            {loading ? (
              <div className="spinner" style={{ margin: '20px auto' }}></div>
            ) : brands.length === 0 ? (
              <div className="empty-state" style={{ padding: '20px' }}><div className="empty-state-text">No brands</div></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {brands.map((b) => (
                  <button
                    key={b.id}
                    className={`btn ${selectedBrand?.id === b.id ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => selectBrand(b)}
                    style={{ justifyContent: 'flex-start', padding: '12px 16px', height: 'auto', textAlign: 'left', width: '100%' }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>{b.name}</span>
                      {isTenantAdmin && (
                        <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                          {b.branch_id ? (branches.find(br => br.id === b.branch_id)?.name || 'Unknown Branch') : 'Global (All Branches)'}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold', padding: '4px 8px', background: 'rgba(0,0,0,0.1)', borderRadius: '12px' }}>{b.model_count}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Models List */}
          <div className="card">
            {selectedBrand ? (
              <>
                <div className="card-header">
                  <div className="card-title">{selectedBrand.name} — Models</div>
                </div>

                {/* Add Model Form */}
                {isFeatureEnabled('add_device_model') && (
                  <form onSubmit={handleAddModel} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <input className="form-input" placeholder="New model name..." value={newModel} onChange={(e) => setNewModel(e.target.value)} style={{ flex: 1 }} />
                    <button type="submit" className="btn btn-success btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Plus size={14}/> Add</button>
                  </form>
                )}

                {models.length === 0 ? (
                  <div className="empty-state" style={{ padding: '20px' }}><div className="empty-state-text">No models under {selectedBrand.name}</div></div>
                ) : (
                  <div className="table-wrap">
                    <table className="table">
                      <thead><tr><th>Model Name</th><th>Added</th><th>Actions</th></tr></thead>
                      <tbody>
                        {models.map((m) => (
                          <tr key={m.id}>
                            <td><strong>{m.name}</strong></td>
                            <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(m.created_at).toLocaleDateString()}</td>
                            <td>
                              {confirmingDeleteId === m.id ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Sure?</span>
                                  <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => confirmDelete(m.id)}
                                    disabled={deleting}
                                    style={{ padding: '4px', display: 'flex' }}
                                  >
                                    {deleting ? '...' : <Check size={14} />}
                                  </button>
                                  <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={cancelDelete}
                                    disabled={deleting}
                                    style={{ padding: '4px', display: 'flex' }}
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ) : (
                                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteModel(m.id)} style={{ padding: '6px', display: 'flex' }}><Trash2 size={16} /></button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state" style={{ padding: '40px' }}>
                <div className="empty-state-icon"><ArrowLeft size={48} color="var(--text-muted)"/></div>
                <div className="empty-state-text">Select a brand to view its models</div>
              </div>
            )}
          </div>
        </div>
      </AppLayout>

      {/* Add Brand Modal */}
      {showBrandModal && (
        <div className="modal-overlay" onClick={() => setShowBrandModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title"><PlusCircle size={24} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }}/> Add New Brand</h2>
            <form onSubmit={handleAddBrand}>
              {isTenantAdmin && (
                <div className="form-group">
                  <label className="form-label">Branch *</label>
                  <select className="form-select" value={newBrand.branchId} onChange={(e) => setNewBrand({ ...newBrand, branchId: e.target.value })}>
                    <option value="">Global (All Branches)</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Brand Name *</label>
                <input className="form-input" value={newBrand.name} onChange={(e) => setNewBrand({ ...newBrand, name: e.target.value })} placeholder="e.g. Apple, Samsung..." required autoFocus />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowBrandModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Brand</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
