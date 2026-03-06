import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRolUsuario } from '../services/rolesService';

export default function EmpresaRoute({ children }) {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [check, setCheck] = useState({ loading: true, allowed: false });

  useEffect(() => {
    if (!user) {
      setCheck({ loading: false, allowed: false });
      return;
    }
    let cancelled = false;
    getRolUsuario(user.uid).then((rol) => {
      if (!cancelled) setCheck({ loading: false, allowed: rol === 'adminEmpresa' });
    });
    return () => { cancelled = true; };
  }, [user]);

  if (authLoading || check.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <p className="text-slate-500">Verificando acceso...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/iniciar-sesion" state={{ from: location }} replace />;
  }

  if (!check.allowed) {
    return <Navigate to="/" replace />;
  }

  return children;
}
