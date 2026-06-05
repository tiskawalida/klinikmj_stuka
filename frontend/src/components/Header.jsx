import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useCart } from '../context/CartContext';
import './Header.css';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/katalog': 'Katalog Obat',
  '/keranjang': 'Keranjang Belanja',
  '/transaksi': 'Riwayat Transaksi',
  '/stok': 'Manajemen Stok',
  '/laporan': 'Laporan & Analitik',
  '/monitoring': 'Monitoring Sistem',
  '/users': 'Manajemen Pengguna',
};

export default function Header() {
  const { user } = useAuth();
  const { notifications, markAllRead } = useSocket();
  const { totalItems } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const unread = notifications.filter(n => !n.read).length;
  const title = PAGE_TITLES[location.pathname] || 'Klinik Makmur Jaya';

  const now = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <header className="app-header">
      <div className="header-left">
        <h1 className="header-title">{title}</h1>
        <p className="header-date">{now}</p>
      </div>

      <div className="header-right">
        {/* Keranjang shortcut */}
        {(user?.role === 'Kasir' || user?.role === 'Pasien') && (
          <button className="header-icon-btn" onClick={() => navigate('/keranjang')} title="Keranjang">
            🛒
            {totalItems > 0 && <span className="header-badge">{totalItems}</span>}
          </button>
        )}

        {/* Notifikasi */}
        <button className="header-icon-btn" onClick={markAllRead} title="Notifikasi">
          🔔
          {unread > 0 && <span className="header-badge danger">{unread}</span>}
        </button>

        {/* User info */}
        <div className="header-user">
          <div className="header-avatar">
            {user?.fullName?.[0] || user?.username?.[0] || '?'}
          </div>
          <div className="header-user-text">
            <span className="header-username">{user?.fullName || user?.username}</span>
            <span className="header-role">{user?.role}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
