'use client';

import { useState, useEffect, useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';
import html2canvas from 'html2canvas';
import { BarChart2, Plus, ShoppingCart, DollarSign, Award, Calendar, FileText, X, Download, Printer } from 'lucide-react';

export default function SalesDashboard() {
  const { user } = useAuth();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  const receiptRef = useRef(null);

  const handleDownloadReceipt = async () => {
    if (!receiptRef.current) return;
    try {
      const canvas = await html2canvas(receiptRef.current, { scale: 2, backgroundColor: '#ffffff' });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `Receipt_${selectedSale?.imei_number || 'sale'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to download receipt', err);
    }
  };

  useEffect(() => {
    setLoading(true);
    api.getSales()
      .then(data => setSales(data.sales || []))
      .catch(err => setError(err.error || 'Failed to load sales data'))
      .finally(() => setLoading(false));
  }, []);

  const totalSalesValue = sales.reduce((sum, s) => sum + parseFloat(s.final_price), 0);
  const totalCommission = sales.reduce((sum, s) => sum + parseFloat(s.staff_commission), 0);
  const todaySales = sales.filter(s => new Date(s.created_at).toDateString() === new Date().toDateString());

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title"><BarChart2 size={28} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }}/> Sales Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.fullName || 'Sales Staff'}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/sales-dashboard/sale" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={18}/> Record New Sale
          </Link>
          <Link href="/sales-dashboard/inventory" className="btn btn-ghost">
            View Inventory
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-error">! {error}</div>}

      {loading ? (
        <div className="loading-screen" style={{ minHeight: '300px' }}><div className="spinner"></div></div>
      ) : (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-icon blue"><ShoppingCart size={24} /></div>
              <div>
                <div className="stat-value">{sales.length}</div>
                <div className="stat-label">Total Sales Recorded</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green"><DollarSign size={24} /></div>
              <div>
                <div className="stat-value">${totalSalesValue.toFixed(2)}</div>
                <div className="stat-label">Total Revenue</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon amber"><Award size={24} /></div>
              <div>
                <div className="stat-value">${totalCommission.toFixed(2)}</div>
                <div className="stat-label">My Commission</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon purple"><Calendar size={24} /></div>
              <div>
                <div className="stat-value">{todaySales.length}</div>
                <div className="stat-label">Sales Today</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title"><FileText size={20} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }}/> Recent Sales</div>
            </div>
            {sales.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-text">No sales recorded yet.</div>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Item/IMEI</th>
                      <th>Customer</th>
                      <th>Final Price</th>
                      <th>Commission</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((sale) => (
                      <tr key={sale.id}>
                        <td>{new Date(sale.created_at).toLocaleDateString()}</td>
                        <td>
                          <strong>{sale.brand_name} {sale.model_name}</strong>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>IMEI: {sale.imei_number}</div>
                        </td>
                        <td>
                          {sale.customer_name || 'Walk-in'}
                          {sale.customer_phone && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{sale.customer_phone}</div>}
                        </td>
                        <td>${parseFloat(sale.final_price).toFixed(2)}</td>
                        <td>${parseFloat(sale.staff_commission).toFixed(2)}</td>
                        <td>
                          <button className="btn btn-ghost btn-sm" onClick={() => setSelectedSale(sale)}>Print Receipt</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {selectedSale && (
            <div className="modal-overlay">
              <div className="modal-content" style={{ maxWidth: '400px' }}>
                <div className="modal-header">
                  <h3 className="modal-title">Sales Receipt</h3>
                  <button className="modal-close" onClick={() => setSelectedSale(null)} style={{ display: 'flex', alignItems: 'center' }}><X size={20}/></button>
                </div>
                <div className="modal-body" ref={receiptRef} style={{ fontFamily: 'monospace', fontSize: '0.9rem', padding: '20px', background: 'white' }}>
                  <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <h2>Mobile Service Shop</h2>
                    <p>Sale Receipt</p>
                    <p>Date: {new Date(selectedSale.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <p><strong>Customer:</strong> {selectedSale.customer_name || 'Walk-in'}</p>
                    <p><strong>Device:</strong> {selectedSale.brand_name} {selectedSale.model_name}</p>
                    <p><strong>IMEI:</strong> {selectedSale.imei_number}</p>
                    <hr style={{ margin: '10px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Final Price:</span>
                      <strong>${parseFloat(selectedSale.final_price).toFixed(2)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Payment Method:</span>
                      <span>{selectedSale.payment_method || 'Cash'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Staff:</span>
                      <span>{selectedSale.staff_name}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', marginTop: '30px' }}>
                    <p>Thank you for your purchase!</p>
                  </div>
                </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setSelectedSale(null)}>Close</button>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="button" className="btn btn-secondary" onClick={handleDownloadReceipt} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Download size={18}/> Download</button>
                    <button type="button" className="btn btn-primary" onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Printer size={18}/> Print</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
}
