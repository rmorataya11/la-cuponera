import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getOfertaById,
  getEmpresaById,
  getRubroById,
  filterOfertasVigentes,
} from '../services/ofertasService';

export default function OfertaDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [oferta, setOferta] = useState(null);
  const [empresa, setEmpresa] = useState(null);
  const [rubro, setRubro] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!id) return;
      setLoading(true);
      setError('');
      try {
        const o = await getOfertaById(id);
        if (cancelled) return;
        if (!o) {
          setError('Oferta no encontrada.');
          setLoading(false);
          return;
        }
        setOferta(o);
        const [emp, rub] = await Promise.all([
          o.empresaId ? getEmpresaById(o.empresaId) : null,
          o.rubroId ? getRubroById(o.rubroId) : null,
        ]);
        if (cancelled) return;
        setEmpresa(emp);
        setRubro(rub);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Error al cargar la oferta.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  const vigente = oferta ? filterOfertasVigentes([oferta]).length > 0 : false;
  const puedeComprar = user && vigente;

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="text-slate-500 text-sm font-medium">Cargando...</div>
      </div>
    );
  }

  if (error || !oferta) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-red-700">
        {error || 'Oferta no encontrada.'}
        <Link to="/ofertas" className="mt-3 inline-block text-sm font-medium text-orange-600 hover:text-orange-700">
          ← Volver a ofertas
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <Link
        to="/ofertas"
        className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-orange-600 mb-6 transition"
      >
        ← Volver a ofertas
      </Link>

      <article className="bg-white rounded-xl border border-slate-200/80 shadow-card overflow-hidden">
        <div className="p-6 sm:p-8">
          {rubro && (
            <span className="inline-block px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-md mb-3">
              {rubro.nombre}
            </span>
          )}
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{oferta.titulo}</h1>
          {empresa && <p className="text-slate-600 mt-1">{empresa.nombre}</p>}

          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-2xl font-bold text-orange-600">
              ${typeof oferta.precioOferta === 'number' ? oferta.precioOferta.toFixed(2) : oferta.precioOferta}
            </span>
            {typeof oferta.precioRegular === 'number' && (
              <span className="text-slate-400 line-through">${oferta.precioRegular.toFixed(2)}</span>
            )}
          </div>

          {oferta.descripcion && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Descripción</h2>
              <p className="text-slate-600 mt-2 whitespace-pre-wrap">{oferta.descripcion}</p>
            </div>
          )}
          {oferta.otrosDetalles && (
            <div className="mt-4">
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Otros detalles</h2>
              <p className="text-slate-600 mt-2 whitespace-pre-wrap">{oferta.otrosDetalles}</p>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-slate-100 text-sm text-slate-500 space-y-1">
            <p>Válida para compra hasta: {oferta.fechaFin}</p>
            <p>Fecha límite para usar el cupón: {oferta.fechaLimiteUso}</p>
            {oferta.cantidadLimite != null && (
              <p>
                Cupones disponibles: {Math.max(0, (oferta.cantidadLimite ?? 0) - (oferta.cuponesVendidos ?? 0))}
              </p>
            )}
          </div>

          <div className="mt-8">
            {puedeComprar ? (
              <Link
                to={`/ofertas/${id}/comprar`}
                className="inline-flex items-center justify-center px-6 py-3 text-base font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm transition"
              >
                Comprar cupón
              </Link>
            ) : !vigente ? (
              <p className="text-slate-500">Esta oferta ya no está disponible.</p>
            ) : (
              <p className="text-slate-600">
                <Link to="/iniciar-sesion" className="font-medium text-orange-600 hover:text-orange-700">
                  Inicia sesión
                </Link>
                {' '}para comprar esta oferta.
              </p>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}
