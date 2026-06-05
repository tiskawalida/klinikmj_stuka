import { useState, useEffect } from 'react';
import { usersAPI } from '../api';
import { useToast } from '../context/ToastContext';

const ROLES = ['Admin', 'Apoteker', 'Kasir', 'Pasien'];
const EMPTY = { username: '', email: '', password: '', role: 'Pasien', fullName: '', phone: '', address: '' };

export default function UsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const fetch = async () => {
    setLoading(true);
    try { const res = await usersAPI.getAll(); setUsers(res.data.data); }
    catch { } finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, []);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const openAdd = () => { setForm(EMPTY); setEditId(null); setShowModal(true); };
  const openEdit = (u) => {
    setForm({ username: u.username, email: u.email, password: '', role: u.role, fullName: u.fullName || '', phone: u.phone || '', address: u.address || '' });
    setEditId(u.id); setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...form };
      if (!data.password) delete data.password;
      if (editId) { await usersAPI.update(editId, data); toast.success('Pengguna diperbarui!'); }
      else { await usersAPI.create(data); toast.success('Pengguna ditambahkan!'); }
      setShowModal(false); fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal menyimpan.'); }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Nonaktifkan pengguna "${name}"?`)) return;
    try { await usersAPI.delete(id); toast.success('Pengguna dinonaktifkan.'); fetch(); }
    catch (err) { toast.error(err.response?.data?.message || 'Gagal.'); }
  };

  const ROLE_COLORS = { Admin: 'badge-danger', Apoteker: 'badge-info', Kasir: 'badge-warning', Pasien: 'badge-success' };

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div className="page-header-left">
          <h1>👥 Manajemen Pengguna</h1>
          <p>{users.length} pengguna terdaftar</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>＋ Tambah Pengguna</button>
      </div>

      <div className="card">
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          {loading ? (
            <div className="loading-overlay"><div className="spinner"></div><p>Memuat...</p></div>
          ) : (
            <table>
              <thead><tr><th>Nama Lengkap</th><th>Username</th><th>Email</th><th>Role</th><th>Telepon</th><th>Status</th><th>Login Terakhir</th><th>Aksi</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{u.fullName || '—'}</td>
                    <td><code style={{ fontSize: '0.85rem' }}>{u.username}</code></td>
                    <td style={{ fontSize: '0.85rem' }}>{u.email}</td>
                    <td><span className={`badge ${ROLE_COLORS[u.role]}`}>{u.role}</span></td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{u.phone || '—'}</td>
                    <td>
                      <span className={`badge ${u.isActive ? 'badge-success' : 'badge-muted'}`}>
                        {u.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('id-ID') : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(u)}>✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.id, u.username)}>🚫</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2>{editId ? '✏️ Edit Pengguna' : '＋ Tambah Pengguna'}</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Username <span className="required">*</span></label>
                    <input name="username" className="form-input" value={form.username} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role <span className="required">*</span></label>
                    <select name="role" className="form-select" value={form.role} onChange={handleChange}>
                      {ROLES.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email <span className="required">*</span></label>
                    <input name="email" type="email" className="form-input" value={form.email} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password {editId && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(kosongkan jika tidak berubah)</span>}</label>
                    <input name="password" type="password" className="form-input" value={form.password} onChange={handleChange} required={!editId} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nama Lengkap</label>
                    <input name="fullName" className="form-input" value={form.fullName} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">No. Telepon</label>
                    <input name="phone" className="form-input" value={form.phone} onChange={handleChange} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Alamat</label>
                  <textarea name="address" className="form-textarea" value={form.address} onChange={handleChange} rows={2}></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">{editId ? '💾 Simpan' : '＋ Tambahkan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
