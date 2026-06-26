'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';
import Pagination from '@/components/Pagination';
import { List, Plus, Search } from 'lucide-react';

export default function ServicesPage() {
  const { isFeatureEnabled, isTenantAdmin } = useAuth();
  const [services, setServices] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [branches, setBranches] = useState([]);

  const loadServices = (page = 1, params = {}) => {
    setLoading(true);
    const query = { page, ...params };
    if (statusFilter) query.status = statusFilter;
    if (branchFilter) query.branchId = branchFilter;

    api.getServices(query)
      .then((data) => {
        setServices(data.services);
        setPagination(data.pagination);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isTenantAdmin) {
      api.getBranches().then(data => setBranches(data.branches || []));
    }
  }, [isTenantAdmin]);

  useEffect(() => { loadServices(1); }, [statusFilter, branchFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      api.search({ q: searchQuery })
        .then((data) => {
          setServices(data.results);
          setPagination(data.pagination);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      loadServices(1);
    }
  };

  const statuses = ['', 'received', 'checking', 'waiting_for_parts', 'repaired', 'delivered', 'cancelled'];

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title"><List size={28} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }}/> Service List</h1>
          <p className="page-subtitle">{isTenantAdmin ? 'All job cards across your company' : 'All job cards for your shop'}</p>
        </div>
        {isFeatureEnabled('add_service') && (
          <Link href="/services/new" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Plus size={18}/> Add Service</Link>
        )}
      </div>

      {/* Search & Filter */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'end' }}>
          <form onSubmit={handleSearch} style={{ flex: 1, display: 'flex', gap: '8px' }}>
            <input
              className="form-input"
              placeholder="Search name, phone, IMEI, serial..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Search size={18}/> Search</button>
          </form>
          {isTenantAdmin && (
            <select
              className="form-select"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              style={{ width: '180px' }}
            >
              <option value="">All Branches</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          )}
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '180px' }}
          >
            {statuses.map((s) => (
              <option key={s} value={s}>{s ? s.replace(/_/g, ' ') : 'All Statuses'}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Services Table */}
      {loading ? (
        <div className="loading-screen" style={{ minHeight: '200px' }}><div className="spinner"></div></div>
      ) : services.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><List size={48} color="var(--text-muted)"/></div>
            <div className="empty-state-text">No services found</div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap" style={{ border: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  {isTenantAdmin && <th>Branch</th>}
                  <th>Serial #</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Device</th>
                  <th>Status</th>
                  <th>Technician</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s.id}>
                    {isTenantAdmin && <td>{s.branch_name}</td>}
                    <td><strong>{s.serial_number}</strong></td>
                    <td>{s.customer_name}</td>
                    <td>{s.customer_phone}</td>
                    <td>{s.brand_name} {s.model_name}</td>
                    <td><span className={`badge badge-${s.status}`}>{s.status.replace(/_/g, ' ')}</span></td>
                    <td>{s.assigned_technician || '—'}</td>
                    <td>{new Date(s.created_at).toLocaleDateString()}</td>
                    <td><Link href={`/services/${s.id}`} className="btn btn-ghost btn-sm">View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination pagination={pagination} onPageChange={(p) => loadServices(p)} />
        </div>
      )}
    </AppLayout>
  );
}
