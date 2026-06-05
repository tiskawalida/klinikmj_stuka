import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import './MedicineCard.css';

const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const CATEGORY_COLORS = {
  'Obat Resep': { bg: '#fee2e2', color: '#b91c1c', icon: '📋' },
  'Obat Bebas': { bg: '#dcfce7', color: '#15803d', icon: '🟢' },
  'Obat Bebas Terbatas': { bg: '#fef3c7', color: '#92400e', icon: '🟡' },
  'Suplemen': { bg: '#dbeafe', color: '#1d4ed8', icon: '💊' },
  'Alat Kesehatan': { bg: '#f3e8ff', color: '#7e22ce', icon: '🏥' },
};

export default function MedicineCard({ medicine }) {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { user } = useAuth();

  const cat = CATEGORY_COLORS[medicine.category] || CATEGORY_COLORS['Obat Bebas'];
  const isOutOfStock = medicine.stock <= 0;
  const isLowStock = medicine.stock > 0 && medicine.stock <= medicine.minStock;
  const isExpiringSoon = (() => {
    if (!medicine.expiredDate) return false;
    const days = Math.ceil((new Date(medicine.expiredDate) - new Date()) / 86400000);
    return days <= 30;
  })();

  const imageUrl = medicine.imageUrl
    ? `${API_URL}${medicine.imageUrl}`
    : null;

  const handleAddToCart = () => {
    if (isOutOfStock) { toast.error('Stok obat habis.'); return; }
    addToCart(medicine);
    toast.success(`✅ ${medicine.name} ditambahkan ke keranjang!`);
  };

  const canBuy = user?.role === 'Kasir' || user?.role === 'Pasien';

  return (
    <div className={`med-card ${isOutOfStock ? 'out-of-stock' : ''}`}>
      {/* Badges */}
      <div className="med-card-badges">
        {medicine.category === 'Obat Resep' && (
          <span className="badge-resep">📋 RESEP</span>
        )}
        {isLowStock && !isOutOfStock && (
          <span className="badge-low-stock">⚠️ Stok Menipis</span>
        )}
        {isOutOfStock && <span className="badge-out">Habis</span>}
        {isExpiringSoon && <span className="badge-expiry">⏰ Segera Kadaluarsa</span>}
      </div>

      {/* Image */}
      <div className="med-card-image">
        {imageUrl
          ? <img src={imageUrl} alt={medicine.name} loading="lazy" />
          : <div className="med-card-placeholder">{cat.icon}</div>
        }
      </div>

      {/* Content */}
      <div className="med-card-body">
        <div className="med-card-category" style={{ background: cat.bg, color: cat.color }}>
          {cat.icon} {medicine.category}
        </div>
        <h3 className="med-card-name">{medicine.name}</h3>
        {medicine.genericName && (
          <p className="med-card-generic">{medicine.genericName}</p>
        )}
        {medicine.dosage && (
          <p className="med-card-dosage">💉 {medicine.dosage}</p>
        )}

        <div className="med-card-footer">
          <div className="med-card-price-block">
            <span className="med-card-price">Rp {parseFloat(medicine.price).toLocaleString('id-ID')}</span>
            <span className="med-card-unit">/{medicine.unit}</span>
          </div>
          <span className={`med-card-stock ${isLowStock ? 'low' : ''} ${isOutOfStock ? 'empty' : ''}`}>
            📦 {medicine.stock} {medicine.unit}
          </span>
        </div>

        {canBuy && (
          <button
            className={`med-card-btn ${isOutOfStock ? 'disabled' : ''}`}
            onClick={handleAddToCart}
            disabled={isOutOfStock}
          >
            {isOutOfStock ? 'Stok Habis' : '🛒 Tambah ke Keranjang'}
          </button>
        )}
      </div>
    </div>
  );
}
