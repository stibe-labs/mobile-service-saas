'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { DollarSign, Check } from 'lucide-react';

export default function PricingSettingsPage() {
  const { isTenantAdmin, isMainBranchManager } = useAuth();
  const [branches, setBranches] = useState([]);
  const [branchFilter, setBranchFilter] = useState('');
  
  const [marginsData, setMarginsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Local state for edits
  const [editedMargins, setEditedMargins] = useState({});

  useEffect(() => {
    if (isTenantAdmin || isMainBranchManager) {
      api.getBranches().then(res => {
        setBranches(res.branches || []);
        if (res.branches && res.branches.length > 0) {
          setBranchFilter(res.branches[0].id);
        }
      }).catch(() => {});
    } else {
      // Sub-branch manager, backend uses their branchId automatically
      loadPricing(null);
    }
  }, [isTenantAdmin, isMainBranchManager]);

  useEffect(() => { 
    if ((isTenantAdmin || isMainBranchManager) && branchFilter) {
      loadPricing(branchFilter); 
    }
  }, [branchFilter, isTenantAdmin, isMainBranchManager]);

  const loadPricing = (branchId) => {
    setLoading(true);
    setError('');
    setSuccess('');
    api.getPricing(branchId)
      .then((data) => {
        setMarginsData(data.margins || []);
        const initialEdits = {};
        (data.margins || []).forEach(m => {
          initialEdits[m.model_id] = {
            new: m.margin_new || 0,
            used: m.margin_used || 0,
            refurbished: m.margin_refurbished || 0
          };
        });
        setEditedMargins(initialEdits);
      })
      .catch((err) => setError(err.error || 'Failed to load pricing margins.'))
      .finally(() => setLoading(false));
  };

  const handleMarginChange = (modelId, type, value) => {
    setEditedMargins(prev => ({
      ...prev,
      [modelId]: {
        ...prev[modelId],
        [type]: value
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const marginsArray = Object.keys(editedMargins).map(modelId => ({
        modelId,
        marginNew: Number(editedMargins[modelId].new) || 0,
        marginUsed: Number(editedMargins[modelId].used) || 0,
        marginRefurbished: Number(editedMargins[modelId].refurbished) || 0
      }));
      
      await api.updatePricing(branchFilter, marginsArray);
      setSuccess('Pricing settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.error || 'Failed to save pricing settings.');
    } finally {
      setSaving(false);
    }
  };

  // Group by brand
  const groupedMargins = marginsData.reduce((acc, item) => {
    const brandName = item.brand_name || 'Unknown Brand';
    if (!acc[brandName]) acc[brandName] = [];
    acc[brandName].push(item);
    return acc;
  }, {});

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title"><DollarSign size={28} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }}/> Pricing Settings</h1>
          <p className="page-subtitle">Configure separate margins for new, used, and refurbished models.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {(isTenantAdmin || isMainBranchManager) && (
            <select className="form-select" value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} style={{ width: '200px' }}>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || loading}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">! {error}</div>}
      {success && <div className="alert alert-success" style={{ background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} /> {success}</div>}

      <div className="card">
        {loading ? (
          <div className="spinner" style={{ margin: '40px auto' }}></div>
        ) : marginsData.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px' }}>
            <div className="empty-state-text">No device models found for this branch. Please add models first.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {Object.keys(groupedMargins).sort().map(brandName => (
              <div key={brandName}>
                <h3 style={{ marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', color: '#0f172a' }}>{brandName}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '16px' }}>
                  {groupedMargins[brandName].map(model => (
                    <div key={model.model_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', transition: 'all 0.2s', cursor: 'default' }} onMouseOver={(e) => { e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)'}} onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'}}>
                      <div style={{ fontWeight: '600', color: '#334155' }}>{model.model_name}</div>
                      
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', color: '#64748b', fontWeight: '500' }}>
                          New Margin $
                          <input 
                            type="number"
                            className="form-input" 
                            style={{ width: '85px', textAlign: 'right', fontWeight: '600', color: '#0f172a', padding: '6px' }}
                            value={editedMargins[model.model_id]?.new !== undefined ? editedMargins[model.model_id].new : ''}
                            onChange={(e) => handleMarginChange(model.model_id, 'new', e.target.value)}
                          />
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', color: '#64748b', fontWeight: '500' }}>
                          Used Margin $
                          <input 
                            type="number"
                            className="form-input" 
                            style={{ width: '85px', textAlign: 'right', fontWeight: '600', color: '#0f172a', padding: '6px' }}
                            value={editedMargins[model.model_id]?.used !== undefined ? editedMargins[model.model_id].used : ''}
                            onChange={(e) => handleMarginChange(model.model_id, 'used', e.target.value)}
                          />
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', color: '#64748b', fontWeight: '500' }}>
                          Refurb Margin $
                          <input 
                            type="number"
                            className="form-input" 
                            style={{ width: '85px', textAlign: 'right', fontWeight: '600', color: '#0f172a', padding: '6px' }}
                            value={editedMargins[model.model_id]?.refurbished !== undefined ? editedMargins[model.model_id].refurbished : ''}
                            onChange={(e) => handleMarginChange(model.model_id, 'refurbished', e.target.value)}
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
