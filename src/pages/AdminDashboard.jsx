import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getOfertasTodas,
  updateOfertaEstado,
  addOferta,
  getRubros,
  addRubro,
  updateRubro,
  getEmpresas,
  addEmpresa,
  getClientesTodos,
  getCuponesTodos,
} from '../services/adminService';

// --- Paleta (valores que Tailwind no cubre) ---
const PRIMARY = '#2d3fc2';
const PRIMARY_HOVER = '#1e2fa0';
const PRIMARY_LIGHT_BG = '#dbeafe';
const PRIMARY_LIGHT_TEXT = '#1d4ed8';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '▣' },
  { id: 'rubros', label: 'Rubros', icon: '🏷️' },
  { id: 'empresas', label: 'Empresas', icon: '🏢' },
  { id: 'ofertas', label: 'Ofertas', icon: '🎫', badgeKey: 'ofertasPendientes' },
  { id: 'clientes', label: 'Clientes', icon: '👥' },
  { id: 'cupones', label: 'Cupones', icon: '🎟️' },
];

const SECTION_TITLES = {
  dashboard: { title: 'Dashboard', subtitle: 'Resumen general' },
  rubros: { title: 'Rubros', subtitle: 'Categorías de ofertas' },
  empresas: { title: 'Empresas', subtitle: 'Empresas ofertantes' },
  ofertas: { title: 'Ofertas', subtitle: 'Gestión de promociones' },
  clientes: { title: 'Clientes', subtitle: 'Usuarios registrados' },
  cupones: { title: 'Cupones', subtitle: 'Cupones vendidos y canjeados' },
};

// --- Helper ---
function diasHasta(fechaStr) {
  const hoy = new Date('2026-03-03');
  const f = new Date(fechaStr);
  const diff = f - hoy;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/** Actividad de los últimos 7 días a partir de cupones (fechaCompra o fecha). */
function actividadDesdeCupones(cupones) {
  const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const hoy = new Date();
  const porDia = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(hoy);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    porDia[key] = { label: dias[d.getDay()], cupones: 0, ingresos: 0 };
  }
  for (const c of cupones) {
    const fecha = (c.fechaCompra || c.fecha || '').toString().slice(0, 10);
    if (porDia[fecha]) {
      porDia[fecha].cupones += 1;
    }
  }
  return Object.keys(porDia)
    .sort()
    .map((k) => porDia[k]);
}

function mapOfertasParaUI(ofertas, empresas, rubros) {
  return ofertas.map((o) => {
    const emp = empresas.find((e) => e.id === o.empresaId);
    const rub = rubros.find((r) => r.id === o.rubroId);
    return {
      id: o.id,
      titulo: o.titulo,
      empresa: emp?.nombre ?? o.empresaId ?? '—',
      rubro: rub?.nombre ?? o.rubroId ?? '—',
      precio: o.precioOferta ?? o.precioRegular ?? 0,
      vendidos: o.cuponesVendidos ?? 0,
      limite: o.cantidadLimite ?? null,
      estado: (o.estado || 'pendiente').toLowerCase(),
      inicio: o.fechaInicio,
      fin: o.fechaFin,
      fechaLimiteUso: o.fechaLimiteUso,
    };
  });
}

