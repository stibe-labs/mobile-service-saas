'use client';

import { useState, useEffect, use } from 'react';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';

const STATUS_OPTIONS = ['received', 'checking', 'waiting_for_parts', 'repaired', 'delivered', 'cancelled'];

export default function ServiceDetailPage({ params }) {
  const { isFeatureEnabled, isTechnician } = useAuth();
  const { id } = use(params);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Status update
  const [newStatus, setNewStatus] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  // Add note
  const [noteType, setNoteType] = useState('technician');
  const [noteContent, setNoteContent] = useState('');

  // Add part
  const [partSource, setPartSource] = useState('shop');
  const [partForm, setPartForm] = useState({ partId: '', partName: '', quantity: 1, costAtTime: 0, sellingPriceAtTime: 0 });
  const [shopParts, setShopParts] = useState([]);

  const loadService = () => {
    api.getService(id)
      .then(setData)
      .catch((err) => setError(err.error || 'Failed to load service'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadService(); }, [id]);
  useEffect(() => {
    if (isFeatureEnabled('parts_management')) {
      api.getParts().then((d) => setShopParts(d.parts)).catch(() => {});
    } else {
      setPartSource('outside');
    }
  }, [isFeatureEnabled]);

  const handleStatusUpdate = async () => {
    if (!newStatus) return;
    setError(''); setSuccess('');
    try {
      await api.updateServiceStatus(id, newStatus, cancelReason);
      setSuccess(`Status updated to "${newStatus}"`);
      setNewStatus(''); setCancelReason('');
      loadService();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.error); }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    try {
      await api.addServiceNote(id, noteType, noteContent);
      setNoteContent('');
      loadService();
    } catch (err) { setError(err.error); }
  };

  const handleAddPart = async (e) => {
    e.preventDefault();
    try {
      await api.addServicePart(id, { source: partSource, ...partForm });
      setPartForm({ partId: '', partName: '', quantity: 1, costAtTime: 0, sellingPriceAtTime: 0 });
      loadService();
    } catch (err) { setError(err.error); }
  };

  const handleRemovePart = async (spId) => {
    try {
      await api.removeServicePart(id, spId);
      loadService();
    } catch (err) { setError(err.error); }
  };

  if (loading) return <AppLayout><div className="loading-screen" style={{ minHeight: '400px' }}><div className="spinner"></div></div></AppLayout>;

  const svc = data?.service;
  const isFinished = svc?.status === 'delivered' || svc?.status === 'cancelled';

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">≡ {svc?.serial_number}</h1>
          <p className="page-subtitle">Service Detail / Update</p>
        </div>
        <Link href="/services" className="btn btn-ghost">← Back to List</Link>
      </div>

      {error && <div className="alert alert-error">! {error}</div>}
      {success && <div className="alert alert-success">+ {success}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
        {/* Left Column — Info */}
        <div>
          {/* Job Card Info */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card-title" style={{ marginBottom: '14px' }}>👁️ Job Card Details</div>
            <div style={{ display: 'grid', gap: '8px', fontSize: '0.85rem' }}>
              <div><span style={{ color: 'var(--text-muted)' }}>Customer:</span> <strong>{svc?.customer_name}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Phone:</span> {svc?.customer_phone}</div>
              <div><span style={{ color: 'var(--text-muted)' }}>Device:</span> {svc?.brand_name} {svc?.model_name}</div>
              <div><span style={{ color: 'var(--text-muted)' }}>IMEI:</span> {svc?.imei_number || '—'}</div>
              <div><span style={{ color: 'var(--text-muted)' }}>Problem:</span> {svc?.problem_description}</div>
              <div><span style={{ color: 'var(--text-muted)' }}>Technician:</span> {svc?.assigned_technician || '—'}</div>
              {!isTechnician && <div><span style={{ color: 'var(--text-muted)' }}>Advance Payment:</span> ₹{svc?.advance_payment || '0.00'}</div>}
              <div><span style={{ color: 'var(--text-muted)' }}>Received:</span> {new Date(svc?.received_date).toLocaleString()}</div>
              <div><span style={{ color: 'var(--text-muted)' }}>Status:</span> <span className={`badge badge-${svc?.status}`}>{svc?.status?.replace(/_/g, ' ')}</span></div>
            </div>
          </div>

          {/* Status Update */}
          {!isFinished && isFeatureEnabled('service_status_update') && (
            <div className="card" style={{ marginBottom: '20px' }}>
              <div className="card-title" style={{ marginBottom: '14px' }}>⟳ Update Status</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <select className="form-select" value={newStatus} onChange={(e) => setNewStatus(e.target.value)} style={{ flex: 1 }}>
                  <option value="">Select status...</option>
                  {STATUS_OPTIONS.filter((s) => s !== svc?.status).map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                  ))}
                </select>
                <button className="btn btn-primary btn-sm" onClick={handleStatusUpdate} disabled={!newStatus}>Update</button>
              </div>
              {newStatus === 'cancelled' && (
                <div className="form-group" style={{ marginTop: '10px' }}>
                  <input className="form-input" placeholder="Cancellation reason..." value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
                </div>
              )}
            </div>
          )}

          {/* Service History */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: '14px' }}>📜 Service History</div>
            {data?.history?.length === 0 ? (
              <div className="empty-state" style={{ padding: '20px' }}><div className="empty-state-text">No history yet</div></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {data?.history?.map((h) => (
                  <div key={h.id} style={{ fontSize: '0.78rem', padding: '8px 12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                    <span className={`badge badge-${h.to_status}`} style={{ marginRight: '8px' }}>{h.to_status?.replace(/_/g, ' ')}</span>
                    {h.from_status && <span style={{ color: 'var(--text-muted)' }}>from {h.from_status?.replace(/_/g, ' ')} </span>}
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>— {h.changed_by_name} · {new Date(h.created_at).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column — Parts & Notes */}
        <div>
          {/* Parts Used */}
          {!isTechnician && (
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card-title" style={{ marginBottom: '14px' }}>⚙ Parts Used</div>
            {data?.parts?.length > 0 && (
              <div className="table-wrap" style={{ marginBottom: '14px' }}>
                <table className="table">
                  <thead><tr><th>Part</th><th>Source</th><th>Qty</th><th>Cost</th><th></th></tr></thead>
                  <tbody>
                    {data.parts.map((p) => (
                      <tr key={p.id}>
                        <td>{p.part_name}</td>
                        <td><span className={`badge ${p.source === 'shop' ? 'badge-active' : 'badge-checking'}`}>{p.source}</span></td>
                        <td>{p.quantity}</td>
                        <td>{p.cost_at_time}</td>
                        <td>{!isFinished && <button className="btn btn-danger btn-sm" onClick={() => handleRemovePart(p.id)}>✕</button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {/* Add Part Form */}
            {!isFinished && isFeatureEnabled('add_part') && (
              <form onSubmit={handleAddPart}>
                {isFeatureEnabled('parts_management') && (
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <label style={{ display: 'flex', gap: '4px', alignItems: 'center', fontSize: '0.78rem', cursor: 'pointer' }}>
                      <input type="radio" name="source" value="shop" checked={partSource === 'shop'} onChange={() => setPartSource('shop')} /> Shop Part
                    </label>
                    <label style={{ display: 'flex', gap: '4px', alignItems: 'center', fontSize: '0.78rem', cursor: 'pointer' }}>
                      <input type="radio" name="source" value="outside" checked={partSource === 'outside'} onChange={() => setPartSource('outside')} /> Outside Purchase
                    </label>
                  </div>
                )}

                {partSource === 'shop' ? (
                  <select className="form-select" value={partForm.partId} onChange={(e) => setPartForm({ ...partForm, partId: e.target.value })} required>
                    <option value="">Select part...</option>
                    {shopParts.map((p) => <option key={p.id} value={p.id}>{p.name} (₹{p.selling_price})</option>)}
                  </select>
                ) : (
                  <div className="form-row" style={{ marginBottom: '0' }}>
                    <input className="form-input" placeholder="Part name" value={partForm.partName} onChange={(e) => setPartForm({ ...partForm, partName: e.target.value })} required />
                    <input className="form-input" type="number" placeholder="Cost" value={partForm.costAtTime} onChange={(e) => setPartForm({ ...partForm, costAtTime: parseFloat(e.target.value) })} required />
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <input className="form-input" type="number" min="1" placeholder="Qty" value={partForm.quantity} onChange={(e) => setPartForm({ ...partForm, quantity: parseInt(e.target.value) })} style={{ width: '80px' }} />
                  <button type="submit" className="btn btn-primary btn-sm">+ Add Part</button>
                </div>
              </form>
            )}
          </div>
          )}

          {/* Notes */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: '14px' }}>✎ Notes</div>
            {data?.notes?.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                {data.notes.map((n) => (
                  <div key={n.id} style={{ fontSize: '0.8rem', padding: '10px 12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span className="badge badge-received">{n.note_type}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{n.author_name} · {new Date(n.created_at).toLocaleString()}</span>
                    </div>
                    <div style={{ color: 'var(--text-secondary)' }}>{n.content}</div>
                  </div>
                ))}
              </div>
            )}

            {!isFinished && (
              <form onSubmit={handleAddNote}>
                <select className="form-select" value={noteType} onChange={(e) => setNoteType(e.target.value)} style={{ marginBottom: '8px' }}>
                  <option value="technician">Technician Note</option>
                  <option value="repair">Repair Note</option>
                  <option value="customer_approval">Customer Approval</option>
                  <option value="delivery">Delivery Note</option>
                </select>
                <textarea className="form-textarea" placeholder="Add a note..." value={noteContent} onChange={(e) => setNoteContent(e.target.value)} style={{ minHeight: '60px' }} />
                <button type="submit" className="btn btn-primary btn-sm" style={{ marginTop: '8px' }}>✎ Add Note</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
