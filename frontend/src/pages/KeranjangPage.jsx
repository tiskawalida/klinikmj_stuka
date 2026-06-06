import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { transactionsAPI } from '../api';
import './KeranjangPage.css';

const PAYMENT_METHODS = ['Tunai', 'Transfer Bank', 'QRIS', 'Kartu Debit', 'Kartu Kredit'];

export default function KeranjangPage() {
  const { cart, removeFromCart, updateQuantity, clearCart, totalAmount, hasObatResep } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [amountPaid, setAmountPaid] = useState('');
  const [notes, setNotes] = useState('');
  const [resepFile, setResepFile] = useState(null);
  const [resepPreview, setResepPreview] = useState(null);
  const [resepVerified, setResepVerified] = useState(false); // Kasir toggle
  const [loading, setLoading] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState('Ambil di Klinik');
  const fileRef = useRef();

  const isPasien = user?.role === 'Pasien';
  const isKasir = user?.role === 'Kasir';

  const validPaymentMethods = isKasir 
    ? ['Tunai', 'Transfer Bank', 'QRIS', 'Kartu Debit', 'Kartu Kredit']
    : ['Transfer Bank', 'QRIS', 'Kartu Debit', 'Kartu Kredit'];
    
  const [paymentMethod, setPaymentMethod] = useState(() => isKasir ? 'Tunai' : 'Transfer Bank');

  const needsResep = hasObatResep && isPasien;
  const cleanAmountPaid = amountPaid ? parseFloat(String(amountPaid).replace(/[^0-9.-]+/g, "")) : 0;
  const change = cleanAmountPaid - totalAmount;

  const handleResepChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setResepFile(file);
    setResepPreview(URL.createObjectURL(file));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) { toast.error('Keranjang belanja kosong.'); return; }
    if (needsResep && !resepFile) {
      toast.error('📋 Anda harus melampirkan resep dokter untuk Obat Resep!');
      return;
    }
    if (paymentMethod === 'Tunai' && amountPaid && cleanAmountPaid < totalAmount - 0.01) {
      toast.error('Uang yang dibayarkan kurang dari total belanja.'); return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('items', JSON.stringify(cart.map(i => ({ medicineId: i.id, quantity: i.quantity }))));
      fd.append('paymentMethod', paymentMethod);
      fd.append('deliveryMethod', deliveryMethod);
      fd.append('amountPaid', amountPaid ? cleanAmountPaid : totalAmount);
      fd.append('notes', notes);
      if (resepFile) fd.append('resep', resepFile);
      if (isKasir && resepVerified) fd.append('resepImageUrl', 'verified-offline');

      const res = await transactionsAPI.checkout(fd);
      toast.success(`✅ Transaksi berhasil! Invoice: ${res.data.data.invoiceNumber}`);
      clearCart();
      navigate('/transaksi');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Checkout gagal. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) return (
    <div className="empty-state" style={{ minHeight: '60vh' }}>
      <div className="empty-icon">🛒</div>
      <h3>Keranjang Belanja Kosong</h3>
      <p>Tambahkan obat dari katalog untuk memulai belanja.</p>
      <button className="btn btn-primary" onClick={() => navigate('/katalog')}>
        💊 Lihat Katalog Obat
      </button>
    </div>
  );

  return (
    <div className="keranjang-page animate-fade">
      <div className="page-header">
        <div className="page-header-left">
          <h1>🛒 Keranjang Belanja</h1>
          <p>{cart.length} jenis obat dipilih</p>
        </div>
      </div>

      <div className="keranjang-layout">
        {/* LEFT: Cart Items */}
        <div className="keranjang-left">
          <div className="card">
            <div className="card-header">
              <h3>Item Keranjang</h3>
              <button className="btn btn-ghost btn-sm" onClick={clearCart}>🗑️ Kosongkan</button>
            </div>
            <div className="cart-items">
              {cart.map(item => (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-info">
                    <div className="cart-item-name">
                      {item.name}
                      {item.category === 'Obat Resep' && <span className="badge badge-danger" style={{ marginLeft: 8, fontSize: '0.65rem' }}>📋 RESEP</span>}
                    </div>
                    <div className="cart-item-price">Rp {parseFloat(item.price).toLocaleString('id-ID')} / {item.unit}</div>
                  </div>
                  <div className="cart-item-controls">
                    <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                    <span className="qty-val">{item.quantity}</span>
                    <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                  </div>
                  <div className="cart-item-subtotal">
                    Rp {(parseFloat(item.price) * item.quantity).toLocaleString('id-ID')}
                  </div>
                  <button className="cart-item-remove" onClick={() => removeFromCart(item.id)}>✕</button>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="card order-summary">
            <div className="card-header"><h3>📋 Ringkasan Pesanan</h3></div>
            <div className="card-body">
              {cart.map(item => (
                <div key={item.id} className="summary-row">
                  <span>{item.name} × {item.quantity}</span>
                  <span>Rp {(parseFloat(item.price) * item.quantity).toLocaleString('id-ID')}</span>
                </div>
              ))}
              <div className="summary-divider"></div>
              <div className="summary-row total">
                <span>TOTAL</span>
                <span>Rp {totalAmount.toLocaleString('id-ID')}</span>
              </div>
              {paymentMethod === 'Tunai' && amountPaid && change >= 0 && (
                <div className="summary-row change">
                  <span>Kembalian</span>
                  <span>Rp {change.toLocaleString('id-ID')}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Payment Form */}
        <div className="keranjang-right">
          <div className="card payment-card">
            <div className="card-header"><h3>💳 Form Pembayaran</h3></div>
            <div className="card-body payment-form">

              {/* Resep Upload — Pasien */}
              {needsResep && isPasien && (
                <div className="resep-section">
                  <div className="alert alert-danger">
                    <span>📋</span>
                    <div>
                      <strong>Resep Dokter Wajib!</strong>
                      <p style={{ margin: 0, fontSize: '0.85rem' }}>Keranjang Anda mengandung <strong>Obat Resep</strong>. Silakan upload foto resep dokter Anda.</p>
                    </div>
                  </div>
                  <div className="file-upload-area" onClick={() => fileRef.current?.click()} style={{ cursor: 'pointer' }}>
                    <input ref={fileRef} type="file" accept="image/*,.pdf" onChange={handleResepChange} style={{ display: 'none' }} />
                    {resepPreview ? (
                      <div className="resep-preview">
                        <img src={resepPreview} alt="Resep" style={{ maxWidth: '100%', maxHeight: 180, borderRadius: 8, objectFit: 'contain' }} />
                        <p style={{ marginTop: 8, color: 'var(--success)', fontWeight: 600 }}>✅ Resep terlampir: {resepFile?.name}</p>
                      </div>
                    ) : (
                      <>
                        <div className="upload-icon">📄</div>
                        <p><strong>Klik untuk upload</strong> foto resep dokter</p>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Format: JPG, PNG, PDF (maks. 10MB)</p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Resep Verified Toggle — Kasir */}
              {hasObatResep && isKasir && (
                <div className={`alert ${resepVerified ? 'alert-success' : 'alert-warning'}`}>
                  <span>{resepVerified ? '✅' : '⚠️'}</span>
                  <div style={{ flex: 1 }}>
                    <strong>{resepVerified ? 'Resep Terverifikasi' : 'Verifikasi Resep'}</strong>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>
                      {resepVerified ? 'Resep dokter sudah diverifikasi secara offline.' : 'Tandai resep sebagai terverifikasi (sudah diperiksa secara fisik).'}
                    </p>
                  </div>
                  <button
                    className={`btn btn-sm ${resepVerified ? 'btn-secondary' : 'btn-primary'}`}
                    onClick={() => setResepVerified(v => !v)}>
                    {resepVerified ? 'Batal' : 'Tandai Terverifikasi'}
                  </button>
                </div>
              )}

              {/* Delivery Method */}
              {isPasien && (
                <div className="form-group">
                  <label className="form-label">Metode Pengiriman</label>
                  <div className="payment-methods">
                    {['Ambil di Klinik', 'Diantar ke Alamat'].map(m => (
                      <button key={m} className={`payment-method-btn ${deliveryMethod === m ? 'active' : ''}`}
                        onClick={() => setDeliveryMethod(m)}>
                        {m === 'Ambil di Klinik' ? '🏥' : '🛵'} {m}
                      </button>
                    ))}
                  </div>
                  {deliveryMethod === 'Diantar ke Alamat' && (
                    <p style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8}}>
                      Pesanan akan diantar ke: <strong>{user?.address || 'Alamat belum diatur di profil Anda'}</strong>
                    </p>
                  )}
                </div>
              )}

              {/* Payment Method */}
              <div className="form-group">
                <label className="form-label">Metode Pembayaran</label>
                <div className="payment-methods">
                  {validPaymentMethods.map(m => (
                    <button key={m} className={`payment-method-btn ${paymentMethod === m ? 'active' : ''}`}
                      onClick={() => setPaymentMethod(m)}>
                      {m === 'Tunai' ? '💵' : m === 'QRIS' ? '📱' : m === 'Transfer Bank' ? '🏦' : '💳'} {m}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === 'Tunai' && (
                <div className="form-group">
                  <label className="form-label">Uang Dibayarkan</label>
                  <input className="form-input" type="text" inputMode="numeric" placeholder="Contoh: 50000 atau 50.000"
                    value={amountPaid} 
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, "");
                      setAmountPaid(val ? parseInt(val, 10).toString() : "");
                    }} 
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Catatan (opsional)</label>
                <textarea className="form-textarea" placeholder="Catatan pesanan..."
                  value={notes} onChange={e => setNotes(e.target.value)} rows={3}></textarea>
              </div>

              {/* Total */}
              <div className="checkout-total">
                <span>Total Pembayaran</span>
                <span>Rp {totalAmount.toLocaleString('id-ID')}</span>
              </div>

              <button className="btn btn-primary btn-lg" style={{ width: '100%' }}
                onClick={handleCheckout} disabled={loading || (needsResep && !resepFile)}>
                {loading ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span> Memproses...</> : '✅ Checkout Sekarang'}
              </button>

              {needsResep && !resepFile && (
                <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--danger)' }}>
                  ⚠️ Upload resep dokter terlebih dahulu untuk melanjutkan.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
