'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Search } from 'lucide-react';

export default function RecordSalePage() {
  const router = useRouter();
  const [imeiQuery, setImeiQuery] = useState('');
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchError, setSearchError] = useState('');
  
  const [availableDevices, setAvailableDevices] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(true);

  const [inventoryItem, setInventoryItem] = useState(null);
  
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    branchMargin: 0,
    staffCommission: 0,
    paymentMethod: 'Cash'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadAvailableDevices();
  }, []);

  const loadAvailableDevices = async () => {
    setLoadingDevices(true);
    try {
      const data = await api.getInventory({ status: 'available' });
      setAvailableDevices(data.inventory || []);
    } catch (err) {
      console.error('Failed to load available devices', err);
    } finally {
      setLoadingDevices(false);
    }
  };

  const handleSelectDevice = (device) => {
    // Transform device into the expected inventoryItem shape for sales lookup if needed
    // The lookup API returns { id, brand_name, model_name, imei_number, category, condition_grade, base_price, status }
    // The inventory API returns { id, brand_name, model_name, imei_number, category, condition_grade, purchase_price, status }
    
    // Calculate base_price (which in lookup API is purchase_price + branch_margin).
    // For standard inventory API, let's just use purchase_price as base_price for now, or if it has base_price use it.
    const basePrice = parseFloat(device.base_price || device.purchase_price) || 0;
    
    setInventoryItem({
      ...device,
      base_price: basePrice
    });
    
    setImeiQuery('');
    setSearchError('');
    setFormData({
      ...formData,
      branchMargin: 0,
      staffCommission: 0
    });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!imeiQuery) return;
    
    setLoadingSearch(true);
    setSearchError('');
    setInventoryItem(null);
    
    try {
      const data = await api.lookupIMEI(imeiQuery);
      const item = data.device_info;
      
      if (!item) {
        setSearchError('No device found with this IMEI in the system.');
        return;
      }
      
      if (item.status !== 'available') {
        setSearchError(`This device is no longer available (Status: ${item.status}).`);
        return;
      }
      
      setInventoryItem(item);
      setFormData({
        ...formData,
        branchMargin: 0,
        staffCommission: 0
      });
    } catch (err) {
      setSearchError(err.error || 'Failed to lookup IMEI');
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleSaleSubmit = async (e) => {
    e.preventDefault();
    if (!inventoryItem) return;
    
    setIsSubmitting(true);
    try {
      const salePayload = {
        inventoryId: inventoryItem.id,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        branchMargin: parseFloat(formData.branchMargin) || 0,
        staffCommission: parseFloat(formData.staffCommission) || 0,
        paymentMethod: formData.paymentMethod
      };
      
      const res = await api.recordSale(salePayload);
      alert('Sale recorded successfully!');
      
      // Navigate to dashboard or receipt page
      router.push('/sales-dashboard');
    } catch (err) {
      alert(err.error || 'Failed to record sale');
      setIsSubmitting(false);
    }
  };

  const basePrice = parseFloat(inventoryItem?.base_price) || 0;
  const commission = parseFloat(formData.staffCommission) || 0;
  const finalPrice = basePrice + commission;

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title"><ShoppingCart size={28} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }}/> Record Sale</h1>
          <p className="page-subtitle">Process a device sale and calculate commissions</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px' }}>
        {/* Left Side: IMEI Lookup & Available Devices List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">1. Find Device</div>
            </div>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search by IMEI or Serial Number..."
                value={imeiQuery}
                onChange={(e) => setImeiQuery(e.target.value)}
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-primary" disabled={loadingSearch || !imeiQuery}>
                {loadingSearch ? 'Searching...' : 'Lookup'}
              </button>
            </form>
            {searchError && <div className="alert alert-error" style={{ marginTop: '15px' }}>{searchError}</div>}
          </div>

          <div className="card">
            <div className="card-header" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', marginBottom: '15px' }}>
              <div className="card-title">Available Inventory</div>
            </div>
            
            {loadingDevices ? (
              <div className="spinner" style={{ margin: '30px auto' }}></div>
            ) : availableDevices.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                No available devices in inventory.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto', paddingRight: '5px' }}>
                {availableDevices.map(device => (
                  <div 
                    key={device.id}
                    onClick={() => handleSelectDevice(device)}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '12px',
                      backgroundColor: inventoryItem?.id === device.id ? 'rgba(124, 58, 237, 0.1)' : 'var(--bg-input)',
                      border: `1px solid ${inventoryItem?.id === device.id ? 'var(--primary)' : 'var(--border-light)'}`,
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      if (inventoryItem?.id !== device.id) e.currentTarget.style.borderColor = 'var(--text-muted)';
                    }}
                    onMouseOut={(e) => {
                      if (inventoryItem?.id !== device.id) e.currentTarget.style.borderColor = 'var(--border-light)';
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '600', color: 'var(--text-main)', marginBottom: '4px' }}>
                        {device.brand_name} {device.model_name}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        IMEI: {device.imei_number} • {device.category} • Grade: {device.condition_grade || 'N/A'}
                      </div>
                    </div>
                    <div style={{ fontWeight: 'bold', color: 'var(--text-main)', fontSize: '1.1rem' }}>
                      ${parseFloat(device.base_price || device.purchase_price).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Sale Form */}
        <div>
          {inventoryItem ? (
            <div className="card">
              <div className="card-header">
                <div className="card-title">2. Sale Details</div>
              </div>
              <form onSubmit={handleSaleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                <div style={{ backgroundColor: 'rgba(124, 58, 237, 0.05)', padding: '15px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Selected Device</div>
                  <div style={{ fontWeight: '600', fontSize: '1.1rem', color: 'var(--text-main)' }}>{inventoryItem.brand_name} {inventoryItem.model_name}</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>IMEI: {inventoryItem.imei_number}</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group">
                    <label className="form-label">Customer Name</label>
                    <input type="text" className="form-input" value={formData.customerName} onChange={(e) => setFormData({...formData, customerName: e.target.value})} placeholder="Optional" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Customer Phone</label>
                    <input type="text" className="form-input" value={formData.customerPhone} onChange={(e) => setFormData({...formData, customerPhone: e.target.value})} placeholder="Optional" />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <select className="form-select" value={formData.paymentMethod} onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}>
                    <option value="Cash">Cash</option>
                    <option value="Card">Credit/Debit Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>

                <hr style={{ borderColor: 'var(--border-light)', margin: '5px 0' }} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
                  <div className="form-group">
                    <label className="form-label">Your Commission ($)</label>
                    <input type="number" step="0.01" className="form-input" required value={formData.staffCommission} onChange={(e) => setFormData({...formData, staffCommission: e.target.value})} />
                  </div>
                </div>

                <div style={{ backgroundColor: 'var(--bg-base)', padding: '20px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Base Price (inc. Margin):</span>
                    <span>${basePrice.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Staff Commission:</span>
                    <span style={{ color: 'var(--accent)' }}>+ ${commission.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '15px', fontSize: '1.2rem', fontWeight: 'bold' }}>
                    <span>Final Sale Price:</span>
                    <span style={{ color: 'var(--primary)' }}>${finalPrice.toFixed(2)}</span>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Processing...' : `Complete Sale ($${finalPrice.toFixed(2)})`}
                </button>
              </form>
            </div>
          ) : (
            <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '300px', backgroundColor: 'var(--bg-input)' }}>
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ marginBottom: '10px' }}><Search size={48} /></div>
                <p>Lookup or select a device to begin the sale process.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
