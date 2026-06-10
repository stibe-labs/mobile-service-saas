export default function Pagination({ pagination, onPageChange }) {
  if (!pagination || !pagination.pages || pagination.pages <= 1) return null;

  const { current_page, pages, total } = pagination;

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderTop: '1px solid var(--border-light)', background: 'var(--card-bg)', borderRadius: '0 0 var(--radius-lg) var(--radius-lg)' }}>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        Showing page <strong>{current_page}</strong> of <strong>{pages}</strong> ({total} total items)
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button 
          className="btn btn-ghost btn-sm" 
          onClick={() => onPageChange(current_page - 1)}
          disabled={current_page <= 1}
        >
          &laquo; Prev
        </button>
        <button 
          className="btn btn-ghost btn-sm" 
          onClick={() => onPageChange(current_page + 1)}
          disabled={current_page >= pages}
        >
          Next &raquo;
        </button>
      </div>
    </div>
  );
}
