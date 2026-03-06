import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { ensureEmpleadoByUid, getCuponByCodigo, canjearCupon, getCuponesDisponiblesPorEmpresa } from '../services/canjeService';

const today = () => new Date().toISOString().slice(0, 10);

export default function CanjearPage() {
  const { user } = useAuth();
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(true);
  const [mensaje, setMensaje] = useState(null);
  const [error, setError] = useState('');
  const [cupones, setCupones] = useState([]);
  const [canjeandoId, setCanjeandoId] = useState(null);
  const [empresaId, setEmpresaId] = useState(null);
  const [errorCupones, setErrorCupones] = useState(null);

  const cargarCupones = useCallback(async () => {
    if (!user?.uid) return;
    setErrorCupones(null);
    const empId = await ensureEmpleadoByUid(user.uid);
    setEmpresaId(empId || null);
    if (!empId) {
      setErrorCupones('No se pudo cargar tu empresa. Verificá que tu cuenta esté vinculada como empleado en el panel.');
      setCupones([]);
      return;
    }
    try {
      const lista = await getCuponesDisponiblesPorEmpresa(empId);
      setCupones(lista);
    } catch (err) {
      setErrorCupones(err?.message || 'No se pudieron cargar los cupones.');
      setCupones([]);
    }
  }, [user?.uid]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user?.uid) {
        setSyncing(false);
        return;
      }
      try {
        await ensureEmpleadoByUid(user.uid);
        if (!cancelled) await cargarCupones();
      } catch (_) {}
      if (!cancelled) setSyncing(false);
    })();
    return () => { cancelled = true; };
  }, [user?.uid, cargarCupones]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const c = (codigo || '').trim();
    if (!c) {
      setError('Ingresá el código del cupón.');
      setMensaje(null);
      return;
    }
    setError('');
    setMensaje(null);
    setLoading(true);
    try {
      const cupon = await getCuponByCodigo(c);
      if (!cupon) {
        setError('No se encontró un cupón con ese código.');
        setLoading(false);
        return;
      }
      if (cupon.estado !== 'disponible') {
        setError(cupon.estado === 'canjeado' ? 'Este cupón ya fue canjeado.' : 'Este cupón no está disponible.');
        setLoading(false);
        return;
      }
      const hoy = today();
      if ((cupon.fechaLimiteUso || '') < hoy) {
        setError('Este cupón está vencido.');
        setLoading(false);
        return;
      }
      await canjearCupon(cupon.id);
      setMensaje({ tipo: 'ok', texto: 'Cupón canjeado correctamente.' });
      setCodigo('');
      cargarCupones();
    } catch (err) {
      const isPermission = err?.code === 'permission-denied' || err?.message?.includes('permission');
      setError(isPermission
        ? 'No tenés permiso para canjear este cupón (puede ser de otra empresa).'
        : (err?.message || 'No se pudo canjear el cupón.'));
    } finally {
      setLoading(false);
    }
  };

  const handleCanjearDeLista = async (cupon) => {
    setError('');
    setMensaje(null);
    setCanjeandoId(cupon.id);
    try {
      const hoy = today();
      if ((cupon.fechaLimiteUso || '') < hoy) {
        setError('Este cupón está vencido.');
        setCanjeandoId(null);
        return;
      }
      await canjearCupon(cupon.id);
      setMensaje({ tipo: 'ok', texto: 'Cupón canjeado correctamente.' });
      await cargarCupones();
    } catch (err) {
      const isPermission = err?.code === 'permission-denied' || err?.message?.includes('permission');
      setError(isPermission ? 'No tenés permiso para canjear este cupón.' : (err?.message || 'No se pudo canjear.'));
    } finally {
      setCanjeandoId(null);
    }
  };

  if (syncing) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <p className="text-slate-500 text-sm">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <h1 className="text-xl font-semibold text-slate-900 mb-2">Canjear cupón</h1>
          <p className="text-slate-500 text-sm mb-4">
            Cupones comprados de tu empresa. Podés canjear desde la lista o ingresar el código que te muestra el cliente.
          </p>
          <p className="text-slate-400 text-xs mb-6">{user?.email}</p>

          {cupones.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-slate-700 mb-3">Cupones disponibles ({cupones.length})</h2>
              <ul className="space-y-2">
                {cupones.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between gap-3 py-3 px-4 bg-slate-50 rounded-xl border border-slate-100"
                  >
                    <div className="min-w-0">
                      <p className="font-mono font-semibold text-slate-900 truncate">{c.codigo}</p>
                      <p className="text-xs text-slate-500">
                        Vence: {c.fechaLimiteUso || '—'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCanjearDeLista(c)}
                      disabled={canjeandoId === c.id}
                      className="shrink-0 px-4 py-2 rounded-lg text-white font-medium text-sm disabled:opacity-50"
                      style={{ backgroundColor: '#2d3fc2' }}
                    >
                      {canjeandoId === c.id ? 'Canjeando...' : 'Canjear'}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {errorCupones && (
            <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-amber-800 text-sm">
              {errorCupones}
            </div>
          )}
          {!empresaId && !syncing && (
            <p className="text-slate-500 text-sm mb-4">No se detectó tu empresa. Entrá al panel de empresa con tu admin y vinculá tu cuenta como empleado (o creá el empleado con &quot;Crear cuenta&quot;).</p>
          )}
          {empresaId && cupones.length === 0 && !errorCupones && (
            <p className="text-slate-500 text-sm mb-4">
              No hay cupones disponibles (empresa: <span className="font-mono">{empresaId}</span>). Revisá en Firestore que los cupones tengan <span className="font-mono">empresaId</span> igual. Podés canjear por código abajo.
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="codigo" className="block text-xs font-semibold tracking-wider text-slate-500 uppercase mb-1">Canjear por código</label>
              <input
                id="codigo"
                type="text"
                value={codigo}
                onChange={(e) => { setCodigo(e.target.value); setError(''); setMensaje(null); }}
                placeholder="Ej. CAF1234567890"
                className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-white focus:border-[#2d3fc2] focus:outline-none text-slate-900 font-mono text-center"
                disabled={loading}
              />
            </div>
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-red-700 text-sm">
                {error}
              </div>
            )}
            {mensaje?.tipo === 'ok' && (
              <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-green-800 text-sm font-medium">
                {mensaje.texto}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg text-white font-semibold disabled:opacity-50"
              style={{ backgroundColor: '#2d3fc2' }}
            >
              {loading ? 'Canjeando...' : 'Canjear por código'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
