import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './LoginPage.css';

export default function LoginPage() {
  const { login, register } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', email: '', fullName: '', phone: '' });
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.username, form.password);
        toast.success('Selamat datang kembali! 👋');
      } else {
        if (form.password.length < 8) { toast.error('Password minimal 8 karakter.'); return; }
        await register(form);
        toast.success('Registrasi berhasil! Selamat datang 🎉');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const DEMO_ACCOUNTS = [
    { role: 'Admin', username: 'admin', password: 'Admin@1234', color: '#ef4444' },
    { role: 'Apoteker', username: 'apoteker', password: 'Apo@12345', color: '#3b82f6' },
    { role: 'Kasir', username: 'kasir', password: 'Kasir@123', color: '#f59e0b' },
    { role: 'Pasien', username: 'pasien', password: 'Pasien@123', color: '#10b981' },
  ];

  return (
    <div className="login-page">
      {/* Left Panel */}
      <div className="login-left">
        <div className="login-left-content">
          <div className="login-brand">
            <div className="login-logo">🏥</div>
            <div>
              <h1>Klinik Makmur Jaya</h1>
              <p>Sistem E-Commerce Apotek Online</p>
            </div>
          </div>


        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="login-right">
        <div className="login-card">
          {/* Tabs */}
          <div className="login-tabs">
            <button className={`login-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>
              Masuk
            </button>
            <button className={`login-tab ${mode === 'register' ? 'active' : ''}`} onClick={() => setMode('register')}>
              Daftar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">Nama Lengkap</label>
                <input name="fullName" className="form-input" placeholder="Nama lengkap Anda"
                  value={form.fullName} onChange={handleChange} />
              </div>
            )}
            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">Email <span className="required">*</span></label>
                <input name="email" type="email" className="form-input" placeholder="email@contoh.com"
                  value={form.email} onChange={handleChange} required />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Username <span className="required">*</span></label>
              <input name="username" className="form-input" placeholder="Masukkan username"
                value={form.username} onChange={handleChange} required autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Password <span className="required">*</span></label>
              <div style={{ position: 'relative' }}>
                <input name="password" type={showPass ? 'text' : 'password'} className="form-input"
                  placeholder={mode === 'register' ? 'Min. 8 karakter' : 'Masukkan password'}
                  value={form.password} onChange={handleChange} required style={{ paddingRight: '44px' }} />
                <button type="button" className="toggle-pass" onClick={() => setShowPass(s => !s)}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">No. HP</label>
                <input name="phone" className="form-input" placeholder="08xxxxxxxxxx"
                  value={form.phone} onChange={handleChange} />
              </div>
            )}
            <button type="submit" className="btn btn-primary btn-lg login-submit" disabled={loading}>
              {loading ? <span className="spinner" style={{width:20,height:20,borderWidth:2}}></span> : null}
              {loading ? 'Memproses...' : mode === 'login' ? '🔑 Masuk' : '📝 Daftar Sekarang'}
            </button>
          </form>

          {/* Demo accounts */}
          {mode === 'login' && (
            <div className="demo-accounts">
              <p className="demo-title">Akun Demo BNSP</p>
              <div className="demo-grid">
                {DEMO_ACCOUNTS.map(acc => (
                  <button key={acc.role} className="demo-btn"
                    style={{ borderColor: acc.color + '44', background: acc.color + '11' }}
                    onClick={() => setForm(f => ({ ...f, username: acc.username, password: acc.password }))}>
                    <span className="demo-role" style={{ color: acc.color }}>{acc.role}</span>
                    <span className="demo-user">{acc.username}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
