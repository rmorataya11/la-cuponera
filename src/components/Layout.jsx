import { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRolUsuario } from '../services/rolesService';
import { getClienteByUid, getEmpresaByAdminUid } from '../services/adminService';

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
  const location = useLocation();
  const [rol, setRol] = useState(null);
  const [clienteNombre, setClienteNombre] = useState(null);
  const [empresaNombre, setEmpresaNombre] = useState(null);

  const isFullWidthRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/panel-empresa') || location.pathname.startsWith('/canjear');
  const isHome = location.pathname === '/';

  useEffect(() => {
    if (!user) {
      setRol(null);
      setClienteNombre(null);
      setEmpresaNombre(null);
      return;
    }
    let cancelled = false;
    getRolUsuario(user.uid).then((r) => {
      if (!cancelled) setRol(r);
    });
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (!user || rol !== 'cliente') {
      setClienteNombre(null);
      return;
    }
    let cancelled = false;
    getClienteByUid(user.uid).then((c) => {
      if (!cancelled) setClienteNombre(c?.nombre ?? null);
    });
    return () => { cancelled = true; };
  }, [user, rol]);

  useEffect(() => {
    if (!user || rol !== 'adminEmpresa') {
      setEmpresaNombre(null);
      return;
    }
    let cancelled = false;
    getEmpresaByAdminUid(user.uid).then((emp) => {
      if (!cancelled) setEmpresaNombre(emp?.nombre ?? null);
    });
    return () => { cancelled = true; };
  }, [user, rol]);

  function handleLogout() {
    logout();
    navigate('/');
  }

  const userDisplay = user && !loading && user.email;

  return (
    <div className={`min-h-screen flex flex-col relative ${isHome ? '' : 'bg-slate-50/80'}`}>
      {isHome && (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-100 via-white to-blue-50/90" />
          <div
            className="absolute -top-32 -right-24 h-[min(55vw,28rem)] w-[min(55vw,28rem)] rounded-full bg-blue-800/[0.06] blur-2xl"
            aria-hidden
          />
          <div
            className="absolute bottom-0 left-0 right-0 h-[min(28vh,200px)] text-blue-900/[0.07]"
            aria-hidden
          >
            <svg
              className="h-full w-full"
              viewBox="0 0 1440 120"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill="currentColor"
                d="M0,48L60,52C120,56,240,64,360,58.7C480,53,600,43,720,42.7C840,43,960,53,1080,58.7C1200,64,1320,64,1380,64L1440,64L1440,120L1380,120C1320,120,1200,120,1080,120C960,120,840,120,720,120C600,120,480,120,360,120C240,120,120,120,60,120L0,120Z"
              />
            </svg>
          </div>
        </div>
      )}
      <header className={`border-b border-slate-200/60 sticky top-0 z-20 ${isHome ? 'bg-white/80 backdrop-blur-md' : 'bg-white/90 backdrop-blur-sm'}`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <Link
            to="/"
            className="text-lg font-semibold tracking-tight text-slate-900 hover:text-blue-800 transition-colors duration-150 truncate max-w-[200px] sm:max-w-none"
            title={empresaNombre || 'Cuponía'}
          >
            {rol === 'adminEmpresa' && empresaNombre ? empresaNombre : 'Cuponía'}
          </Link>
          <nav className="flex items-center gap-0.5">
            <NavLink to="/">Inicio</NavLink>
            {(!loading && (!user || rol === 'cliente')) && (
              <>
                <NavLink to="/ofertas">Ofertas</NavLink>
                {user && <NavLink to="/mis-cupones">Mis cupones</NavLink>}
              </>
            )}
            {!loading && (
              <>
                {user ? (
                  <>
                    {rol === 'admin' && (
                      <Link
                        to="/admin"
                        className="px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150 text-amber-700 hover:text-amber-800 hover:bg-amber-50"
                      >
                        Panel admin
                      </Link>
                    )}
                    {rol === 'adminEmpresa' && (
                      <Link
                        to="/panel-empresa"
                        className="px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150 text-amber-700 hover:text-amber-800 hover:bg-amber-50"
                      >
                        Panel empresa
                      </Link>
                    )}
                    {rol === 'empleado' && (
                      <Link
                        to="/canjear"
                        className="px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
                      >
                        Canjear cupón
                      </Link>
                    )}
                    {(rol === 'cliente' || !rol) && (
                      <Link
                        to="/activar-empresa"
                        className="px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      >
                        Activar empresa
                      </Link>
                    )}
                    {userDisplay && (
                      <span className="px-3 py-2 text-sm text-slate-600 truncate max-w-[180px]" title={user.email}>
                        {userDisplay}
                      </span>
                    )}
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
      <main className={`relative z-10 flex-1 w-full ${isFullWidthRoute ? 'p-0 min-h-0' : 'max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12'}`}>
        {!isFullWidthRoute && rol === 'cliente' && clienteNombre && (
          <p className="text-slate-600 text-lg mb-4 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>Bienvenido, {clienteNombre}.</p>
        )}
        <div key={location.pathname} className="animate-fade-in-up min-h-0" style={{ animationDelay: '0.08s' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
