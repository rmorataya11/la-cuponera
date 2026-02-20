import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function NavLink({ to, children }) {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
  return (
    <Link
      to={to}
      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ${
        isActive
          ? 'text-blue-800 bg-blue-100'
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
      }`}
    >
      {children}
    </Link>
  );
}

export default function Layout() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/80">
      <header className="bg-white/90 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <Link
            to="/"
            className="text-lg font-semibold tracking-tight text-slate-900 hover:text-blue-800 transition-colors duration-150"
          >
            Cuponía
          </Link>
          <nav className="flex items-center gap-0.5">
            <NavLink to="/">Inicio</NavLink>
            <NavLink to="/ofertas">Ofertas</NavLink>
            {!loading && (
              <>
                {user ? (
                  <>
                    <NavLink to="/mis-cupones">Mis cupones</NavLink>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="ml-1 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors duration-150"
                    >
                      Cerrar sesión
                    </button>
                  </>
                ) : (
                  <>
                    <NavLink to="/registro">Registro</NavLink>
                    <Link
                      to="/iniciar-sesion"
                      className="ml-1 px-4 py-2 text-sm font-medium text-white bg-blue-800 hover:bg-blue-900 rounded-lg transition-colors duration-150"
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
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Outlet />
      </main>
    </div>
  );
}
