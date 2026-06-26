'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';
import { Package, Plus, X } from 'lucide-react';

export default function InventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Add modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    brandId: '',
    modelId: '',
    category: 'new',
    conditionGrade: '',
    imeiNumber: '',
    quantity: 1,
    purchasePrice: 0,
    supplier: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invRes, brandsRes] = await Promise.all([
        api.getInventory(),
        api.getAllBrandsWithModels()
      ]);
      setInventory(invRes.inventory || []);
      setBrands(brandsRes.brandsWithModels || brandsRes.brands || []);
    } catch (err) {
      setError(err.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleBrandChange = (e) => {
    const brandId = e.target.value;
    setFormData({ ...formData, brandId, modelId: '' });
    const selectedBrand = brands.find(b => String(b.id || b.brand_id) === String(brandId));
    setModels(selectedBrand ? selectedBrand.models : []);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.addInventory(formData);
      setShowAddModal(false);
      setFormData({
        brandId: '', modelId: '', category: 'new', conditionGrade: '',
        imeiNumber: '', quantity: 1, purchasePrice: 0, supplier: '', notes: ''
      });
      fetchData();
    } catch (err) {
      alert(err.error || 'Failed to add item');
    }
  };

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title"><Package size={28} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }}/> Inventory Management</h1>
          <p className="page-subtitle">Manage stock of phones and devices</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={18}/> Add Stock
        </button>
      </div>

      {error && <div className="alert alert-error">! {error}</div>}

      <div className="card">
        <div className="card-header">
          <div className="card-title">Current Stock</div>
        </div>
        {loading ? (
          <div className="loading-screen" style={{ minHeight: '200px' }}><div className="spinner"></div></div>
        ) : inventory.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-text">No inventory items found.</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>IMEI / Serial</th>
                  <th>Device</th>
                  <th>Category / Cond.</th>
                  <th>Purchase Price</th>
                  <th>Status</th>
                  <th>Added</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.imei_number}</strong></td>
                    <td>{item.brand_name} {item.model_name}</td>
                    <td>
                      <span style={{ textTransform: 'capitalize' }}>{item.category}</span>
                      {item.condition_grade && ` / Grade ${item.condition_grade}`}
                    </td>
                    <td>${parseFloat(item.purchase_price).toFixed(2)}</td>
                    <td>
                      <span className={`badge ${item.status === 'available' ? 'badge-received' : 'badge-delivered'}`}>
                        {item.status.toUpperCase()}
                      </span>
                    </td>
                    <td>{new Date(item.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Stock Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Add Stock</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)} style={{ display: 'flex', alignItems: 'center' }}><X size={20}/></button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group">
                    <label className="form-label">Brand</label>
                    <select className="form-select" required value={formData.brandId} onChange={handleBrandChange}>
                      <option value="">Select Brand</option>
                      {brands.map((b, idx) => {
                        const id = b.id || b.brand_id;
                        const name = b.name || b.brand_name;
                        return <option key={id || idx} value={id}>{name}</option>;
                      })}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Model</label>
                    <select className="form-select" required value={formData.modelId} onChange={(e) => setFormData({...formData, modelId: e.target.value})} disabled={!formData.brandId}>
                      <option value="">Select Model</option>
                      {models.map((m, idx) => (
                        <option key={m.id || idx} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">IMEI / Serial Number</label>
                  <input type="text" className="form-input" required value={formData.imeiNumber} onChange={(e) => setFormData({...formData, imeiNumber: e.target.value})} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select className="form-select" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                      <option value="new">New</option>
                      <option value="used">Used</option>
                      <option value="refurbished">Refurbished</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Condition Grade</label>
                    <input type="text" className="form-input" placeholder="e.g. A+, B" value={formData.conditionGrade} onChange={(e) => setFormData({...formData, conditionGrade: e.target.value})} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group">
                    <label className="form-label">Purchase Price ($)</label>
                    <input type="number" step="0.01" className="form-input" required value={formData.purchasePrice} onChange={(e) => setFormData({...formData, purchasePrice: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Supplier</label>
                    <input type="text" className="form-input" value={formData.supplier} onChange={(e) => setFormData({...formData, supplier: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save to Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
