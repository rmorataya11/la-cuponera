import { useState, useEffect, useRef } from 'react';
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
      className={`px-2.5 py-2 text-sm font-medium rounded-lg transition-colors duration-150 whitespace-nowrap ${
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
  const isLongEmpresa = rol === 'adminEmpresa' && empresaNombre && empresaNombre.length > 18;
  return (
    <Link
      to="/"
      className="flex items-center gap-1.5 min-w-0 shrink-0 max-w-[min(100%,280px)] sm:max-w-[min(100%,320px)] md:max-w-md transition-opacity duration-150 hover:opacity-90"
      title={label}
      aria-label={label}
    >
      <img
        src="/logo_cuponia.png"
        alt=""
        className="h-9 sm:h-10 w-auto shrink-0 object-contain object-left select-none"
        draggable={false}
        aria-hidden
      />
      <span
        className={`text-lg sm:text-xl font-semibold tracking-tight text-[#2097A9] leading-tight ${
          isLongEmpresa ? 'truncate' : ''
        }`}
      >
        {label}
      </span>
    </Link>
  );
}

function UserMenu({ email, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex items-center gap-1.5 px-2.5 py-2 text-sm font-medium rounded-lg text-slate-700 hover:bg-slate-100 border border-slate-200/80 bg-white/90 shadow-sm transition-colors duration-150 max-w-[200px] sm:max-w-xs"
      >
        <span className="truncate text-left" title={email}>
          {email}
        </span>
        <svg className={`w-4 h-4 shrink-0 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div
          className="absolute right-0 mt-1.5 min-w-[220px] max-w-[min(calc(100vw-2rem),280px)] rounded-xl border border-slate-200/90 bg-white py-1 shadow-lg z-30"
          role="menu"
        >
          <div className="px-3 py-2.5 text-xs text-slate-500 border-b border-slate-100 break-all">
            {email}
          </div>
          <Link
            to="/restablecer-contrasena"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Restablecer contraseña
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="w-full text-left px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
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
    location.pathname.startsWith('/ofertas') ||
    location.pathname.startsWith('/iniciar-sesion');

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

  const userEmail = user && !loading ? user.email : null;

  return (
    <div className={`min-h-screen flex flex-col relative ${showHeroBackground ? '' : 'bg-slate-50/80'}`}>
      {showHeroBackground && <HeroBackground />}
      <header className={`border-b border-slate-200/60 sticky top-0 z-20 ${showHeroBackground ? 'bg-white/85 backdrop-blur-md' : 'bg-white/95 backdrop-blur-sm'}`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <NavbarBrand empresaNombre={empresaNombre} rol={rol} />

          <nav className="flex flex-wrap items-center gap-y-2 gap-x-0.5 sm:justify-end sm:flex-1 sm:min-w-0">
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
                        className="px-2.5 py-2 text-sm font-medium rounded-lg transition-colors duration-150 text-amber-800 hover:bg-amber-50 whitespace-nowrap"
                      >
                        Panel admin
                      </Link>
                    )}
                    {rol === 'adminEmpresa' && (
                      <Link
                        to="/panel-empresa"
                        className="px-2.5 py-2 text-sm font-medium rounded-lg transition-colors duration-150 text-amber-800 hover:bg-amber-50 whitespace-nowrap"
                      >
                        Panel empresa
                      </Link>
                    )}
                    {rol === 'empleado' && (
                      <Link
                        to="/canjear"
                        className="px-2.5 py-2 text-sm font-medium rounded-lg transition-colors duration-150 text-emerald-800 hover:bg-emerald-50 whitespace-nowrap"
                      >
                        Canjear cupón
                      </Link>
                    )}
                    {(rol === 'cliente' || !rol) && (
                      <Link
                        to="/activar-empresa"
                        className="px-2.5 py-2 text-sm font-medium rounded-lg transition-colors duration-150 text-slate-600 hover:text-slate-900 hover:bg-slate-100 whitespace-nowrap"
                      >
                        Activar empresa
                      </Link>
                    )}
                    {userEmail && (
                      <div className="w-full sm:w-auto sm:pl-1 flex sm:inline-flex justify-end sm:justify-start">
                        <UserMenu email={userEmail} onLogout={handleLogout} />
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <NavLink to="/registro">Registro</NavLink>
                    <Link
                      to="/iniciar-sesion"
                      className="px-3 py-2 text-sm font-medium text-white bg-[#2097A9] hover:bg-[#1a7a89] rounded-lg transition-colors duration-150 whitespace-nowrap"
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
