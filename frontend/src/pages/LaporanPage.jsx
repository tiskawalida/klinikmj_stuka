import { useState, useEffect } from 'react';
import { laporanAPI } from '../api';
import { useToast } from '../context/ToastContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function LaporanPage() {
  const { toast } = useToast();
  const [period, setPeriod] = useState('daily');
  const [data, setData] = useState([]);
  const [topMeds, setTopMeds] = useState([]);
  const [stokKritis, setStokKritis] = useState([]);
  const [kadaluarsa, setKadaluarsa] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('penjualan');

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        const [penjRes, stokRes, kadRes] = await Promise.all([
          laporanAPI.getPenjualan({ period }),
          laporanAPI.getStokKritis(),
          laporanAPI.getKadaluarsa(90),
        ]);
        setData(penjRes.data.data || []);
        setTopMeds(penjRes.data.topMedicines || []);
        setSummary(penjRes.data.summary || {});
        setStokKritis(stokRes.data.data || []);
        setKadaluarsa(kadRes.data.data || []);
      } catch { } finally { setLoading(false); }
    };
    loadAll();
  }, [period]);

  const handleExportPdf = async () => {
    setPdfLoading(true);
    try {
      const res = await laporanAPI.exportPdf();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = `laporan-klinik-${Date.now()}.pdf`; a.click();
      window.URL.revokeObjectURL(url);
      toast.success('📄 Laporan PDF berhasil diunduh!');
    } catch { toast.error('Gagal ekspor PDF.'); }
    finally { setPdfLoading(false); }
  };

  const chartData = data.map(d => ({
    period: d.period,
    Pendapatan: parseFloat(d.totalPendapatan) || 0,
    Transaksi: parseInt(d.totalTransaksi) || 0,
  }));

  const TABS = [
    { key: 'penjualan', label: '📈 Penjualan' },
    { key: 'stok', label: '⚠️ Stok Kritis' },
    { key: 'kadaluarsa', label: '⏰ Kadaluarsa' },
    { key: 'terlaris', label: '🏆 Terlaris' },
  ];

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div className="page-header-left">
          <h1>📈 Laporan & Analitik</h1>
          <p>Analisis penjualan dan inventaris Klinik Makmur Jaya</p>
        </div>
        <div className="page-header-actions">
          {['daily', 'weekly', 'monthly'].map(p => (
            <button key={p} className={`btn ${period === p ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setPeriod(p)}>
              {p === 'daily' ? 'Harian' : p === 'weekly' ? 'Mingguan' : 'Bulanan'}
            </button>
          ))}
          <button className="btn btn-primary" onClick={handleExportPdf} disabled={pdfLoading}>
            {pdfLoading ? '⏳ Mengekspor...' : '📄 Export PDF'}
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-label">Total Pendapatan</div>
          <div className="stat-value">Rp {parseFloat(summary.totalPendapatan || 0).toLocaleString('id-ID')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🧾</div>
          <div className="stat-label">Total Transaksi</div>
          <div className="stat-value">{summary.totalTransaksi || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <div className="stat-label">Stok Kritis</div>
          <div className="stat-value" style={{ color: stokKritis.length > 0 ? 'var(--danger)' : 'inherit' }}>
            {stokKritis.length}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="filter-bar" style={{ marginBottom: 16 }}>
        {TABS.map(t => (
          <button key={t.key} className={`filter-chip ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="loading-overlay"><div className="spinner"></div><p>Memuat laporan...</p></div>
      ) : (
        <>
          {activeTab === 'penjualan' && (
            <div className="card">
              <div className="card-header"><h3>📊 Grafik Pendapatan</h3></div>
              <div className="card-body">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `Rp ${(v/1000).toFixed(0)}K`} />
                      <Tooltip formatter={(v, n) => [n === 'Pendapatan' ? `Rp ${v.toLocaleString('id-ID')}` : v, n]} />
                      <Bar dataKey="Pendapatan" fill="#0d9488" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Transaksi" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-state"><div className="empty-icon">📊</div><p>Belum ada data penjualan</p></div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'stok' && (
            <div className="card">
              <div className="card-header"><h3>⚠️ Daftar Obat Stok Kritis</h3></div>
              <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                {stokKritis.length === 0 ? (
                  <div className="empty-state"><div className="empty-icon">✅</div><h3>Semua stok normal</h3></div>
                ) : (
                  <table><thead><tr><th>Nama Obat</th><th>Kategori</th><th>Stok</th><th>Min. Stok</th><th>Status</th></tr></thead>
                    <tbody>
                      {stokKritis.map((m, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600 }}>{m.name}</td>
                          <td>{m.category}</td>
                          <td style={{ color: m.stock === 0 ? 'var(--danger)' : 'var(--warning)', fontWeight: 700 }}>{m.stock}</td>
                          <td>{m.minStock}</td>
                          <td><span className={`badge ${m.status === 'Habis' ? 'badge-danger' : 'badge-warning'}`}>{m.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {activeTab === 'kadaluarsa' && (
            <div className="card">
              <div className="card-header"><h3>⏰ Obat Mendekati Kadaluarsa (90 Hari)</h3></div>
              <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                {kadaluarsa.length === 0 ? (
                  <div className="empty-state"><div className="empty-icon">✅</div><h3>Tidak ada obat mendekati kadaluarsa</h3></div>
                ) : (
                  <table><thead><tr><th>Nama Obat</th><th>Stok</th><th>Tanggal Kadaluarsa</th><th>Sisa Hari</th><th>No. Batch</th></tr></thead>
                    <tbody>
                      {kadaluarsa.map((m, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600 }}>{m.name}</td>
                          <td>{m.stock}</td>
                          <td>{new Date(m.expiredDate).toLocaleDateString('id-ID')}</td>
                          <td>
                            <span className={`badge ${m.sisaHari <= 7 ? 'badge-danger' : m.sisaHari <= 30 ? 'badge-warning' : 'badge-info'}`}>
                              {m.sisaHari} hari
                            </span>
                          </td>
                          <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{m.batchNumber || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {activeTab === 'terlaris' && (
            <div className="card">
              <div className="card-header"><h3>🏆 Top 10 Obat Terlaris</h3></div>
              <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                {topMeds.length === 0 ? (
                  <div className="empty-state"><div className="empty-icon">📊</div><p>Belum ada data</p></div>
                ) : (
                  <table><thead><tr><th>Rank</th><th>Nama Obat</th><th>Total Terjual</th><th>Total Revenue</th></tr></thead>
                    <tbody>
                      {topMeds.map((m, i) => (
                        <tr key={i}>
                          <td><span className="badge badge-primary">#{i + 1}</span></td>
                          <td style={{ fontWeight: 600 }}>{m.medicineName}</td>
                          <td><strong>{m.totalTerjual}</strong> unit</td>
                          <td>Rp {parseFloat(m.totalRevenue || 0).toLocaleString('id-ID')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
