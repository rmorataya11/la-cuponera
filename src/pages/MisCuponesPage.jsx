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
  const listByTab = { disponibles, canjeados, vencidos };
  const list = listByTab[tab] || [];

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="text-slate-500 text-sm font-medium">Cargando tus cupones...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-red-700 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-6">Mis cupones</h1>

      <div className="flex gap-0.5 p-1 bg-slate-100 rounded-lg mb-6 w-fit">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-medium rounded-md transition ${
              tab === key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {label} ({listByTab[key].length})
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="rounded-xl bg-white border border-slate-200 p-8 text-center text-slate-600">
          No tienes cupones en esta categoría.
        </div>
      ) : (
        <ul className="space-y-4">
          {list.map((c) => (
            <li
              key={c.id}
              className="bg-white rounded-xl border border-slate-200/80 shadow-card p-5 flex flex-wrap items-center justify-between gap-4"
            >
              <div>
                <p className="font-mono font-semibold text-slate-900">{c.codigo}</p>
                <p className="text-slate-600 mt-0.5">{ofertasMap[c.ofertaId]?.titulo ?? 'Oferta'}</p>
                <p className="text-sm text-slate-500 mt-2">
                  Comprado: {c.fechaCompra} · Válido hasta: {c.fechaLimiteUso}
                </p>
              </div>
              {tab === 'disponibles' && (
                <button
                  type="button"
                  onClick={() => descargarPdfCupon(c, ofertasMap[c.ofertaId])}
                  className="shrink-0 px-4 py-2 text-sm font-medium text-orange-600 border border-orange-600 rounded-lg hover:bg-orange-50 transition"
                >
                  Descargar PDF
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
