import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getRubros,
  getOfertasAprobadas,
  getEmpresas,
  filterOfertasVigentes,
} from '../services/ofertasService';

export default function OfertasPage() {
  const [rubros, setRubros] = useState([]);
  const [ofertas, setOfertas] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [rubroId, setRubroId] = useState('');
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

  const empresaMap = Object.fromEntries(empresas.map((e) => [e.id, e.nombre]));
  const filtered = rubroId
    ? ofertas.filter((o) => o.rubroId === rubroId)
    : ofertas;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-800 rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Cargando ofertas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50/80 border border-red-100 px-5 py-4 text-red-700 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Ofertas</h1>
        <div className="flex items-center gap-2">
          <label htmlFor="rubro" className="text-sm font-medium text-slate-600 whitespace-nowrap">
            Rubro
          </label>
          <select
            id="rubro"
            value={rubroId}
            onChange={(e) => setRubroId(e.target.value)}
            className="w-full sm:w-auto min-w-[180px]"
          >
            <option value="">Todos</option>
            {rubros.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl bg-white border border-slate-200/80 px-6 py-12 text-center text-slate-500 text-sm">
          No hay ofertas disponibles en este momento.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((o) => (
            <Link
              key={o.id}
              to={`/ofertas/${o.id}`}
              className="group block bg-white rounded-xl border border-slate-200/80 p-5 shadow-card hover:shadow-card-hover hover:border-slate-300/80 transition-all duration-150"
            >
              <h2 className="font-semibold text-slate-900 line-clamp-2 group-hover:text-blue-800 transition-colors duration-150">
                {o.titulo}
              </h2>
              {empresaMap[o.empresaId] && (
                <p className="text-sm text-slate-500 mt-1">{empresaMap[o.empresaId]}</p>
              )}
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-xl font-semibold text-blue-800">
                  ${typeof o.precioOferta === 'number' ? o.precioOferta.toFixed(2) : o.precioOferta}
                </span>
                {typeof o.precioRegular === 'number' && (
                  <span className="text-sm text-slate-400 line-through">
                    ${o.precioRegular.toFixed(2)}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
