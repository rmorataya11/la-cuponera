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
      <div className="flex justify-center py-12">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  if (error || !oferta) {
    return (
      <div>
        <p className="text-red-600">{error || 'Oferta no encontrada.'}</p>
        <Link to="/ofertas" className="mt-4 inline-block text-orange-600 hover:text-orange-700">
          ← Volver a ofertas
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <Link to="/ofertas" className="text-orange-600 hover:text-orange-700 text-sm mb-4 inline-block">
        ← Volver a ofertas
      </Link>

      <article className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-800">{oferta.titulo}</h1>
        {empresa && <p className="text-gray-600 mt-1">{empresa.nombre}</p>}
        {rubro && (
          <span className="inline-block mt-2 px-2 py-0.5 text-sm bg-gray-100 text-gray-700 rounded">
            {rubro.nombre}
          </span>
        )}

        <div className="mt-4 flex items-baseline gap-3">
          <span className="text-2xl font-bold text-orange-600">
            ${typeof oferta.precioOferta === 'number' ? oferta.precioOferta.toFixed(2) : oferta.precioOferta}
          </span>
          {typeof oferta.precioRegular === 'number' && (
            <span className="text-gray-400 line-through">${oferta.precioRegular.toFixed(2)}</span>
          )}
        </div>

        {oferta.descripcion && (
          <div className="mt-4">
            <h2 className="font-semibold text-gray-800">Descripción</h2>
            <p className="text-gray-600 whitespace-pre-wrap">{oferta.descripcion}</p>
          </div>
        )}
        {oferta.otrosDetalles && (
          <div className="mt-4">
            <h2 className="font-semibold text-gray-800">Otros detalles</h2>
            <p className="text-gray-600 whitespace-pre-wrap">{oferta.otrosDetalles}</p>
          </div>
        )}

        <div className="mt-4 text-sm text-gray-500">
          <p>Válida para compra hasta: {oferta.fechaFin}</p>
          <p>Fecha límite para usar el cupón: {oferta.fechaLimiteUso}</p>
          {oferta.cantidadLimite != null && (
            <p>
              Cupones disponibles: {Math.max(0, (oferta.cantidadLimite ?? 0) - (oferta.cuponesVendidos ?? 0))}
            </p>
          )}
        </div>

        <div className="mt-6">
          {puedeComprar ? (
            <Link
              to={`/ofertas/${id}/comprar`}
              className="inline-block px-6 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700"
            >
              Comprar cupón
            </Link>
          ) : !vigente ? (
            <p className="text-gray-500">Esta oferta ya no está disponible.</p>
          ) : (
            <p className="text-gray-600">
              <Link to="/iniciar-sesion" className="text-orange-600 hover:text-orange-700 font-medium">
                Inicia sesión
              </Link>
              {' '}para comprar esta oferta.
            </p>
          )}
        </div>
      </article>
    </div>
  );
}
