import { useState, useEffect, useCallback } from 'react';
import { medicinesAPI } from '../api';
import MedicineCard from '../components/MedicineCard';
import './KatalogPage.css';

const CATEGORIES = ['Semua', 'Obat Resep', 'Obat Bebas', 'Obat Bebas Terbatas', 'Suplemen', 'Alat Kesehatan'];

export default function KatalogPage() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Semua');
  const [sortBy, setSortBy] = useState('name');
  const [order, setOrder] = useState('ASC');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchMedicines = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12, sortBy, order };
      if (search) params.search = search;
      if (category !== 'Semua') params.category = category;
      const res = await medicinesAPI.getAll(params);
      setMedicines(res.data.data);
      setTotalPages(res.data.totalPages);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, category, sortBy, order, page]);

  useEffect(() => { fetchMedicines(); }, [fetchMedicines]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setPage(1), 400);
    return () => clearTimeout(t);
  }, [search, category]);

  return (
    <div className="katalog-page animate-fade">
      <div className="page-header">
        <div className="page-header-left">
          <h1>💊 Katalog Obat</h1>
          <p>Tersedia <strong>{total}</strong> jenis obat dan alat kesehatan</p>
        </div>
      </div>

      {/* Search & Sort Bar */}
      <div className="katalog-toolbar">
        <div className="search-bar" style={{ flex: 1, maxWidth: 400 }}>
          <span className="search-icon">🔍</span>
          <input
            type="text" placeholder="Cari nama obat, komposisi..."
            value={search} onChange={e => { setSearch(e.target.value); }}
          />
        </div>
        <div className="katalog-sort">
          <select className="form-select" value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ width: 140 }}>
            <option value="name">Nama</option>
            <option value="price">Harga</option>
            <option value="stock">Stok</option>
          </select>
          <button className="btn btn-ghost btn-sm" onClick={() => setOrder(o => o === 'ASC' ? 'DESC' : 'ASC')}>
            {order === 'ASC' ? '↑ A-Z' : '↓ Z-A'}
          </button>
        </div>
      </div>

      {/* Category Filters */}
      <div className="filter-bar">
        {CATEGORIES.map(cat => (
          <button key={cat} className={`filter-chip ${category === cat ? 'active' : ''}`}
            onClick={() => { setCategory(cat); setPage(1); }}>
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Memuat katalog obat...</p>
        </div>
      ) : medicines.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>Obat tidak ditemukan</h3>
          <p>Coba kata kunci atau filter kategori yang berbeda.</p>
        </div>
      ) : (
        <>
          <div className="medicine-grid">
            {medicines.map(med => <MedicineCard key={med.id} medicine={med} />)}
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
                <button key={p} className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
