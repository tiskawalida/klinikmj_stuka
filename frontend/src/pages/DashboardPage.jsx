import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { laporanAPI, medicinesAPI, transactionsAPI } from '../api';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './DashboardPage.css';

export default function DashboardPage() {
  const { user } = useAuth();
  const { notifications } = useSocket();
  const [stats, setStats] = useState({ totalRevenue: 0, totalTransaksi: 0, lowStock: 0, expiring: 0 });
  const [chartData, setChartData] = useState([]);
  const [topMeds, setTopMeds] = useState([]);
  const [recentTrx, setRecentTrx] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [laporan, lowStockRes, trxRes] = await Promise.all([
          laporanAPI.getPenjualan({ period: 'daily' }),
          medicinesAPI.getLowStock().catch(() => ({ data: { data: [] } })),
          transactionsAPI.getAll({ limit: 5 }).catch(() => ({ data: { data: [] } })),
        ]);

        const summary = laporan.data.summary || {};
        setStats({
          totalRevenue: parseFloat(summary.totalPendapatan) || 0,
          totalTransaksi: parseInt(summary.totalTransaksi) || 0,
          lowStock: lowStockRes.data.data?.length || 0,
          expiring: laporan.data.data?.length || 0,
        });

        const chart = (laporan.data.data || []).map(d => ({
          period: d.period,
          pendapatan: parseFloat(d.totalPendapatan) || 0,
          transaksi: parseInt(d.totalTransaksi) || 0,
        }));
        setChartData(chart);
        setTopMeds(laporan.data.topMedicines || []);
        setRecentTrx(trxRes.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const PIE_COLORS = ['#0d9488', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6'];

  if (loading) return (
    <div className="loading-overlay">
      <div className="spinner"></div>
      <p>Memuat data dashboard...</p>
    </div>
  );

  return (
    <div className="dashboard-page animate-fade">
      {/* Real-Time Notification Feed */}
      {notifications.length > 0 && (
        <div className="notif-feed">
          <h3 className="notif-feed-title">🔔 Notifikasi Real-Time</h3>
          <div className="notif-feed-list">
            {notifications.slice(0, 3).map(n => (
              <div key={n.id} className={`notif-item notif-${n.type}`}>
                <span className="notif-icon">
                  {n.type === 'warning' ? '⚠️' : n.type === 'danger' ? '🚨' : 'ℹ️'}
                </span>
                <div>
                  <p className="notif-msg">{n.message}</p>
                  <span className="notif-time">{new Date(n.timestamp).toLocaleTimeString('id-ID')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Greeting */}
      <div className="dashboard-greeting">
        <div>
          <h1>Selamat Datang, {user?.fullName?.split(' ')[0] || user?.username}! 👋</h1>
          <p>Berikut ringkasan aktivitas sistem hari ini.</p>
        </div>
        <div className="dashboard-role-badge">
          <span>{user?.role}</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f0fdfa' }}>💰</div>
          <div className="stat-label">Total Pendapatan (7 Hari)</div>
          <div className="stat-value">Rp {stats.totalRevenue.toLocaleString('id-ID')}</div>
          <div className="stat-change up">↑ Real-time</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#eff6ff' }}>🧾</div>
          <div className="stat-label">Total Transaksi</div>
          <div className="stat-value">{stats.totalTransaksi}</div>
          <div className="stat-change up">↑ 7 hari terakhir</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fffbeb' }}>⚠️</div>
          <div className="stat-label">Obat Stok Kritis</div>
          <div className="stat-value" style={{ color: stats.lowStock > 0 ? 'var(--warning)' : 'inherit' }}>
            {stats.lowStock}
          </div>
          <div className={`stat-change ${stats.lowStock > 0 ? 'down' : 'up'}`}>
            {stats.lowStock > 0 ? '⚠️ Perlu restock' : '✅ Normal'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef2f2' }}>⏰</div>
          <div className="stat-label">Obat Mendekati Kadaluarsa</div>
          <div className="stat-value" style={{ color: stats.expiring > 0 ? 'var(--danger)' : 'inherit' }}>
            {stats.expiring}
          </div>
          <div className={`stat-change ${stats.expiring > 0 ? 'down' : 'up'}`}>
            {stats.expiring > 0 ? '🚨 Perlu perhatian' : '✅ Aman'}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="dashboard-charts">
        {/* Area Chart */}
        <div className="card chart-card">
          <div className="card-header">
            <h3>📈 Tren Pendapatan (7 Hari)</h3>
          </div>
          <div className="card-body" style={{ padding: '8px 16px 16px' }}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `Rp ${(v/1000).toFixed(0)}K`} />
                  <Tooltip formatter={(v) => [`Rp ${v.toLocaleString('id-ID')}`, 'Pendapatan']} />
                  <Area type="monotone" dataKey="pendapatan" stroke="#0d9488" strokeWidth={2.5} fill="url(#tealGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state" style={{ minHeight: 180 }}>
                <div className="empty-icon">📊</div>
                <p>Belum ada data penjualan</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Medicines Pie */}
        <div className="card chart-card">
          <div className="card-header">
            <h3>🏆 Obat Terlaris</h3>
          </div>
          <div className="card-body chart-pie-body">
            {topMeds.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={topMeds.slice(0, 5)} dataKey="totalTerjual" nameKey="medicineName"
                      cx="50%" cy="50%" outerRadius={70} label={false}>
                      {topMeds.slice(0, 5).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pie-legend">
                  {topMeds.slice(0, 5).map((m, i) => (
                    <div key={i} className="pie-legend-item">
                      <span className="pie-dot" style={{ background: PIE_COLORS[i] }}></span>
                      <span>{m.medicineName}</span>
                      <span className="pie-val">{m.totalTerjual} terjual</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-state" style={{ minHeight: 180 }}>
                <div className="empty-icon">📦</div>
                <p>Belum ada data penjualan</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div className="card-header">
          <h3>🧾 Transaksi Terbaru</h3>
        </div>
        <div className="table-wrapper" style={{ borderRadius: 0, border: 'none' }}>
          {recentTrx.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Pengguna</th>
                  <th>Total</th>
                  <th>Metode</th>
                  <th>Status</th>
                  <th>Waktu</th>
                </tr>
              </thead>
              <tbody>
                {recentTrx.map(trx => (
                  <tr key={trx.id}>
                    <td><code style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>{trx.invoiceNumber}</code></td>
                    <td>{trx.user?.fullName || trx.user?.username || '-'}</td>
                    <td><strong>Rp {parseFloat(trx.totalAmount).toLocaleString('id-ID')}</strong></td>
                    <td>{trx.paymentMethod}</td>
                    <td>
                      <span className={`badge badge-${trx.status === 'Selesai' ? 'success' : trx.status === 'Dibatalkan' ? 'danger' : 'warning'}`}>
                        {trx.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(trx.createdAt).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🧾</div>
              <h3>Belum ada transaksi</h3>
              <p>Transaksi akan tampil di sini secara real-time.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
