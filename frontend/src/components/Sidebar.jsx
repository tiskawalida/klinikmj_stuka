import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useSocket } from '../context/SocketContext';
import './Sidebar.css';

const MENU = {
  Admin: [
    { label: 'Dashboard', icon: '📊', path: '/dashboard' },
    { label: 'Manajemen User', icon: '👥', path: '/users' },
    { label: 'Katalog Obat', icon: '💊', path: '/katalog' },
    { label: 'Transaksi', icon: '🧾', path: '/transaksi' },
    { label: 'Manajemen Stok', icon: '📦', path: '/stok' },
    { label: 'Laporan', icon: '📈', path: '/laporan' },
    { label: 'Monitoring', icon: '📡', path: '/monitoring' },
  ],
  Apoteker: [
    { label: 'Dashboard', icon: '📊', path: '/dashboard' },
    { label: 'Katalog Obat', icon: '💊', path: '/katalog' },
    { label: 'Input / Edit Obat', icon: '📦', path: '/stok' },
    { label: 'Laporan Stok', icon: '📈', path: '/laporan' },
  ],
  Kasir: [
    { label: 'Dashboard', icon: '📊', path: '/dashboard' },
    { label: 'Transaksi Kasir', icon: '🛒', path: '/keranjang' },
    { label: 'Riwayat Transaksi', icon: '🧾', path: '/transaksi' },
  ],
  Pasien: [
    { label: 'Dashboard', icon: '📊', path: '/dashboard' },
    { label: 'Katalog Obat Online', icon: '💊', path: '/katalog' },
    { label: 'Keranjang Saya', icon: '🛒', path: '/keranjang' },
    { label: 'Riwayat Pesanan', icon: '🧾', path: '/transaksi' },
  ],
};

const ROLE_COLORS = {
  Admin: '#ef4444',
  Apoteker: '#3b82f6',
  Kasir: '#f59e0b',
  Pasien: '#10b981',
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const { connected, notifications } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const unreadCount = notifications.filter(n => !n.read).length;

  const menuItems = MENU[user?.role] || [];
  const roleColor = ROLE_COLORS[user?.role] || '#0d9488';

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-logo">🏥</div>
        <div className="sidebar-brand-text">
          <h2>Klinik Makmur</h2>
          <span>Apotek Online</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <p className="sidebar-section-label">MENU UTAMA</p>
        {menuItems.map(item => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="sidebar-item-icon">{item.icon}</span>
            <span className="sidebar-item-label">{item.label}</span>
            {item.path === '/keranjang' && totalItems > 0 && (
              <span className="sidebar-badge cart-badge">{totalItems}</span>
            )}
            {item.path === '/dashboard' && unreadCount > 0 && (
              <span className="sidebar-badge notif-badge">{unreadCount}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar" style={{ background: roleColor }}>
            {user?.fullName?.[0] || user?.username?.[0] || '?'}
          </div>
          <div className="sidebar-user-info">
            <p className="sidebar-username">{user?.fullName || user?.username}</p>
            <span className="sidebar-role" style={{ background: roleColor + '22', color: roleColor }}>
              {user?.role}
            </span>
          </div>
        </div>

        <div className="sidebar-status">
          <span className={`status-dot ${connected ? 'online' : 'offline'}`}></span>
          <span>{connected ? 'Terhubung' : 'Offline'}</span>
        </div>

        <button onClick={handleLogout} className="btn-logout">
          <span>🚪</span> Keluar
        </button>
      </div>
    </aside>
  );
}
