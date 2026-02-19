import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-orange-600 hover:text-orange-700">
            La Cuponera
          </Link>
          <nav className="flex items-center gap-6">
            <Link to="/" className="text-gray-600 hover:text-orange-600 font-medium">
              Inicio
            </Link>
            <Link to="/ofertas" className="text-gray-600 hover:text-orange-600 font-medium">
              Ofertas
            </Link>
            {!loading && (
              <>
                {user ? (
                  <>
                    <Link to="/mis-cupones" className="text-gray-600 hover:text-orange-600 font-medium">
                      Mis cupones
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="text-gray-600 hover:text-orange-600 font-medium"
                    >
                      Cerrar sesión
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/registro" className="text-gray-600 hover:text-orange-600 font-medium">
                      Registro
                    </Link>
                    <Link to="/iniciar-sesion" className="text-gray-600 hover:text-orange-600 font-medium">
                      Iniciar sesión
                    </Link>
                  </>
                )}
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
