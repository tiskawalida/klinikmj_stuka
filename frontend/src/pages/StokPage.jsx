import { useState, useEffect, useCallback, useRef } from 'react';
import { medicinesAPI } from '../api';
import { useToast } from '../context/ToastContext';

const CATEGORIES = ['Obat Resep', 'Obat Bebas', 'Obat Bebas Terbatas', 'Suplemen', 'Alat Kesehatan'];
const UNITS = ['tablet', 'kapsul', 'botol', 'pcs', 'strip', 'ampul', 'vial', 'softgel', 'sachet'];

const EMPTY_FORM = { name: '', genericName: '', category: 'Obat Bebas', price: '', stock: '', minStock: '10', unit: 'tablet', expiredDate: '', batchNumber: '', description: '', composition: '', dosage: '', sideEffects: '' };

export default function StokPage() {
  const { toast } = useToast();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [csvLoading, setCsvLoading] = useState(false);
  const csvRef = useRef();

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12, sortBy: 'name', order: 'ASC' };
      if (search) params.search = search;
      const res = await medicinesAPI.getAll(params);
      setMedicines(res.data.data);
      setTotalPages(res.data.totalPages);
      setTotal(res.data.total);
    } catch { } finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const openAdd = () => { setForm(EMPTY_FORM); setEditId(null); setImageFile(null); setShowModal(true); };
  const openEdit = (med) => {
    setForm({ name: med.name, genericName: med.genericName || '', category: med.category, price: med.price, stock: med.stock, minStock: med.minStock, unit: med.unit, expiredDate: med.expiredDate || '', batchNumber: med.batchNumber || '', description: med.description || '', composition: med.composition || '', dosage: med.dosage || '', sideEffects: med.sideEffects || '' });
    setEditId(med.id); setImageFile(null); setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (imageFile) fd.append('image', imageFile);
      if (editId) {
        await medicinesAPI.update(editId, fd);
        toast.success('Obat berhasil diperbarui!');
      } else {
        await medicinesAPI.create(fd);
        toast.success('Obat berhasil ditambahkan!');
      }
      setShowModal(false); fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal menyimpan obat.'); }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Hapus obat "${name}"?`)) return;
    try { await medicinesAPI.delete(id); toast.success('Obat dihapus.'); fetch(); }
    catch (err) { toast.error(err.response?.data?.message || 'Gagal menghapus.'); }
  };

  const handleCsvImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvLoading(true);
    try {
      const res = await medicinesAPI.batchImport(file);
      toast.success(`Import selesai: ${res.data.results?.length || 0} berhasil`);
      fetch();
    } catch (err) { toast.error('Import CSV gagal.'); }
    finally { setCsvLoading(false); e.target.value = ''; }
  };

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div className="page-header-left">
          <h1>📦 Manajemen Stok Obat</h1>
          <p>Total {total} obat terdaftar</p>
        </div>
        <div className="page-header-actions">
          <input ref={csvRef} type="file" accept=".csv" onChange={handleCsvImport} style={{ display: 'none' }} />
          <button className="btn btn-secondary" onClick={() => csvRef.current?.click()} disabled={csvLoading}>
            {csvLoading ? '⏳ Mengimpor...' : '📂 Import CSV'}
          </button>
          <button className="btn btn-primary" onClick={openAdd}>＋ Tambah Obat</button>
        </div>
      </div>

      {/* Search */}
      <div className="search-bar" style={{ maxWidth: 400, marginBottom: 16 }}>
        <span className="search-icon">🔍</span>
        <input type="text" placeholder="Cari nama obat..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
      </div>

      <div className="card">
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          {loading ? (
            <div className="loading-overlay"><div className="spinner"></div><p>Memuat...</p></div>
          ) : (
            <table>
              <thead><tr>
                <th>Nama Obat</th><th>Kategori</th><th>Harga</th>
                <th>Stok</th><th>Min. Stok</th><th>Kadaluarsa</th><th>Status</th><th>Aksi</th>
              </tr></thead>
              <tbody>
                {medicines.map(med => {
                  const isLow = med.stock <= med.minStock;
                  const isExpiring = med.expiredDate && Math.ceil((new Date(med.expiredDate) - new Date()) / 86400000) <= 30;
                  return (
                    <tr key={med.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{med.name}</div>
                        {med.genericName && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{med.genericName}</div>}
                      </td>
                      <td>
                        <span className={`badge ${med.category === 'Obat Resep' ? 'badge-danger' : med.category === 'Suplemen' ? 'badge-info' : 'badge-success'}`}>
                          {med.category}
                        </span>
                      </td>
                      <td>Rp {parseFloat(med.price).toLocaleString('id-ID')}</td>
                      <td style={{ color: isLow ? 'var(--danger)' : 'inherit', fontWeight: isLow ? 700 : 400 }}>
                        {med.stock} {med.unit}
                      </td>
                      <td>{med.minStock}</td>
                      <td style={{ color: isExpiring ? 'var(--danger)' : 'inherit', fontSize: '0.85rem' }}>
                        {med.expiredDate ? new Date(med.expiredDate).toLocaleDateString('id-ID') : '—'}
                      </td>
                      <td>
                        {isLow && <span className="badge badge-danger">⚠️ Kritis</span>}
                        {isExpiring && <span className="badge badge-warning" style={{ marginLeft: 4 }}>⏰ Exp</span>}
                        {!isLow && !isExpiring && <span className="badge badge-success">✅ Normal</span>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(med)}>✏️</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(med.id, med.name)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 680 }}>
            <div className="modal-header">
              <h2>{editId ? '✏️ Edit Obat' : '＋ Tambah Obat Baru'}</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Nama Obat <span className="required">*</span></label>
                    <input name="name" className="form-input" value={form.name} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nama Generik</label>
                    <input name="genericName" className="form-input" value={form.genericName} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Kategori <span className="required">*</span></label>
                    <select name="category" className="form-select" value={form.category} onChange={handleChange}>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Satuan</label>
                    <select name="unit" className="form-select" value={form.unit} onChange={handleChange}>
                      {UNITS.map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Harga (Rp) <span className="required">*</span></label>
                    <input name="price" type="number" className="form-input" value={form.price} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Stok Saat Ini <span className="required">*</span></label>
                    <input name="stock" type="number" className="form-input" value={form.stock} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Stok Minimum</label>
                    <input name="minStock" type="number" className="form-input" value={form.minStock} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tanggal Kadaluarsa</label>
                    <input name="expiredDate" type="date" className="form-input" value={form.expiredDate} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">No. Batch</label>
                    <input name="batchNumber" className="form-input" value={form.batchNumber} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Foto Obat</label>
                    <input type="file" className="form-input" accept="image/*" onChange={e => setImageFile(e.target.files[0])} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Deskripsi</label>
                  <textarea name="description" className="form-textarea" value={form.description} onChange={handleChange} rows={2}></textarea>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Komposisi</label>
                    <textarea name="composition" className="form-textarea" value={form.composition} onChange={handleChange} rows={2}></textarea>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Dosis</label>
                    <input name="dosage" className="form-input" value={form.dosage} onChange={handleChange} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Efek Samping</label>
                  <textarea name="sideEffects" className="form-textarea" value={form.sideEffects} onChange={handleChange} rows={2}></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">
                  {editId ? '💾 Simpan Perubahan' : '＋ Tambahkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
