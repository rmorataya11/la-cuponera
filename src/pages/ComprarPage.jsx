import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getOfertaById, getEmpresaById, filterOfertasVigentes } from '../services/ofertasService';
import { procesarCompra } from '../services/compraService';

export default function ComprarPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [oferta, setOferta] = useState(null);
  const [empresa, setEmpresa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    cantidad: 1,
    numeroTarjeta: '',
    vencimiento: '',
    cvv: '',
  });
  const [submitError, setSubmitError] = useState('');
  const [comprando, setComprando] = useState(false);

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
        const emp = o.empresaId ? await getEmpresaById(o.empresaId) : null;
        if (cancelled) return;
        setEmpresa(emp);
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
  const cuponesDisponibles =
    oferta?.cantidadLimite != null
      ? Math.max(0, oferta.cantidadLimite - (oferta.cuponesVendidos ?? 0))
      : null;
  const maxCantidad =
    cuponesDisponibles != null ? Math.max(1, cuponesDisponibles) : 99;

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'cantidad' ? (value === '' ? '' : Number(value)) : value,
    }));
    setSubmitError('');
  }

  function validarTarjeta() {
    const num = form.numeroTarjeta.replace(/\s/g, '');
    if (num.length < 13 || num.length > 19) return 'Número de tarjeta inválido.';
    const ven = form.vencimiento.trim();
    if (!/^\d{2}\/\d{2}$/.test(ven)) return 'Vencimiento debe ser MM/AA.';
    const [mm, aa] = ven.split('/').map(Number);
    if (mm < 1 || mm > 12) return 'Mes inválido.';
    const now = new Date();
    const year = now.getFullYear() % 100;
    const month = now.getMonth() + 1;
    if (aa < year || (aa === year && mm < month)) return 'Tarjeta vencida.';
    if (form.cvv.length < 3 || form.cvv.length > 4) return 'CVV debe tener 3 o 4 dígitos.';
    if (!/^\d+$/.test(form.cvv)) return 'CVV solo números.';
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError('');
    if (!oferta || !vigente) {
      setSubmitError('La oferta ya no está disponible.');
      return;
    }
    if (!user) {
      setSubmitError('Debes iniciar sesión para comprar.');
      return;
    }
    if (form.cantidad < 1 || form.cantidad > maxCantidad) {
      setSubmitError(`Cantidad debe estar entre 1 y ${maxCantidad}.`);
      return;
    }
    const errTarjeta = validarTarjeta();
    if (errTarjeta) {
      setSubmitError(errTarjeta);
      return;
    }
    setComprando(true);
    try {
      const empresaCodigo = empresa?.codigo ?? '';
      await procesarCompra(
        oferta.id,
        user.uid,
        form.cantidad,
        oferta.fechaLimiteUso,
        empresaCodigo
      );
      navigate('/mis-cupones', { replace: true });
    } catch (err) {
      setSubmitError(err.message || 'Error al procesar la compra. Intenta de nuevo.');
    } finally {
      setComprando(false);
    }
  }

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

  if (!vigente) {
    return (
      <div>
        <p className="text-gray-600">Esta oferta ya no está disponible para compra.</p>
        <Link to={`/ofertas/${id}`} className="mt-4 inline-block text-orange-600 hover:text-orange-700">
          ← Volver al detalle
        </Link>
      </div>
    );
  }

  const total = (oferta.precioOferta ?? 0) * form.cantidad;

  return (
    <div className="max-w-lg">
      <Link to={`/ofertas/${id}`} className="text-orange-600 hover:text-orange-700 text-sm mb-4 inline-block">
        ← Volver al detalle
      </Link>

      <h1 className="text-2xl font-bold text-gray-800 mb-2">Comprar cupón</h1>
      <p className="text-gray-600 mb-6">{oferta.titulo}{empresa ? ` · ${empresa.nombre}` : ''}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {submitError && (
          <div className="p-3 rounded-lg bg-red-100 text-red-700 text-sm" role="alert">
            {submitError}
          </div>
        )}

        <div>
          <label htmlFor="cantidad" className="block text-sm font-medium text-gray-700 mb-1">
            Cantidad de cupones *
          </label>
          <input
            id="cantidad"
            name="cantidad"
            type="number"
            min={1}
            max={maxCantidad}
            value={form.cantidad}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            required
          />
          {cuponesDisponibles != null && (
            <p className="text-sm text-gray-500 mt-1">{cuponesDisponibles} disponibles</p>
          )}
        </div>

        <div className="border-t border-gray-200 pt-4">
          <h2 className="font-semibold text-gray-800 mb-3">Datos de pago (simulación)</h2>
          <div className="space-y-3">
            <div>
              <label htmlFor="numeroTarjeta" className="block text-sm font-medium text-gray-700 mb-1">
                Número de tarjeta *
              </label>
              <input
                id="numeroTarjeta"
                name="numeroTarjeta"
                type="text"
                inputMode="numeric"
                placeholder="1234 5678 9012 3456"
                value={form.numeroTarjeta}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                maxLength={19}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="vencimiento" className="block text-sm font-medium text-gray-700 mb-1">
                  Vencimiento (MM/AA) *
                </label>
                <input
                  id="vencimiento"
                  name="vencimiento"
                  type="text"
                  placeholder="12/28"
                  value={form.vencimiento}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  maxLength={5}
                />
              </div>
              <div>
                <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-1">
                  CVV *
                </label>
                <input
                  id="cvv"
                  name="cvv"
                  type="text"
                  inputMode="numeric"
                  placeholder="123"
                  value={form.cvv}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  maxLength={4}
                />
              </div>
            </div>
          </div>
        </div>

        <p className="text-lg font-semibold text-gray-800">
          Total: ${total.toFixed(2)}
        </p>

        <button
          type="submit"
          disabled={comprando}
          className="w-full py-2.5 px-4 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {comprando ? 'Procesando compra...' : 'Confirmar compra'}
        </button>
      </form>
    </div>
  );
}
