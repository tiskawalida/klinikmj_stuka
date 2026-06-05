import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useEffect, useRef } from 'react';

/**
 * ProtectedRoute — Komponen pelindung rute berbasis peran
 * @param {string[]} allowedRoles - Peran yang diizinkan
 * @param {ReactNode} children - Konten yang dilindungi
 */
export default function ProtectedRoute({ allowedRoles, children }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const notified = useRef(false);

  const isAllowed = user && allowedRoles.includes(user.role);

  useEffect(() => {
    if (user && !isAllowed && !notified.current) {
      notified.current = true;
      toast.error(`⛔ Akses Ditolak. Halaman ini hanya untuk: ${allowedRoles.join(', ')}.`);
    }
  }, [user, isAllowed, allowedRoles, toast]);

  if (!user) return <Navigate to="/" replace />;
  if (!isAllowed) return <Navigate to="/dashboard" replace />;
  return children;
}
