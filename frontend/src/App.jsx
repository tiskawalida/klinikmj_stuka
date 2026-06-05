import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ToastProvider } from './context/ToastContext';
import { CartProvider } from './context/CartContext';
import Toast from './components/Toast';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import KatalogPage from './pages/KatalogPage';
import KeranjangPage from './pages/KeranjangPage';
import TransaksiPage from './pages/TransaksiPage';
import StokPage from './pages/StokPage';
import LaporanPage from './pages/LaporanPage';
import MonitoringPage from './pages/MonitoringPage';
import UsersPage from './pages/UsersPage';

import './pages/MonitoringPage.css';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
        <p>Memuat sistem...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LoginPage />
        <Toast />
      </>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Header />
        <div className="page-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />

            <Route path="/katalog" element={
              <ProtectedRoute allowedRoles={['Admin', 'Apoteker', 'Kasir', 'Pasien']}>
                <KatalogPage />
              </ProtectedRoute>
            } />

            <Route path="/keranjang" element={
              <ProtectedRoute allowedRoles={['Kasir', 'Pasien']}>
                <KeranjangPage />
              </ProtectedRoute>
            } />

            <Route path="/transaksi" element={
              <ProtectedRoute allowedRoles={['Admin', 'Kasir', 'Pasien']}>
                <TransaksiPage />
              </ProtectedRoute>
            } />

            <Route path="/stok" element={
              <ProtectedRoute allowedRoles={['Admin', 'Apoteker']}>
                <StokPage />
              </ProtectedRoute>
            } />

            <Route path="/laporan" element={
              <ProtectedRoute allowedRoles={['Admin', 'Apoteker']}>
                <LaporanPage />
              </ProtectedRoute>
            } />

            <Route path="/monitoring" element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <MonitoringPage />
              </ProtectedRoute>
            } />

            <Route path="/users" element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <UsersPage />
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </div>
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <SocketProvider>
            <CartProvider>
              <AppContent />
            </CartProvider>
          </SocketProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
