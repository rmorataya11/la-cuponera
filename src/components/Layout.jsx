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
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-10 shadow-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link
            to="/"
            className="text-xl font-bold tracking-tight text-slate-900 hover:text-orange-600 transition"
          >
            Cuponía
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              to="/"
              className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-orange-600 hover:bg-slate-50 rounded-lg transition"
            >
              Inicio
            </Link>
            <Link
              to="/ofertas"
              className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-orange-600 hover:bg-slate-50 rounded-lg transition"
            >
              Ofertas
            </Link>
            {!loading && (
              <>
                {user ? (
                  <>
                    <Link
                      to="/mis-cupones"
                      className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-orange-600 hover:bg-slate-50 rounded-lg transition"
                    >
                      Mis cupones
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-orange-600 hover:bg-slate-50 rounded-lg transition"
                    >
                      Cerrar sesión
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/registro"
                      className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-orange-600 hover:bg-slate-50 rounded-lg transition"
                    >
                      Registro
                    </Link>
                    <Link
                      to="/iniciar-sesion"
                      className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition shadow-sm"
                    >
                      Iniciar sesión
                    </Link>
                  </>
                )}
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <Outlet />
      </main>
    </div>
  );
}
