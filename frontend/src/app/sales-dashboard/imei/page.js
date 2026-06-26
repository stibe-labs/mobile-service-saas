'use client';

import { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';
import { Search } from 'lucide-react';

export default function ImeiLookupPage() {
  const [imeiQuery, setImeiQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!imeiQuery) return;
    
    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      const data = await api.lookupIMEI(imeiQuery);
      setResult(data);
    } catch (err) {
      setError(err.error || 'Failed to lookup IMEI');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title"><Search size={28} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }}/> Universal IMEI Lookup</h1>
          <p className="page-subtitle">Track the lifecycle of any device across the company</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '15px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Enter IMEI or Serial Number..."
            value={imeiQuery}
            onChange={(e) => setImeiQuery(e.target.value)}
            required
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
        {error && <div className="alert alert-error" style={{ marginTop: '15px' }}>{error}</div>}
      </div>

      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Current Status */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Device Overview</div>
            </div>
            {result.device_info ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div><strong>Brand & Model:</strong> {result.device_info.brand_name} {result.device_info.model_name}</div>
                <div><strong>Current Location:</strong> {result.device_info.branch_name}</div>
                <div><strong>Status:</strong> <span className="badge badge-received">{result.device_info.status.toUpperCase()}</span></div>
                <div><strong>Category:</strong> <span style={{ textTransform: 'capitalize' }}>{result.device_info.category}</span></div>
                {result.device_info.purchase_price && (
                  <div><strong>Purchase Price:</strong> ${parseFloat(result.device_info.purchase_price).toFixed(2)}</div>
                )}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-text">No inventory record found for this IMEI.</div>
              </div>
            )}
          </div>

          {/* Sales History */}
          {result.device_info && result.device_info.sale_id && (
            <div className="card" style={{ borderLeft: '4px solid var(--accent)' }}>
              <div className="card-header">
                <div className="card-title">Sales Record</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div><strong>Sold On:</strong> {new Date(result.device_info.sale_date).toLocaleDateString()}</div>
                <div><strong>Final Price:</strong> ${parseFloat(result.device_info.sale_final_price).toFixed(2)}</div>
                <div><strong>Sales Staff:</strong> {result.device_info.sales_staff_name}</div>
              </div>
            </div>
          )}

          {/* Repair History */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Repair History</div>
            </div>
            {result.repair_history.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-text">No repair history found for this device.</div>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date Received</th>
                      <th>Problem</th>
                      <th>Status</th>
                      <th>Branch</th>
                      <th>Technician</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.repair_history.map(repair => (
                      <tr key={repair.id}>
                        <td>{new Date(repair.received_date).toLocaleDateString()}</td>
                        <td>{repair.problem_description}</td>
                        <td><span className={`badge badge-${repair.status}`}>{repair.status.replace(/_/g, ' ')}</span></td>
                        <td>{repair.branch_name}</td>
                        <td>{repair.technician_name || 'Unassigned'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
