import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCuponesByClienteId, clasificarCupones } from '../services/cuponesService';
import { getOfertaById, getEmpresaById } from '../services/ofertasService';
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
            if (o) {
              const emp = o.empresaId ? await getEmpresaById(o.empresaId) : null;
              map[id] = { ...o, empresaNombre: emp?.nombre ?? '' };
            }
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
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-800 rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Cargando tus cupones...</p>
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
      <h1 className="text-2xl font-semibold text-slate-900 tracking-tight mb-6">Mis cupones</h1>

      <div className="flex gap-0.5 p-1 bg-slate-100/80 rounded-lg mb-6 w-fit">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-medium rounded-md transition-colors duration-150 ${
              tab === key
                ? 'bg-white text-slate-900 shadow-card'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {label} ({listByTab[key].length})
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="rounded-xl bg-white border border-slate-200/80 px-6 py-12 text-center text-slate-500 text-sm">
          No tienes cupones en esta categoría.
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((c) => {
            const oferta = ofertasMap[c.ofertaId];
            const fotoURL = oferta?.fotoURL;
            return (
            <li
              key={c.id}
              className="bg-white rounded-xl border border-slate-200/80 shadow-card p-5 flex flex-wrap items-center justify-between gap-4"
            >
              <div className="flex gap-4 flex-1 min-w-0">
                {fotoURL && (
                  <img
                    src={fotoURL}
                    alt=""
                    className="w-20 h-20 object-cover rounded-lg shrink-0 bg-slate-100"
                  />
                )}
                <div className="min-w-0">
                  <p className="font-mono font-semibold text-slate-900 text-sm">{c.codigo}</p>
                  <p className="text-slate-600 mt-0.5 text-sm">{oferta?.titulo ?? 'Oferta'}</p>
                  <p className="text-xs text-slate-500 mt-2">
                    Comprado: {c.fechaCompra} · Válido hasta: {c.fechaLimiteUso}
                  </p>
                </div>
              </div>
              {tab === 'disponibles' && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await descargarPdfCupon(c, ofertasMap[c.ofertaId]);
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  className="shrink-0 px-4 py-2 text-sm font-medium text-blue-800 border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors duration-150"
                >
                  Descargar PDF
                </button>
              )}
            </li>
          );
          })}
        </ul>
      )}
    </div>
  );
}
