import { useState, useEffect, useCallback } from 'react';
import { transactionsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const STATUS_COLORS = { Pending: 'warning', Dikonfirmasi: 'info', Diproses: 'info', 'Sedang Dikirim': 'primary', 'Siap Diambil': 'primary', Selesai: 'success', Dibatalkan: 'danger' };
const ALL_STATUS = ['', 'Pending', 'Dikonfirmasi', 'Diproses', 'Sedang Dikirim', 'Siap Diambil', 'Selesai', 'Dibatalkan'];

export default function TransaksiPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (status) params.status = status;
      const res = await transactionsAPI.getAll(params);
      setTransactions(res.data.data);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch { } finally { setLoading(false); }
  }, [page, status]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await transactionsAPI.updateStatus(id, newStatus);
      toast.success(`Status diperbarui: ${newStatus}`);
      fetch();
      setSelected(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal update status.'); }
  };

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div className="page-header-left">
          <h1>🧾 {user?.role === 'Pasien' ? 'Riwayat Pesanan' : 'Manajemen Transaksi'}</h1>
          <p>Total {total} transaksi ditemukan</p>
        </div>
      </div>

      {/* Filter */}
      <div className="filter-bar" style={{ marginBottom: 16 }}>
        {ALL_STATUS.map(s => (
          <button key={s} className={`filter-chip ${status === s ? 'active' : ''}`} onClick={() => { setStatus(s); setPage(1); }}>
            {s || 'Semua Status'}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          {loading ? (
            <div className="loading-overlay"><div className="spinner"></div><p>Memuat...</p></div>
          ) : transactions.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">🧾</div><h3>Tidak ada transaksi</h3></div>
          ) : (
            <table>
              <thead><tr>
                <th>Invoice</th><th>Pelanggan</th><th>Items</th>
                <th>Total</th><th>Pembayaran</th><th>Pengiriman</th><th>Resep</th><th>Status</th><th>Waktu</th>
                {(user?.role === 'Admin' || user?.role === 'Kasir') && <th>Aksi</th>}
              </tr></thead>
              <tbody>
                {transactions.map(trx => (
                  <tr key={trx.id}>
                    <td><code style={{ fontSize: '0.78rem', color: 'var(--primary)' }}>{trx.invoiceNumber}</code></td>
                    <td>{trx.user?.fullName || trx.user?.username || '-'}</td>
                    <td>{trx.items?.length || 0} item</td>
                    <td><strong>Rp {parseFloat(trx.totalAmount).toLocaleString('id-ID')}</strong></td>
                    <td>{trx.paymentMethod}</td>
                    <td>
                      <span className="badge badge-muted" style={{fontSize: '0.7rem', padding: '2px 6px'}}>
                        {trx.deliveryMethod === 'Diantar ke Alamat' ? '🛵 Diantar' : '🏥 Ambil'}
                      </span>
                    </td>
                    <td>
                      {trx.resepImageUrl ? (
                        <a href={`http://localhost:5000${trx.resepImageUrl}`} target="_blank" rel="noreferrer">
                          <span className="badge badge-success">✅ Ada</span>
                        </a>
                      ) : <span className="badge badge-muted">—</span>}
                    </td>
                    <td><span className={`badge badge-${STATUS_COLORS[trx.status] || 'muted'}`}>{trx.status}</span></td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{new Date(trx.createdAt).toLocaleString('id-ID')}</td>
                    {(user?.role === 'Admin' || user?.role === 'Kasir') && (
                      <td>
                        <select className="form-select" style={{ fontSize: '0.8rem', padding: '4px 8px', width: 'auto' }}
                          value={trx.status}
                          onChange={e => handleStatusUpdate(trx.id, e.target.value)}>
                          {['Dikonfirmasi', 'Diproses', trx.deliveryMethod === 'Diantar ke Alamat' ? 'Sedang Dikirim' : 'Siap Diambil', 'Selesai', 'Dibatalkan'].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {totalPages > 1 && (
          <div className="card-footer" style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="pagination">
              <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
                <button key={p} className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
