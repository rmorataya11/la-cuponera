import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  getRubros,
  getOfertasAprobadas,
  getEmpresas,
  filterOfertasVigentes,
} from '../services/ofertasService';

function formatPrecio(val) {
  if (val == null || val === '') return '—';
  const n = Number(val);
  return Number.isFinite(n) ? `$${n.toFixed(2)}` : String(val);
}

function descuentoPorcentaje(regular, oferta) {
  const r = Number(regular);
  const o = Number(oferta);
  if (!Number.isFinite(r) || !Number.isFinite(o) || r <= 0 || o >= r) return null;
  const pct = Math.round(((r - o) / r) * 100);
  return pct > 0 ? pct : null;
}

export default function OfertasPage() {
  const [rubros, setRubros] = useState([]);
  const [ofertas, setOfertas] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [rubroId, setRubroId] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [rubrosData, ofertasData, empresasData] = await Promise.all([
          getRubros(),
          getOfertasAprobadas(),
          getEmpresas(),
        ]);
        if (cancelled) return;
        setRubros(rubrosData);
        setEmpresas(empresasData);
        const vigentes = filterOfertasVigentes(ofertasData);
        setOfertas(vigentes);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Error al cargar ofertas.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const empresaMap = useMemo(() => Object.fromEntries(empresas.map((e) => [e.id, e.nombre])), [empresas]);
  const rubroMap = useMemo(() => Object.fromEntries(rubros.map((r) => [r.id, r.nombre])), [rubros]);

  const filtered = useMemo(() => {
    let list = ofertas;
    if (rubroId) list = list.filter((o) => o.rubroId === rubroId);
    const q = (busqueda || '').trim().toLowerCase();
    if (q) {
      list = list.filter((o) => {
        const titulo = (o.titulo || '').toLowerCase();
        const empresa = (empresaMap[o.empresaId] || '').toLowerCase();
        const rubro = (rubroMap[o.rubroId] || '').toLowerCase();
        return titulo.includes(q) || empresa.includes(q) || rubro.includes(q);
      });
    }
    return list;
  }, [ofertas, rubroId, busqueda, empresaMap, rubroMap]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-10 h-10 border-2 border-slate-200 border-t-[#2097A9] rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Cargando ofertas...</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 w-full mt-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-100 overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-slate-100" />
              <div className="p-5 space-y-3">
                <div className="h-5 bg-slate-100 rounded w-3/4" />
                <div className="h-4 bg-slate-100 rounded w-1/2" />
                <div className="h-6 bg-slate-100 rounded w-1/3 mt-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-100 px-5 py-6 text-red-700 text-sm flex flex-col items-center gap-3">
        <span className="text-red-400 text-2xl" aria-hidden>⚠</span>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="text-center sm:text-left">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Ofertas</h1>
        <p className="mt-1 text-slate-600">Encontrá cupones de descuento de tus marcas favoritas.</p>
      </header>

      {/* Filtros y búsqueda */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="flex-1 max-w-md">
            <input
              type="search"
              placeholder="Buscar por oferta, empresa o rubro..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2097A9]/25 focus:border-[#2097A9] transition-shadow"
            />
          </div>
          <select
            id="rubro"
            value={rubroId}
            onChange={(e) => setRubroId(e.target.value)}
            className="w-full sm:w-auto min-w-[180px] px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2097A9]/25 focus:border-[#2097A9]"
            aria-label="Filtrar por rubro"
          >
            <option value="">Todos los rubros</option>
            {rubros.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Chips de rubros */}
        {rubros.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setRubroId('')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                !rubroId
                  ? 'bg-[#2097A9] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos
            </button>
            {rubros.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRubroId(rubroId === r.id ? '' : r.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  rubroId === r.id
                    ? 'bg-[#2097A9] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {r.nombre}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Contador y grid */}
      <div>
        <p className="text-sm text-slate-500 mb-4">
          {filtered.length === 0
            ? 'No hay ofertas con los filtros elegidos.'
            : filtered.length === 1
              ? '1 oferta'
              : `${filtered.length} ofertas`}
        </p>

        {filtered.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 border border-slate-100 px-8 py-16 text-center">
            <div className="text-4xl mb-4 opacity-60" aria-hidden>🎫</div>
            <h2 className="text-lg font-semibold text-slate-700 mb-2">No hay ofertas disponibles</h2>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">
              Probá quitar filtros o cambiar la búsqueda. Pronto sumaremos más ofertas.
            </p>
            <button
              type="button"
              onClick={() => { setRubroId(''); setBusqueda(''); }}
              className="mt-6 px-5 py-2.5 rounded-lg text-sm font-medium text-[#2097A9] bg-[#e8f4f6] hover:bg-[#d1e6ea] transition-colors"
            >
              Ver todas
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((o, index) => {
              const fotoURL = (o.fotoURL || o.foto_url || '').trim() || null;
              const precioOferta = o.precioOferta ?? o.precio;
              const precioRegular = o.precioRegular;
              const descuento = descuentoPorcentaje(precioRegular, precioOferta);
              const rubroNombre = rubroMap[o.rubroId];
              return (
                <Link
                  key={o.id}
                  to={`/ofertas/${o.id}`}
                  className="group block bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-lg hover:border-slate-300/80 transition-all duration-200 hover:-translate-y-0.5 animate-fade-in-up"
                  style={{ animationDelay: `${0.05 + index * 0.03}s` }}
                >
                  <div className="relative aspect-[4/3] w-full bg-gradient-to-br from-slate-100 to-slate-200/80">
                    {fotoURL ? (
                      <img
                        src={fotoURL}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`absolute inset-0 flex items-center justify-center text-slate-300 ${fotoURL ? 'hidden' : ''}`} aria-hidden>
                      <span className="text-5xl">🎫</span>
                    </div>
                    {descuento != null && (
                      <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-green-600 text-white text-xs font-bold shadow">
                        -{descuento}%
                      </span>
                    )}
                    {rubroNombre && (
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-white/90 text-slate-600 text-xs font-medium shadow-sm">
                        {rubroNombre}
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <h2 className="font-semibold text-slate-900 line-clamp-2 group-hover:text-[#1a7a89] transition-colors">
                      {o.titulo}
                    </h2>
                    {empresaMap[o.empresaId] && (
                      <p className="text-sm text-slate-500 mt-1">{empresaMap[o.empresaId]}</p>
                    )}
                    <div className="mt-4 flex items-baseline gap-2 flex-wrap">
                      <span className="text-xl font-bold text-[#2097A9]">
                        {formatPrecio(precioOferta)}
                      </span>
                      {Number(precioRegular) > 0 && (
                        <span className="text-sm text-slate-400 line-through">
                          {formatPrecio(precioRegular)}
                        </span>
                      )}
                    </div>
                    <p className="mt-4 text-sm font-medium text-[#2097A9] group-hover:text-[#1a7a89] flex items-center gap-1">
                      Ver oferta
                      <span className="inline-block group-hover:translate-x-0.5 transition-transform">→</span>
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
