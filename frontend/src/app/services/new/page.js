'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { PlusCircle, ArrowLeft, Save } from 'lucide-react';

export default function NewServicePage() {
  const { isTenantAdmin } = useAuth();
  const router = useRouter();
  const [branches, setBranches] = useState([]);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    branchId: '', customerName: '', customerPhone: '', brandId: '', modelId: '',
    imeiNumber: '', problemDescription: '', assignedTechnician: '', assignedTechnicianId: '', advancePayment: '',
  });

  const handleTechnicianChange = (id) => {
    const tech = technicians.find(t => t.id === id);
    setForm({ ...form, assignedTechnicianId: id, assignedTechnician: tech ? tech.name : '' });
  };

  useEffect(() => {
    if (isTenantAdmin) {
      api.getBranches().then(data => setBranches(data.branches || [])).catch(() => {});
    }
  }, [isTenantAdmin]);

  useEffect(() => {
    // Only fetch if branchUser or (tenantAdmin && branchId selected)
    if (!isTenantAdmin || (isTenantAdmin && form.branchId)) {
      const query = form.branchId ? { branchId: form.branchId } : {};
      Promise.all([
        api.getAllBrandsWithModels(query),
        api.getTechnicians(query)
      ]).then(([brandsData, techsData]) => {
        setBrands(brandsData.brandsWithModels || []);
        setTechnicians(techsData.technicians || []);
        // Reset selections if branch changed
        setForm(prev => ({ ...prev, brandId: '', modelId: '', assignedTechnician: '', assignedTechnicianId: '' }));
      }).catch(() => {});
    }
  }, [form.branchId, isTenantAdmin]);

  const handleBrandChange = (brandId) => {
    setForm({ ...form, brandId, modelId: '' });
    const brand = brands.find((b) => b.brand_id === brandId);
    setModels(brand ? brand.models : []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await api.createService(form);
      router.push(`/services/${result.service.id}`);
    } catch (err) {
      setError(err.error || 'Failed to create service');
      setLoading(false);
    }
  };

  const update = (field, value) => setForm({ ...form, [field]: value });

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title"><PlusCircle size={28} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }}/> Add New Service</h1>
          <p className="page-subtitle">Create a new job card</p>
        </div>
        <button className="btn btn-ghost" onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><ArrowLeft size={16}/> Back</button>
      </div>

      {error && <div className="alert alert-error">! {error}</div>}

      <div className="card">
        <form onSubmit={handleSubmit}>
          {isTenantAdmin && (
            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label className="form-label">Select Branch *</label>
              <select className="form-select" value={form.branchId || ''} onChange={(e) => update('branchId', e.target.value)} required>
                <option value="">Select a branch...</option>
                {branches.map(b => <option key={b.id} value={b.id || ''}>{b.name}</option>)}
              </select>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Customer Name *</label>
              <input className="form-input" value={form.customerName || ''} onChange={(e) => update('customerName', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Customer Phone *</label>
              <input className="form-input" value={form.customerPhone || ''} onChange={(e) => update('customerPhone', e.target.value)} required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Brand</label>
              <select className="form-select" value={form.brandId || ''} onChange={(e) => handleBrandChange(e.target.value)}>
                <option value="">Select brand...</option>
                {brands.map((b) => <option key={b.brand_id} value={b.brand_id || ''}>{b.brand_name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Model</label>
              <select className="form-select" value={form.modelId || ''} onChange={(e) => update('modelId', e.target.value)} disabled={!form.brandId}>
                <option value="">Select model...</option>
                {models.map((m) => <option key={m.id} value={m.id || ''}>{m.name}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">IMEI Number</label>
              <input className="form-input" value={form.imeiNumber || ''} onChange={(e) => update('imeiNumber', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Assigned Technician</label>
              <select className="form-select" value={form.assignedTechnicianId || ''} onChange={(e) => handleTechnicianChange(e.target.value)}>
                <option value="">Select Technician...</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Advance Payment (₹)</label>
              <input type="number" step="0.01" min="0" className="form-input" value={form.advancePayment || ''} onChange={(e) => update('advancePayment', e.target.value)} placeholder="0.00" />
            </div>
            <div className="form-group" style={{ visibility: 'hidden' }}>
              <label className="form-label">Placeholder</label>
              <input className="form-input" disabled />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Problem Description *</label>
            <textarea className="form-textarea" value={form.problemDescription || ''} onChange={(e) => update('problemDescription', e.target.value)} placeholder="Describe the problem..." required />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={() => router.back()}>Cancel</button>
            <button type="submit" className="btn btn-success" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {loading ? 'Creating...' : <><Save size={18}/> Save Job Card</>}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
