import { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRolUsuario } from '../services/rolesService';
import { getClienteByUid, getEmpresaByAdminUid } from '../services/adminService';
import HeroBackground from './HeroBackground';

function NavLink({ to, children }) {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
  return (
    <Link
      to={to}
      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ${
        isActive
          ? 'text-[#2097A9] bg-[#e8f4f6]'
          : 'text-slate-600 hover:text-[#2097A9] hover:bg-slate-100'
      }`}
    >
      {children}
    </Link>
  );
}

function NavbarBrand({ empresaNombre, rol }) {
  const label = rol === 'adminEmpresa' && empresaNombre ? empresaNombre : 'Cuponía';
  return (
    <Link
      to="/"
      className="inline-flex min-w-0 max-w-[min(100%,220px)] sm:max-w-none transition-opacity duration-150 hover:opacity-90"
      title={empresaNombre || 'Cuponía'}
      aria-label={label}
    >
      <span className="inline-flex items-center gap-0 min-w-0">
        <img
          src="/logo_cuponia.png"
          alt=""
          className="h-10 sm:h-11 w-auto shrink-0 object-contain object-left select-none"
          draggable={false}
          aria-hidden
        />
        <span className="-ml-1 text-xl font-semibold tracking-tight text-[#2097A9] truncate leading-none">
          {label}
        </span>
      </span>
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
  const showHeroBackground =
    location.pathname === '/' ||
    location.pathname.startsWith('/registro') ||
    location.pathname.startsWith('/ofertas');

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
    <div className={`min-h-screen flex flex-col relative ${showHeroBackground ? '' : 'bg-slate-50/80'}`}>
      {showHeroBackground && <HeroBackground />}
      <header className={`border-b border-slate-200/60 sticky top-0 z-20 ${showHeroBackground ? 'bg-white/80 backdrop-blur-md' : 'bg-white/90 backdrop-blur-sm'}`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <NavbarBrand empresaNombre={empresaNombre} rol={rol} />
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
                      className="ml-1 px-4 py-2 text-sm font-medium text-white bg-[#2097A9] hover:bg-[#1a7a89] rounded-lg transition-colors duration-150"
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
