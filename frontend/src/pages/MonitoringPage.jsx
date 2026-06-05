import { useState, useEffect } from 'react';
import { monitoringAPI } from '../api';
import { useToast } from '../context/ToastContext';

const SEV_COLORS = { critical: 'badge-danger', warning: 'badge-warning', info: 'badge-info' };

export default function MonitoringPage() {
  const { toast } = useToast();
  const [resources, setResources] = useState(null);
  const [errorLogs, setErrorLogs] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('resources');
  const [loading, setLoading] = useState(true);
  const [severity, setSeverity] = useState('');

  const loadResources = async () => {
    try {
      const res = await monitoringAPI.getResources();
      setResources(res.data.data);
    } catch { }
  };

  const loadErrors = async () => {
    try {
      const params = {}; if (severity) params.severity = severity;
      const res = await monitoringAPI.getErrorLogs(params);
      setErrorLogs(res.data.data);
    } catch { }
  };

  const loadAudit = async () => {
    try {
      const res = await monitoringAPI.getAuditLogs({});
      setAuditLogs(res.data.data || []);
    } catch { }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadResources(), loadErrors(), loadAudit()]);
      setLoading(false);
    };
    init();
    // Auto-refresh resources setiap 10 detik
    const interval = setInterval(loadResources, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { loadErrors(); }, [severity]);

  const handleResolve = async (id) => {
    try {
      await monitoringAPI.resolveError(id);
      toast.success('Error log ditandai selesai.');
      loadErrors();
    } catch { toast.error('Gagal resolve error.'); }
  };

  const formatBytes = (b) => {
    if (b > 1073741824) return `${(b / 1073741824).toFixed(1)} GB`;
    if (b > 1048576) return `${(b / 1048576).toFixed(1)} MB`;
    return `${(b / 1024).toFixed(0)} KB`;
  };

  const TABS = [
    { key: 'resources', label: '🖥️ Resource Server' },
    { key: 'errors', label: '🚨 Error Logs' },
    { key: 'audit', label: '📋 Audit Logs' },
  ];

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div className="page-header-left">
          <h1>📡 Monitoring Sistem</h1>
          <p>Pemantauan resource server, error logs, dan aktivitas pengguna</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => Promise.all([loadResources(), loadErrors(), loadAudit()])}>
          🔄 Refresh
        </button>
      </div>

      <div className="filter-bar" style={{ marginBottom: 16 }}>
        {TABS.map(t => (
          <button key={t.key} className={`filter-chip ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="loading-overlay"><div className="spinner"></div><p>Memuat data monitoring...</p></div>
      ) : (
        <>
          {activeTab === 'resources' && resources && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Memory */}
              <div className="card">
                <div className="card-header"><h3>🧠 Penggunaan Memori</h3></div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="resource-row">
                    <span>Total RAM</span><strong>{formatBytes(resources.memory.total)}</strong>
                  </div>
                  <div className="resource-row">
                    <span>Terpakai</span><strong style={{ color: 'var(--warning)' }}>{formatBytes(resources.memory.used)}</strong>
                  </div>
                  <div className="resource-row">
                    <span>Tersedia</span><strong style={{ color: 'var(--success)' }}>{formatBytes(resources.memory.free)}</strong>
                  </div>
                  <div>
                    <div className="resource-bar-label">
                      <span>Penggunaan</span><span>{resources.memory.percentage}%</span>
                    </div>
                    <div className="resource-bar">
                      <div className="resource-bar-fill"
                        style={{ width: `${resources.memory.percentage}%`, background: parseFloat(resources.memory.percentage) > 80 ? 'var(--danger)' : 'var(--primary)' }}>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CPU */}
              <div className="card">
                <div className="card-header"><h3>⚡ CPU & Server</h3></div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="resource-row"><span>Jumlah Core</span><strong>{resources.cpu.count} core</strong></div>
                  <div className="resource-row"><span>Platform</span><strong>{resources.server.platform}</strong></div>
                  <div className="resource-row"><span>Hostname</span><strong>{resources.server.hostname}</strong></div>
                  <div className="resource-row"><span>Server Uptime</span><strong>{Math.floor(resources.server.uptime / 3600)} jam</strong></div>
                  <div className="resource-row"><span>Process PID</span><strong>{resources.process.pid}</strong></div>
                </div>
              </div>

              {/* DB Stats */}
              <div className="card">
                <div className="card-header"><h3>🗄️ Statistik Database</h3></div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="resource-row"><span>Total Pengguna</span><strong>{resources.stats.userCount}</strong></div>
                  <div className="resource-row"><span>Obat Aktif</span><strong>{resources.stats.medCount}</strong></div>
                  <div className="resource-row"><span>Transaksi Hari Ini</span><strong>{resources.stats.trxToday}</strong></div>
                </div>
              </div>

              {/* Process */}
              <div className="card">
                <div className="card-header"><h3>🔄 Node.js Process</h3></div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="resource-row"><span>Heap Used</span><strong>{formatBytes(resources.process.memoryUsage.heapUsed)}</strong></div>
                  <div className="resource-row"><span>Heap Total</span><strong>{formatBytes(resources.process.memoryUsage.heapTotal)}</strong></div>
                  <div className="resource-row"><span>RSS</span><strong>{formatBytes(resources.process.memoryUsage.rss)}</strong></div>
                  <div className="resource-row"><span>Process Uptime</span><strong>{Math.floor(resources.process.uptime / 60)} menit</strong></div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'errors' && (
            <div className="card">
              <div className="card-header">
                <h3>🚨 Error Log Dashboard</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['', 'critical', 'warning', 'info'].map(s => (
                    <button key={s} className={`btn btn-sm ${severity === s ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => setSeverity(s)}>
                      {s || 'Semua'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                {errorLogs.length === 0 ? (
                  <div className="empty-state"><div className="empty-icon">✅</div><h3>Tidak ada error log</h3></div>
                ) : (
                  <table>
                    <thead><tr><th>Severity</th><th>Pesan Error</th><th>Route</th><th>Waktu</th><th>Status</th><th>Aksi</th></tr></thead>
                    <tbody>
                      {errorLogs.map(log => (
                        <tr key={log.id}>
                          <td><span className={`badge ${SEV_COLORS[log.severity]}`}>{log.severity}</span></td>
                          <td style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.85rem' }}
                            title={log.message}>{log.message}</td>
                          <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{log.method} {log.route}</td>
                          <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{new Date(log.createdAt).toLocaleString('id-ID')}</td>
                          <td>
                            {log.resolved
                              ? <span className="badge badge-success">✅ Resolved</span>
                              : <span className="badge badge-danger">Aktif</span>}
                          </td>
                          <td>
                            {!log.resolved && (
                              <button className="btn btn-success btn-sm" onClick={() => handleResolve(log.id)}>Resolve</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="card">
              <div className="card-header"><h3>📋 Audit Log Aktivitas</h3></div>
              <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                {auditLogs.length === 0 ? (
                  <div className="empty-state"><div className="empty-icon">📋</div><p>Belum ada log aktivitas</p></div>
                ) : (
                  <table>
                    <thead><tr><th>Waktu</th><th>Pengguna</th><th>Role</th><th>Aksi</th><th>Status</th><th>IP</th></tr></thead>
                    <tbody>
                      {auditLogs.map(log => (
                        <tr key={log.id}>
                          <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{new Date(log.createdAt).toLocaleString('id-ID')}</td>
                          <td style={{ fontWeight: 600 }}>{log.username || '—'}</td>
                          <td><span className="badge badge-muted">{log.role || '—'}</span></td>
                          <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{log.action}</td>
                          <td>
                            <span className={`badge ${log.statusCode < 400 ? 'badge-success' : 'badge-danger'}`}>
                              {log.statusCode}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.ipAddress || '—'}</td>
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
