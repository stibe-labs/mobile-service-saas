'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Pagination from '@/components/Pagination';
import { Wrench, ArrowRight } from 'lucide-react';

export default function TechnicianDashboardPage() {
  const { isTechnician, user } = useAuth();
  const [services, setServices] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (user && !isTechnician) {
      router.push('/dashboard');
    }
  }, [user, isTechnician, router]);

  const loadServices = (page = 1) => {
    setLoading(true);
    const query = { page };
    if (statusFilter) query.status = statusFilter;

    api.getServices(query)
      .then((data) => {
        setServices(data.services);
        setPagination(data.pagination);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadServices(1); }, [statusFilter]);

  if (!user || !isTechnician) return null;

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title"><Wrench size={28} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }}/> My Works</h1>
          <p className="page-subtitle">Welcome back, {user.full_name || user.fullName || user.email}. Here are your assigned jobs.</p>
        </div>
      </div>

      {/* Filter */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontWeight: '600' }}>Filter by Status:</span>
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '200px' }}
          >
            <option value="">All Statuses</option>
            <option value="received">Received</option>
            <option value="checking">Checking</option>
            <option value="waiting_for_parts">Waiting for Parts</option>
            <option value="repaired">Repaired</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>
      </div>

      {/* Service List */}
      {loading ? (
        <div className="loading-screen" style={{ minHeight: '300px' }}><div className="spinner"></div></div>
      ) : services.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><Wrench size={48} color="var(--text-muted)" /></div>
            <div className="empty-state-text">No jobs assigned to you yet</div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap" style={{ border: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Job ID</th>
                  <th>Device</th>
                  <th>Problem</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map((svc) => (
                  <tr key={svc.id}>
                    <td><strong>{svc.serial_number}</strong><br/><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(svc.received_date).toLocaleDateString()}</span></td>
                    <td>{svc.brand_name} {svc.model_name}</td>
                    <td style={{ maxWidth: '250px' }} className="truncate" title={svc.problem_description}>{svc.problem_description}</td>
                    <td><span className={`badge badge-${svc.status}`}>{svc.status?.replace(/_/g, ' ')}</span></td>
                    <td>
                      <Link href={`/services/${svc.id}`} className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>Update <ArrowRight size={14} /></Link>
                    </td>
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