export default function CuponiaAdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileRef = useRef(null);
  const [ofertas, setOfertas] = useState([]);
  const [rubros, setRubros] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [cupones, setCupones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      getOfertasTodas(),
      getRubros(),
      getEmpresas(),
      getClientesTodos(),
      getCuponesTodos(),
    ])
      .then(([ofertasRaw, rubrosRaw, empresasRaw, clientesRaw, cuponesRaw]) => {
        if (cancelled) return;
        setEmpresas(empresasRaw);
        setRubros(rubrosRaw);
        setClientes(clientesRaw);
        setCupones(cuponesRaw);
        setOfertas(mapOfertasParaUI(ofertasRaw, empresasRaw, rubrosRaw));
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message ?? 'Error al cargar datos');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    }
    if (profileMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [profileMenuOpen]);

  function handleLogout() {
    logout();
    navigate('/');
  }

  const ofertasPendientes = ofertas.filter((o) => o.estado === 'pendiente').length;

  const sec = SECTION_TITLES[activeTab] ?? SECTION_TITLES.dashboard;

  return (
    <div className="flex min-h-screen bg-[#f1f5f9]" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      {/* Sidebar */}
      <aside
        className="flex flex-col bg-white border-r border-slate-200 shrink-0 transition-[width] duration-300 ease-in-out overflow-hidden"
        style={{ width: sidebarCollapsed ? 64 : 224 }}
      >
        <div className="flex items-center gap-3 h-16 px-4 border-b border-slate-100 shrink-0">
          <div
            className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: PRIMARY }}
          >
            C
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="font-bold text-slate-900 truncate text-sm">Cuponia</p>
              <p className="text-xs text-slate-500 truncate">Panel de Administración</p>
            </div>
          )}
        </div>

        <nav className="flex-1 py-3 px-2 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            const showBadge = item.badgeKey === 'ofertasPendientes' && ofertasPendientes > 0;
            return (
              <NavItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                badge={showBadge ? ofertasPendientes : null}
                isActive={isActive}
                collapsed={sidebarCollapsed}
                onClick={() => setActiveTab(item.id)}
              />
            );
          })}
        </nav>

        <div className="p-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setSidebarCollapsed((c) => !c)}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors text-sm"
          >
            <span
              className="transition-transform duration-300 inline-block"
              style={{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              ←
            </span>
            {!sidebarCollapsed && <span>Colapsar</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 shrink-0 flex items-center justify-between px-6 bg-white border-b border-slate-200 shadow-sm">
          <div>
            <h1 className="font-bold text-slate-900 text-lg">{sec.title}</h1>
            <p className="text-xs text-slate-400">{sec.subtitle}</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="relative p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              title="Notificaciones"
            >
              🔔
              {ofertasPendientes > 0 && (
                <span
                  className="absolute top-1 right-1 w-2 h-2 rounded-full"
                  style={{ backgroundColor: PRIMARY }}
                />
              )}
            </button>
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileMenuOpen((v) => !v)}
                className="flex items-center gap-3 rounded-lg hover:bg-slate-50 p-1 -m-1 transition-colors"
                aria-expanded={profileMenuOpen}
                aria-haspopup="true"
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0"
                  style={{ backgroundColor: PRIMARY }}
                >
                  A
                </div>
                <div className="hidden sm:block text-left">
                  <p className="font-medium text-slate-900 text-sm">Admin</p>
                  <p className="text-xs text-slate-400">{user?.email ?? 'admin@cuponia.com'}</p>
                </div>
              </button>
              {profileMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-48 py-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50"
                  role="menu"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                    role="menuitem"
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 bg-[#f1f5f9]">
          {error && (
            <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 text-red-800">
              {error}
            </div>
          )}
          {loading ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <p className="text-slate-500">Cargando datos...</p>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardOverview
                  ofertas={ofertas}
                  setOfertas={setOfertas}
                  cupones={cupones}
                  totalClientes={clientes.length}
                  empresas={empresas}
                  onNavigate={setActiveTab}
                />
              )}
              {activeTab === 'rubros' && (
                <RubrosSection
                  rubros={rubros}
                  setRubros={setRubros}
                  onRefetch={async () => {
                    const list = await getRubros();
                    setRubros(list);
                  }}
                />
              )}
              {activeTab === 'empresas' && (
                <EmpresasSection
                  empresas={empresas}
                  rubros={rubros}
                  onRefetch={async () => {
                    const list = await getEmpresas();
                    setEmpresas(list);
                  }}
                />
              )}
              {activeTab === 'ofertas' && (
                <OfertasSection
                  ofertas={ofertas}
                  setOfertas={setOfertas}
                  empresas={empresas}
                  rubros={rubros}
                  onRefetch={async () => {
                    const raw = await getOfertasTodas();
                    setOfertas(mapOfertasParaUI(raw, empresas, rubros));
                  }}
                />
              )}
              {activeTab === 'clientes' && (
                <ClientesSection clientes={clientes} cupones={cupones} />
              )}
              {activeTab === 'cupones' && (
                <CuponesSection cupones={cupones} ofertas={ofertas} clientes={clientes} />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function NavItem({ icon, label, badge, isActive, collapsed, onClick }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        onMouseEnter={() => collapsed && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
          isActive ? 'font-semibold' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
        }`}
        style={
          isActive
            ? {
                backgroundColor: PRIMARY_LIGHT_BG,
                color: PRIMARY_LIGHT_TEXT,
                borderLeft: '3px solid ' + PRIMARY,
              }
            : undefined
        }
      >
        <span className="shrink-0 w-6 text-center text-lg relative inline-block">
          {icon}
          {badge != null && collapsed && (
            <span
              className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full"
              style={{ backgroundColor: PRIMARY }}
            />
          )}
        </span>
        {!collapsed && (
          <>
            <span className="flex-1 truncate">{label}</span>
            {badge != null && badge > 0 && (
              <span
                className="shrink-0 min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-medium text-white flex items-center justify-center"
                style={{ backgroundColor: PRIMARY }}
              >
                {badge}
              </span>
            )}
          </>
        )}
      </button>
      {collapsed && showTooltip && (
        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 px-3 py-2 bg-white border border-slate-200 rounded-lg shadow-md text-slate-900 text-sm font-medium whitespace-nowrap">
          {label}
          {badge != null && badge > 0 ? ` (${badge})` : ''}
        </div>
      )}
    </div>
  );
}

// --- Badge ---
function Badge({ estado }) {
  const map = {
    aprobada: 'bg-green-100 text-green-700',
    pendiente: 'bg-amber-100 text-amber-700',
    rechazada: 'bg-red-100 text-red-700',
    disponible: 'bg-blue-100 text-blue-700',
    canjeado: 'bg-violet-100 text-violet-700',
    vencido: 'bg-slate-100 text-slate-500',
  };
  const c = map[estado] ?? 'bg-slate-100 text-slate-500';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${c}`}>
      {estado}
    </span>
  );
}

// --- ConfirmModal ---
function ConfirmModal({ accion, oferta, onConfirm, onCancel }) {
  const isAprobar = accion === 'aprobar';
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center text-4xl mb-4">{isAprobar ? '✅' : '🚫'}</div>
        <h3 className="font-bold text-slate-900 text-lg mb-1">
          {isAprobar ? 'Aprobar oferta' : 'Rechazar oferta'}
        </h3>
        {oferta && (
          <div className="text-slate-500 text-sm mb-4">
            <p className="font-medium text-slate-900">{oferta.titulo}</p>
            <p>{oferta.empresa} · {oferta.rubro}</p>
          </div>
        )}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg bg-slate-100 text-slate-600 font-medium hover:bg-slate-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onConfirm(oferta)}
            className="flex-1 py-2.5 rounded-lg text-white font-medium transition-colors"
            style={{ backgroundColor: isAprobar ? PRIMARY : '#dc2626' }}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

// --- MiniBarChart (divs, altura 64px) ---
function MiniBarChart({ data }) {
  const max = Math.max(...data.map((d) => d.cupones), 1);
  const [hovered, setHovered] = useState(null);
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((d, i) => {
        const isLast = i === data.length - 1;
        const h = (d.cupones / max) * 64;
        const isHover = hovered === i;
        return (
          <div
            key={d.label}
            className="relative flex-1 flex flex-col items-center min-w-0"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            {isHover && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-white border border-slate-200 rounded shadow text-slate-900 text-xs z-10 whitespace-nowrap">
                {d.cupones} cupones · ${(d.ingresos ?? 0).toLocaleString()}
              </div>
            )}
            <div
              className="w-full rounded-t transition-all"
              style={{
                height: Math.max(h, 4),
                backgroundColor: isLast ? PRIMARY : '#e2e8f0',
              }}
            />
            <span className="text-xs text-slate-400 mt-1 truncate w-full text-center">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// --- Dashboard (Overview) ---
function DashboardOverview({ ofertas, setOfertas, cupones = [], totalClientes = 0, empresas = [], onNavigate }) {
  const [modal, setModal] = useState(null); // { accion: 'aprobar'|'rechazar', oferta }
  const ofertasPendientes = ofertas.filter((o) => o.estado === 'pendiente').length;
  const pendientes = ofertas.filter((o) => o.estado === 'pendiente').slice(0, 3);
  const vence = (c) => (c.vence || c.fechaLimiteUso || '');
  const cuponesPorVencer = cupones.filter((c) => c.estado === 'disponible' && diasHasta(vence(c)) <= 7 && diasHasta(vence(c)) >= 0);
  const totalCupones = cupones.length;
  const canjeados = cupones.filter((c) => c.estado === 'canjeado').length;
  const tasaCanje = totalCupones ? Math.round((canjeados / totalCupones) * 100) : 0;

  const handleConfirm = async (oferta) => {
    if (!oferta || !modal) return;
    const nuevoEstado = modal.accion === 'aprobar' ? 'aprobada' : 'rechazada';
    try {
      await updateOfertaEstado(oferta.id, nuevoEstado);
      setOfertas((prev) =>
        prev.map((o) => (o.id === oferta.id ? { ...o, estado: nuevoEstado } : o))
      );
    } catch (e) {
      console.error(e);
    }
    setModal(null);
  };

  const top5Ofertas = [...ofertas].filter((o) => o.estado === 'aprobada').sort((a, b) => b.vendidos - a.vendidos).slice(0, 5);
  const maxVendidos = Math.max(...top5Ofertas.map((o) => o.vendidos), 1);

  return (
    <div className="space-y-6">
      {ofertasPendientes > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
          <p className="text-blue-800 font-medium">Hay {ofertasPendientes} oferta(s) pendiente(s) de aprobación.</p>
          <button
            type="button"
            onClick={() => onNavigate('ofertas')}
            className="text-blue-600 font-semibold hover:underline"
          >
            Ir a Ofertas →
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white border border-blue-200 rounded-2xl p-5 shadow-sm bg-blue-50/50">
          <span className="text-2xl">🎟️</span>
          <p className="text-2xl font-bold text-slate-900 mt-2">{cupones.length.toLocaleString()}</p>
          <p className="text-slate-500 text-sm">Cupones vendidos</p>
          <p className="text-slate-400 text-sm mt-1">{canjeados} canjeados</p>
        </div>
        <div className="bg-white border border-green-200 rounded-2xl p-5 shadow-sm bg-green-50/50">
          <span className="text-2xl">💰</span>
          <p className="text-2xl font-bold text-slate-900 mt-2">—</p>
          <p className="text-slate-500 text-sm">Ingresos totales</p>
          <p className="text-slate-400 text-sm mt-1">(no calculado)</p>
        </div>
        <div className="bg-white border border-violet-200 rounded-2xl p-5 shadow-sm bg-violet-50/50">
          <span className="text-2xl">✅</span>
          <p className="text-2xl font-bold text-slate-900 mt-2">{tasaCanje}%</p>
          <p className="text-slate-500 text-sm">Tasa de canje</p>
          <p className="text-slate-400 text-sm mt-1">{canjeados} canjeados</p>
        </div>
        <div className="bg-white border border-sky-200 rounded-2xl p-5 shadow-sm bg-sky-50/50">
          <span className="text-2xl">👥</span>
          <p className="text-2xl font-bold text-slate-900 mt-2">{totalClientes.toLocaleString()}</p>
          <p className="text-slate-500 text-sm">Usuarios registrados</p>
        </div>
      </div>

      {cuponesPorVencer.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-amber-800 font-medium">
            {cuponesPorVencer.length} cupón(es) por vencer en los próximos 7 días.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4">Actividad semanal</h3>
          {(() => {
            const actividad = actividadDesdeCupones(cupones);
            const totalCuponesSemana = actividad.reduce((s, d) => s + d.cupones, 0);
            return (
              <>
                <MiniBarChart data={actividad} />
                <div className="mt-4 flex justify-between text-sm text-slate-500">
                  <span>Cupones: {totalCuponesSemana}</span>
                  <span>Últimos 7 días</span>
                </div>
              </>
            );
          })()}
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4">Pendientes</h3>
          {pendientes.length === 0 ? (
            <p className="text-slate-500 text-sm">No hay ofertas pendientes.</p>
          ) : (
            <ul className="space-y-3">
              {pendientes.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-2 bg-white/80 rounded-lg p-3 border border-amber-100">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate">{o.titulo}</p>
                    <p className="text-xs text-slate-500">{o.empresa}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setModal({ accion: 'aprobar', oferta: o })}
                      className="px-2 py-1 rounded text-green-700 bg-green-100 hover:bg-green-200 text-sm font-medium"
                    >
                      ✓ Aprobar
                    </button>
                    <button
                      type="button"
                      onClick={() => setModal({ accion: 'rechazar', oferta: o })}
                      className="px-2 py-1 rounded text-red-700 bg-red-100 hover:bg-red-200 text-sm font-medium"
                    >
                      ✗ Rechazar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4">Top 5 ofertas</h3>
          <ul className="space-y-3">
            {top5Ofertas.map((o, i) => (
              <li key={o.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-slate-900">{i + 1}. {o.titulo}</span>
                  <span className="text-slate-500">{o.vendidos} vendidos</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{ width: `${(o.vendidos / maxVendidos) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4">Empresas por cupones</h3>
          <ul className="space-y-2">
            {empresas.slice(0, 5).map((e) => (
              <li key={e.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <span className="font-medium text-slate-900">{e.nombre}</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-xs font-mono">{e.codigo ?? e.id}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {modal && (
        <ConfirmModal
          accion={modal.accion}
          oferta={modal.oferta}
          onConfirm={handleConfirm}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
}

// --- Sección Ofertas ---
function OfertasSection({ ofertas, setOfertas, empresas = [], rubros = [], onRefetch }) {
  const [filtro, setFiltro] = useState('todas');
  const [modal, setModal] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    empresaId: '',
    rubroId: '',
    titulo: '',
    precioRegular: '',
    precioOferta: '',
    fechaInicio: '',
    fechaFin: '',
    fechaLimiteUso: '',
    cantidadLimite: '',
    descripcion: '',
    otrosDetalles: '',
  });

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === 'empresaId') {
      const emp = empresas.find((x) => x.id === value);
      setForm((prev) => ({ ...prev, rubroId: emp?.rubroId ?? prev.rubroId }));
    }
    setError('');
  };

  const handleCreateOferta = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim()) { setError('El título es obligatorio.'); return; }
    if (!form.empresaId) { setError('Elegí una empresa.'); return; }
    if (!form.rubroId) { setError('Elegí un rubro.'); return; }
    setError('');
    setSaving(true);
    try {
      await addOferta(form);
      setForm({ empresaId: '', rubroId: '', titulo: '', precioRegular: '', precioOferta: '', fechaInicio: '', fechaFin: '', fechaLimiteUso: '', cantidadLimite: '', descripcion: '', otrosDetalles: '' });
      setShowForm(false);
      await onRefetch?.();
    } catch (err) {
      console.error(err);
      setError(err?.message || 'No se pudo crear la oferta.');
    } finally {
      setSaving(false);
    }
  };

  const filtradas = filtro === 'todas'
    ? ofertas
    : ofertas.filter((o) => o.estado === filtro);

  const handleConfirm = async (oferta) => {
    if (!oferta || !modal) return;
    const nuevoEstado = modal.accion === 'aprobar' ? 'aprobada' : 'rechazada';
    try {
      await updateOfertaEstado(oferta.id, nuevoEstado);
      setOfertas((prev) =>
        prev.map((o) => (o.id === oferta.id ? { ...o, estado: nuevoEstado } : o))
      );
    } catch (e) {
      console.error(e);
    }
    setModal(null);
  };

  const FILTROS = [
    { id: 'todas', label: 'Todas' },
    { id: 'pendiente', label: 'Pendientes' },
    { id: 'aprobada', label: 'Aprobadas' },
    { id: 'rechazada', label: 'Rechazadas' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {FILTROS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFiltro(f.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filtro === f.id
                ? 'text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            style={filtro === f.id ? { backgroundColor: PRIMARY } : undefined}
          >
            {f.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => { setShowForm((v) => !v); setError(''); }}
          className="px-4 py-2 rounded-lg text-white font-medium"
          style={{ backgroundColor: PRIMARY }}
        >
          {showForm ? 'Cancelar' : 'Crear oferta'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreateOferta} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 max-w-2xl">
          {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm" role="alert">{error}</div>}
          <h3 className="font-bold text-slate-900">Nueva oferta</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-1">Empresa *</label>
              <select name="empresaId" value={form.empresaId} onChange={handleFormChange} required className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white focus:border-[#2d3fc2] focus:outline-none text-slate-900">
                <option value="">Elegir empresa</option>
                {empresas.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-1">Rubro *</label>
              <select name="rubroId" value={form.rubroId} onChange={handleFormChange} required className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white focus:border-[#2d3fc2] focus:outline-none text-slate-900">
                <option value="">Elegir rubro</option>
                {rubros.filter((r) => r.activo !== false).map((r) => (
                  <option key={r.id} value={r.id}>{r.nombre}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-1">Título *</label>
              <input type="text" name="titulo" value={form.titulo} onChange={handleFormChange} required className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white focus:border-[#2d3fc2] focus:outline-none text-slate-900" placeholder="Ej. 2x1 en desayunos" />
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-1">Precio regular</label>
              <input type="number" name="precioRegular" value={form.precioRegular} onChange={handleFormChange} min={0} step={0.01} className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white focus:border-[#2d3fc2] focus:outline-none text-slate-900" placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-1">Precio oferta</label>
              <input type="number" name="precioOferta" value={form.precioOferta} onChange={handleFormChange} min={0} step={0.01} className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white focus:border-[#2d3fc2] focus:outline-none text-slate-900" placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-1">Fecha inicio</label>
              <input type="date" name="fechaInicio" value={form.fechaInicio} onChange={handleFormChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white focus:border-[#2d3fc2] focus:outline-none text-slate-900" />
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-1">Fecha fin</label>
              <input type="date" name="fechaFin" value={form.fechaFin} onChange={handleFormChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white focus:border-[#2d3fc2] focus:outline-none text-slate-900" />
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-1">Fecha límite uso cupón</label>
              <input type="date" name="fechaLimiteUso" value={form.fechaLimiteUso} onChange={handleFormChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white focus:border-[#2d3fc2] focus:outline-none text-slate-900" />
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-1">Límite cupones (vacío = sin límite)</label>
              <input type="number" name="cantidadLimite" value={form.cantidadLimite} onChange={handleFormChange} min={0} className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white focus:border-[#2d3fc2] focus:outline-none text-slate-900" placeholder="Opcional" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-1">Descripción</label>
              <textarea name="descripcion" value={form.descripcion} onChange={handleFormChange} rows={2} className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white focus:border-[#2d3fc2] focus:outline-none text-slate-900" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-1">Otros detalles</label>
              <textarea name="otrosDetalles" value={form.otrosDetalles} onChange={handleFormChange} rows={2} className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white focus:border-[#2d3fc2] focus:outline-none text-slate-900" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50" style={{ backgroundColor: PRIMARY }}>
              {saving ? 'Guardando...' : 'Crear oferta (pendiente de aprobación)'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 font-medium hover:bg-slate-200">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-100">
                <th className="text-left py-3 px-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Oferta</th>
                <th className="text-left py-3 px-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Empresa / Rubro</th>
                <th className="text-left py-3 px-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Precio</th>
                <th className="text-left py-3 px-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Vendidos</th>
                <th className="text-left py-3 px-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Días rest.</th>
                <th className="text-left py-3 px-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Estado</th>
                <th className="text-right py-3 px-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((o) => {
                const limite = o.limite ?? 999;
                const pct = limite > 0 ? Math.min((o.vendidos / limite) * 100, 100) : 0;
                const dias = o.fin ? diasHasta(o.fin) : null;
                const diasClass = dias != null && dias <= 3 ? 'text-red-600' : dias != null && dias <= 7 ? 'text-amber-600' : 'text-slate-400';
                return (
                  <tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium text-slate-900">{o.titulo}</td>
                    <td className="py-3 px-4 text-sm text-slate-500">{o.empresa} · {o.rubro}</td>
                    <td className="py-3 px-4 text-slate-600">${o.precio}</td>
                    <td className="py-3 px-4">
                      <div className="w-20">
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-slate-500">{o.vendidos}{o.limite != null ? ` / ${o.limite}` : ''}</span>
                      </div>
                    </td>
                    <td className={`py-3 px-4 text-sm font-medium ${diasClass}`}>
                      {dias != null ? (dias > 0 ? `${dias} días` : 'Vencida') : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <Badge estado={o.estado} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      {o.estado === 'pendiente' && (
                        <>
                          <button
                            type="button"
                            onClick={() => setModal({ accion: 'aprobar', oferta: o })}
                            className="mr-1 px-2 py-1 rounded text-green-700 bg-green-100 hover:bg-green-200 text-sm"
                          >
                            ✓ aprobar
                          </button>
                          <button
                            type="button"
                            onClick={() => setModal({ accion: 'rechazar', oferta: o })}
                            className="mr-1 px-2 py-1 rounded text-red-700 bg-red-100 hover:bg-red-200 text-sm"
                          >
                            ✗ rechazar
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        className="px-2 py-1 rounded text-slate-600 bg-slate-100 hover:bg-slate-200 text-sm"
                      >
                        ✎ editar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <ConfirmModal
          accion={modal.accion}
          oferta={modal.oferta}
          onConfirm={handleConfirm}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
}

// --- Sección Cupones ---
function CuponesSection({ cupones = [], ofertas = [], clientes = [] }) {
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const venceStr = (c) => c.vence || c.fechaLimiteUso || '';
  const conDisplay = cupones.map((c) => ({
    ...c,
    nombre: ofertas.find((o) => o.id === c.ofertaId)?.titulo ?? '—',
    empresa: ofertas.find((o) => o.id === c.ofertaId)?.empresa ?? '—',
    cliente: clientes.find((cl) => cl.id === c.clienteId)?.nombre ?? c.clienteId ?? '—',
    vence: venceStr(c),
  }));
  const urgentes = conDisplay.filter((c) => c.estado === 'disponible' && diasHasta(venceStr(c)) <= 7 && diasHasta(venceStr(c)) >= 0);
  const filtrados = conDisplay.filter((c) => {
    const matchBusqueda = !busqueda || (c.codigo && c.codigo.toLowerCase().includes(busqueda.toLowerCase())) || (c.nombre && c.nombre.toLowerCase().includes(busqueda.toLowerCase()));
    const matchEstado = filtroEstado === 'todos' || c.estado === filtroEstado;
    return matchBusqueda && matchEstado;
  });
  const disp = cupones.filter((c) => c.estado === 'disponible').length;
  const canj = cupones.filter((c) => c.estado === 'canjeado').length;
  const venc = cupones.filter((c) => c.estado === 'vencido').length;

  const ESTADOS = [{ id: 'todos', label: 'Todos' }, { id: 'disponible', label: 'Disponible' }, { id: 'canjeado', label: 'Canjeado' }, { id: 'vencido', label: 'Vencido' }];

  return (
    <div className="space-y-6">
      {urgentes.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-800 font-medium">{urgentes.length} cupón(es) por vencer en los próximos 7 días.</p>
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Buscar por código o oferta..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="flex-1 px-4 py-2 border border-slate-200 rounded-lg bg-white focus:border-[#2d3fc2] focus:outline-none focus:ring-1 focus:ring-[#2d3fc2]/30"
        />
        <div className="flex flex-wrap gap-2">
          {ESTADOS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFiltroEstado(f.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium ${filtroEstado === f.id ? 'text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              style={filtroEstado === f.id ? { backgroundColor: PRIMARY } : undefined}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-slate-500 text-sm">Disponibles</p>
          <p className="text-2xl font-bold text-blue-600">{disp}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-slate-500 text-sm">Canjeados</p>
          <p className="text-2xl font-bold text-violet-600">{canj}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-slate-500 text-sm">Vencidos</p>
          <p className="text-2xl font-bold text-slate-500">{venc}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtrados.map((c) => {
          const esUrgente = c.estado === 'disponible' && diasHasta(c.vence) <= 7 && diasHasta(c.vence) >= 0;
          return (
            <div
              key={c.codigo}
              className={`rounded-2xl border p-4 shadow-sm ${esUrgente ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono font-semibold text-blue-700 text-sm">{c.codigo}</span>
                {esUrgente && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Urgente</span>}
              </div>
              <p className="font-medium text-slate-900 mt-1">{c.nombre}</p>
              <p className="text-sm text-slate-500">{c.empresa} · {c.cliente}</p>
              <div className="mt-2 flex items-center justify-between">
                <Badge estado={c.estado} />
                <span className="text-xs text-slate-400">Vence: {c.vence}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Sección Rubros ---
function RubrosSection({ rubros, setRubros, onRefetch }) {
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [editValor, setEditValor] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const agregar = async () => {
    const nombre = nuevoNombre.trim();
    if (!nombre) {
      setError('Escribí el nombre del rubro.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await addRubro({ nombre });
      setNuevoNombre('');
      try {
        await onRefetch?.();
      } catch (refetchErr) {
        console.warn('Refetch después de agregar:', refetchErr);
        setError('Rubro guardado correctamente. Si no aparece en la lista, recargá la página.');
      }
    } catch (e) {
      console.error('Error al agregar rubro:', e);
      const msg = e?.message || String(e);
      const isPermission = e?.code === 'permission-denied' || /permission|insufficient|denied/i.test(msg);
      setError(
        isPermission
          ? 'Sin permiso para escribir en Firestore. Revisá que tu usuario esté en la colección "admins" (documento con ID = tu UID) y que hayas publicado las reglas de Firestore.'
          : msg || 'No se pudo guardar el rubro.'
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleActivo = async (r) => {
    const nuevoActivo = !(r.activo !== false);
    setError('');
    setSaving(true);
    try {
      await updateRubro(r.id, { activo: nuevoActivo });
      await onRefetch?.();
    } catch (e) {
      console.error(e);
      setError(e?.message || 'No se pudo actualizar.');
    } finally {
      setSaving(false);
    }
  };

  const guardarEdicion = async (id) => {
    if (!editValor.trim()) {
      setEditandoId(null);
      setEditValor('');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await updateRubro(id, { nombre: editValor.trim() });
      await onRefetch?.();
    } catch (e) {
      console.error(e);
      setError(e?.message || 'No se pudo guardar el cambio.');
    } finally {
      setEditandoId(null);
      setEditValor('');
      setSaving(false);
    }
  };

  const rubrosConDefault = rubros.map((r) => ({
    ...r,
    nombre: r.nombre ?? '',
    icono: r.icono ?? '📦',
    empresas: r.empresas ?? 0,
    ofertas: r.ofertas ?? 0,
    activo: r.activo !== false,
  }));

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-800 text-sm" role="alert">
          {error}
        </div>
      )}
      <p className="text-slate-500 text-sm">Escribí el nombre del rubro y hacé clic en Agregar. Se guarda en Firebase.</p>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          placeholder="Nombre del rubro..."
          value={nuevoNombre}
          onChange={(e) => { setNuevoNombre(e.target.value); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && agregar()}
          className="flex-1 min-w-[200px] max-w-xs px-4 py-2 border border-slate-200 rounded-lg bg-white focus:border-[#2d3fc2] focus:outline-none focus:ring-1 focus:ring-[#2d3fc2]/30"
          disabled={saving}
        />
        <button
          type="button"
          onClick={agregar}
          disabled={saving}
          className="px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: PRIMARY }}
        >
          {saving ? 'Guardando...' : 'Agregar'}
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {rubrosConDefault.map((r) => (
          <div
            key={r.id}
            className={`bg-white border border-slate-200 rounded-2xl p-5 shadow-sm ${!r.activo ? 'opacity-60' : ''}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{r.icono}</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-xs">{r.empresas} emp · {r.ofertas} of.</span>
            </div>
            {editandoId === r.id ? (
              <input
                type="text"
                value={editValor}
                onChange={(e) => setEditValor(e.target.value)}
                onBlur={() => guardarEdicion(r.id)}
                onKeyDown={(e) => e.key === 'Enter' && guardarEdicion(r.id)}
                className="w-full px-3 py-2 border rounded-lg border-[#2d3fc2] bg-white"
                autoFocus
              />
            ) : (
              <p className="font-bold text-slate-900">{r.nombre}</p>
            )}
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => { setEditandoId(r.id); setEditValor(r.nombre); }}
                className="px-3 py-1.5 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 text-sm disabled:opacity-50"
              >
                Editar
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => toggleActivo(r)}
                className={`px-3 py-1.5 rounded-lg text-sm disabled:opacity-50 ${r.activo ? 'text-red-600 bg-red-100 hover:bg-red-200' : 'text-green-600 bg-green-100 hover:bg-green-200'}`}
              >
                {r.activo ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Sección Empresas ---
function EmpresasSection({ empresas = [], rubros = [], onRefetch }) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    nombre: '',
    codigo: '',
    direccion: '',
    nombreContacto: '',
    telefono: '',
    correo: '',
    rubroId: '',
    porcentajeComision: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }
    if (!form.rubroId) {
      setError('Elegí un rubro.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await addEmpresa(form);
      setForm({ nombre: '', codigo: '', direccion: '', nombreContacto: '', telefono: '', correo: '', rubroId: '', porcentajeComision: '' });
      setShowForm(false);
      await onRefetch?.();
    } catch (err) {
      console.error(err);
      setError(err?.message || 'No se pudo guardar la empresa.');
    } finally {
      setSaving(false);
    }
  };

  const empresasConDisplay = empresas.map((e) => ({
    ...e,
    rubro: rubros.find((r) => r.id === e.rubroId)?.nombre ?? e.rubroId ?? '—',
    comision: e.porcentajeComision ?? e.comision ?? 0,
    cupones: e.cupones ?? 0,
    activa: e.activa !== false,
    contacto: e.correo ?? e.contacto ?? '—',
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => { setShowForm((v) => !v); setError(''); }}
          className="px-4 py-2 rounded-lg text-white font-medium"
          style={{ backgroundColor: PRIMARY }}
        >
          {showForm ? 'Cancelar' : 'Agregar empresa'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 max-w-xl">
          {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm" role="alert">{error}</div>}
          <h3 className="font-bold text-slate-900">Nueva empresa</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-1">Nombre *</label>
              <input type="text" name="nombre" value={form.nombre} onChange={handleChange} required className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white focus:border-[#2d3fc2] focus:outline-none text-slate-900" placeholder="Ej. Café Central" />
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-1">Código (3 letras + 3 números)</label>
              <input type="text" name="codigo" value={form.codigo} onChange={handleChange} maxLength={6} className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white focus:border-[#2d3fc2] focus:outline-none text-slate-900 font-mono" placeholder="Ej. CAF001" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-1">Dirección</label>
              <input type="text" name="direccion" value={form.direccion} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white focus:border-[#2d3fc2] focus:outline-none text-slate-900" placeholder="Dirección" />
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-1">Nombre contacto</label>
              <input type="text" name="nombreContacto" value={form.nombreContacto} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white focus:border-[#2d3fc2] focus:outline-none text-slate-900" />
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-1">Teléfono</label>
              <input type="text" name="telefono" value={form.telefono} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white focus:border-[#2d3fc2] focus:outline-none text-slate-900" />
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-1">Correo</label>
              <input type="email" name="correo" value={form.correo} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white focus:border-[#2d3fc2] focus:outline-none text-slate-900" />
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-1">Rubro *</label>
              <select name="rubroId" value={form.rubroId} onChange={handleChange} required className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white focus:border-[#2d3fc2] focus:outline-none text-slate-900">
                <option value="">Elegir rubro</option>
                {rubros.filter((r) => r.activo !== false).map((r) => (
                  <option key={r.id} value={r.id}>{r.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-1">% Comisión</label>
              <input type="number" name="porcentajeComision" value={form.porcentajeComision} onChange={handleChange} min={0} max={100} step={0.5} className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white focus:border-[#2d3fc2] focus:outline-none text-slate-900" placeholder="0" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50" style={{ backgroundColor: PRIMARY }}>
              {saving ? 'Guardando...' : 'Guardar empresa'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 font-medium hover:bg-slate-200">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {empresasConDisplay.map((e) => (
          <div key={e.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className={`w-2 h-2 rounded-full ${e.activa ? 'bg-green-400' : 'bg-slate-300'}`} />
              <h3 className="font-bold text-slate-900">{e.nombre}</h3>
            </div>
            <p className="text-sm text-slate-500 mb-2">{e.rubro}</p>
            <span className="inline-block px-2 py-1 rounded bg-slate-100 font-mono text-slate-600 text-xs">{e.codigo}</span>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="bg-blue-50 rounded-lg p-3 text-blue-700 text-sm font-medium">{e.cupones} cupones</div>
              <div className="bg-green-50 rounded-lg p-3 text-green-700 text-sm font-medium">{e.comision}% comisión</div>
            </div>
            <p className="text-xs text-slate-400 mt-3 truncate">{e.contacto}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Sección Clientes ---
function ClientesSection({ clientes = [], cupones = [] }) {
  const [busqueda, setBusqueda] = useState('');
  const [orden, setOrden] = useState('nombre');
  const conCupones = clientes.map((c) => ({
    ...c,
    email: c.correo ?? c.email,
    cupones: cupones.filter((cup) => cup.clienteId === c.id).length,
    gasto: 0,
    registro: '',
    activo: true,
  }));
  const filtrados = conCupones.filter(
    (c) => !busqueda || (c.nombre && c.nombre.toLowerCase().includes(busqueda.toLowerCase())) || (c.email && c.email.toLowerCase().includes(busqueda.toLowerCase())) || (c.correo && c.correo.toLowerCase().includes(busqueda.toLowerCase()))
  );
  const ordenados = [...filtrados].sort((a, b) => {
    if (orden === 'nombre') return (a.nombre || '').localeCompare(b.nombre || '');
    if (orden === 'cupones') return (b.cupones ?? 0) - (a.cupones ?? 0);
    if (orden === 'gasto') return (b.gasto ?? 0) - (a.gasto ?? 0);
    return 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="flex-1 max-w-md px-4 py-2 border border-slate-200 rounded-lg bg-white"
        />
        <div className="flex gap-2">
          {['nombre', 'cupones', 'gasto'].map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => setOrden(o)}
              className={`px-4 py-2 rounded-full text-sm font-medium capitalize ${orden === o ? 'text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              style={orden === o ? { backgroundColor: PRIMARY } : undefined}
            >
              {o}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-slate-500 text-xs uppercase tracking-wider">Total</p>
          <p className="text-xl font-bold text-slate-900">{clientes.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-slate-500 text-xs uppercase tracking-wider">Activos</p>
          <p className="text-xl font-bold text-slate-900">{conCupones.filter((c) => c.activo).length}</p>
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-100">
              <th className="text-left py-3 px-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Cliente</th>
              <th className="text-left py-3 px-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Email</th>
              <th className="text-left py-3 px-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Cupones</th>
              <th className="text-left py-3 px-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Gasto</th>
              <th className="text-left py-3 px-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Registro</th>
              <th className="text-left py-3 px-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Estado</th>
            </tr>
          </thead>
          <tbody>
            {ordenados.map((c) => (
              <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0" style={{ backgroundColor: PRIMARY }}>
                      {c.nombre.charAt(0)}
                    </div>
                    <span className="font-medium text-slate-900">{c.nombre}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-slate-500 text-sm">{c.email}</td>
                <td className="py-3 px-4 text-slate-600">{c.cupones}</td>
                <td className="py-3 px-4 text-slate-600">${c.gasto.toFixed(2)}</td>
                <td className="py-3 px-4 text-slate-500 text-sm">{c.registro}</td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.activo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {c.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SectionPlaceholder({ title }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
      <h2 className="font-bold text-slate-900 text-lg mb-2">{title}</h2>
      <p className="text-slate-500">Contenido en el siguiente paso.</p>
    </div>
  );
}
