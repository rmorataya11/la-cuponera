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
      <div className="flex justify-center py-12">
        <p className="text-gray-500">Cargando ofertas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-100 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Ofertas</h1>
        <div className="flex items-center gap-2">
          <label htmlFor="rubro" className="text-sm font-medium text-gray-700">
            Rubro:
          </label>
          <select
            id="rubro"
            value={rubroId}
            onChange={(e) => setRubroId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
        <p className="text-gray-600">No hay ofertas disponibles en este momento.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((o) => (
            <Link
              key={o.id}
              to={`/ofertas/${o.id}`}
              className="block p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-orange-200 transition"
            >
              <h2 className="font-semibold text-gray-800 line-clamp-2">{o.titulo}</h2>
              {empresaMap[o.empresaId] && (
                <p className="text-sm text-gray-500 mt-1">{empresaMap[o.empresaId]}</p>
              )}
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-lg font-bold text-orange-600">
                  ${typeof o.precioOferta === 'number' ? o.precioOferta.toFixed(2) : o.precioOferta}
                </span>
                {typeof o.precioRegular === 'number' && (
                  <span className="text-sm text-gray-400 line-through">
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
