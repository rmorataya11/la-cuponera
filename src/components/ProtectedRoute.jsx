import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/iniciar-sesion" state={{ from: location }} replace />;
  }

  return children;
}
