import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCuponesByClienteId, clasificarCupones } from '../services/cuponesService';
import { getOfertaById } from '../services/ofertasService';
import { descargarPdfCupon } from '../utils/generarPdfCupon';

const TABS = [
  { key: 'disponibles', label: 'Disponibles' },
  { key: 'canjeados', label: 'Canjeados' },
  { key: 'vencidos', label: 'Vencidos' },
];

export default function MisCuponesPage() {
  const { user } = useAuth();
  const [cupones, setCupones] = useState([]);
  const [ofertasMap, setOfertasMap] = useState({});
  const [tab, setTab] = useState('disponibles');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user?.uid) return;
      setLoading(true);
      setError('');
      try {
        const list = await getCuponesByClienteId(user.uid);
        if (cancelled) return;
        setCupones(list);
        const ids = [...new Set(list.map((c) => c.ofertaId).filter(Boolean))];
        const map = {};
        await Promise.all(
          ids.map(async (id) => {
            const o = await getOfertaById(id);
            if (o) map[id] = o;
          })
        );
        if (!cancelled) setOfertasMap(map);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Error al cargar cupones.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user?.uid]);

  const { disponibles, canjeados, vencidos } = clasificarCupones(cupones);
  const listByTab = {
    disponibles,
    canjeados,
    vencidos,
  };
  const list = listByTab[tab] || [];

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <p className="text-gray-500">Cargando tus cupones...</p>
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
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Mis cupones</h1>

      <div className="flex gap-2 border-b border-gray-200 mb-6">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`px-4 py-2 font-medium rounded-t-lg transition ${
              tab === key
                ? 'bg-orange-100 text-orange-700 border-b-2 border-orange-600 -mb-px'
                : 'text-gray-600 hover:text-orange-600 hover:bg-gray-100'
            }`}
          >
            {label} ({listByTab[key].length})
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="text-gray-600">No tienes cupones en esta categoría.</p>
      ) : (
        <ul className="space-y-4">
          {list.map((c) => (
            <li
              key={c.id}
              className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-mono font-semibold text-gray-800">{c.codigo}</p>
                  <p className="text-gray-600 mt-1">
                    {ofertasMap[c.ofertaId]?.titulo ?? 'Oferta'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Comprado: {c.fechaCompra} · Válido hasta: {c.fechaLimiteUso}
                  </p>
                </div>
                {tab === 'disponibles' && (
                  <button
                    type="button"
                    onClick={() => descargarPdfCupon(c, ofertasMap[c.ofertaId])}
                    className="px-3 py-1.5 text-sm font-medium text-orange-600 border border-orange-600 rounded-lg hover:bg-orange-50"
                  >
                    Descargar PDF
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
