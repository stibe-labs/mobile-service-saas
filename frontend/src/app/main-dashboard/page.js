'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';
import { Globe, ShoppingCart, DollarSign, TrendingUp, Award } from 'lucide-react';

export default function MainDashboardPage() {
  const [salesData, setSalesData] = useState(null);
  const [commissionsData, setCommissionsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [salesRes, commRes] = await Promise.all([
        api.getSalesAnalytics(),
        api.getCommissionsAnalytics()
      ]);
      setSalesData(salesRes);
      setCommissionsData(commRes);
    } catch (err) {
      setError(err.error || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="loading-screen" style={{ minHeight: '400px' }}><div className="spinner"></div></div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title"><Globe size={28} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }}/> Cross-Branch Analytics</h1>
          <p className="page-subtitle">Consolidated view of company-wide sales and profits</p>
        </div>
      </div>

      {error && <div className="alert alert-error">! {error}</div>}

      {salesData && salesData.overall && (
        <div className="stat-grid" style={{ marginBottom: '30px' }}>
          <div className="stat-card">
            <div className="stat-icon blue"><ShoppingCart size={24} /></div>
            <div>
              <div className="stat-value">{salesData.overall.total_sales}</div>
              <div className="stat-label">Total Units Sold</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green"><DollarSign size={24} /></div>
            <div>
              <div className="stat-value">${parseFloat(salesData.overall.total_revenue).toFixed(2)}</div>
              <div className="stat-label">Total Revenue</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon amber"><TrendingUp size={24} /></div>
            <div>
              <div className="stat-value">${parseFloat(salesData.overall.total_branch_profit).toFixed(2)}</div>
              <div className="stat-label">Total Branch Profit</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon purple"><Award size={24} /></div>
            <div>
              <div className="stat-value">${parseFloat(salesData.overall.total_commissions).toFixed(2)}</div>
              <div className="stat-label">Total Commissions Paid</div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* Sales by Branch */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Sales by Branch</div>
          </div>
          {salesData?.by_branch?.length === 0 ? (
            <div className="empty-state">No branch sales data available.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Branch</th>
                  <th>Units</th>
                  <th>Revenue</th>
                  <th>Profit</th>
                </tr>
              </thead>
              <tbody>
                {salesData?.by_branch?.map((b, i) => (
                  <tr key={i}>
                    <td><strong>{b.branch_name}</strong></td>
                    <td>{b.units_sold}</td>
                    <td>${parseFloat(b.revenue).toFixed(2)}</td>
                    <td style={{ color: 'var(--success)' }}>${parseFloat(b.profit).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Top Selling Models */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Top Selling Models</div>
          </div>
          {salesData?.top_models?.length === 0 ? (
            <div className="empty-state">No sales data available.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Model</th>
                  <th>Units</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {salesData?.top_models?.map((m, i) => (
                  <tr key={i}>
                    <td><strong>{m.brand_name} {m.model_name}</strong></td>
                    <td>{m.units_sold}</td>
                    <td>${parseFloat(m.revenue).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Commissions by Staff */}
      <div className="card" style={{ marginTop: '30px' }}>
        <div className="card-header">
          <div className="card-title">Top Staff Commissions</div>
        </div>
        {commissionsData?.commissions?.length === 0 ? (
          <div className="empty-state">No commission data available.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Staff Name</th>
                <th>Branch</th>
                <th>Sales w/ Commission</th>
                <th>Total Earned</th>
              </tr>
            </thead>
            <tbody>
              {commissionsData?.commissions?.map((c, i) => (
                <tr key={i}>
                  <td><strong>{c.staff_name}</strong></td>
                  <td>{c.branch_name}</td>
                  <td>{c.total_sales_with_commission}</td>
                  <td style={{ color: 'var(--accent)' }}>${parseFloat(c.total_commission_earned).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppLayout>
  );
}
