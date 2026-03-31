import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ERROR_SEND = {
  'auth/invalid-email': 'El correo no es válido.',
  'auth/user-not-found': 'No hay ninguna cuenta con ese correo.',
  'auth/too-many-requests': 'Demasiados intentos. Probá más tarde.',
};

const ERROR_CONFIRM = {
  'auth/expired-action-code': 'El enlace venció. Pedí uno nuevo.',
  'auth/invalid-action-code': 'El enlace no es válido o ya fue usado.',
  'auth/weak-password': 'La contraseña es muy débil. Usá al menos 6 caracteres.',
};

function parseResetLinkParams(searchParams, hash) {
  let m = searchParams.get('mode');
  let code = searchParams.get('oobCode');
  const raw = (hash || '').replace(/^#/, '');
  if ((!code || !m) && raw) {
    const h = new URLSearchParams(raw);
    m = m || h.get('mode');
    code = code || h.get('oobCode');
  }
  return { mode: m, oobCode: code };
}

export default function RestablecerContrasenaPage() {
  const {
    resetPassword,
    user,
    validatePasswordResetCode,
    finalizePasswordReset,
  } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { mode, oobCode } = useMemo(
    () => parseResetLinkParams(searchParams, location.hash),
    [searchParams, location.hash]
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState(user?.email ?? '');

  const [linkReady, setLinkReady] = useState(null);
  const [linkEmail, setLinkEmail] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');

  const esFlujoEnlace = mode === 'resetPassword' && Boolean(oobCode);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user?.email]);

  useEffect(() => {
    if (!esFlujoEnlace) {
      setLinkReady(null);
      setLinkEmail('');
      return;
    }
    let cancelled = false;
    setLinkReady('checking');
    setError('');
    (async () => {
      try {
        const em = await validatePasswordResetCode(oobCode);
        if (!cancelled) {
          setLinkEmail(em);
          setLinkReady('ok');
        }
      } catch (err) {
        if (!cancelled) {
          setLinkReady('bad');
          setError(ERROR_CONFIRM[err.code] || err.message || 'Enlace inválido.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [esFlujoEnlace, oobCode, validatePasswordResetCode]);

  async function handleEnviarCorreo(e) {
    e.preventDefault();
    const correo = (email || '').trim();
    if (!correo) {
      setError('Ingresá tu correo.');
      return;
    }
    setError('');
    setSuccess(false);
    setLoading(true);
    try {
      await resetPassword(correo);
      setSuccess(true);
    } catch (err) {
      setError(ERROR_SEND[err.code] || err.message || 'No se pudo enviar el correo.');
    } finally {
      setLoading(false);
    }
  }

  async function handleNuevaClave(e) {
    e.preventDefault();
    setError('');
    if (!oobCode) return;
    if (nueva.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (nueva !== confirmar) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    try {
      await finalizePasswordReset(oobCode, nueva);
      navigate('/restablecer-contrasena', { replace: true, state: { contrasenaActualizada: true } });
    } catch (err) {
      setError(ERROR_CONFIRM[err.code] || err.message || 'No se pudo actualizar la contraseña.');
    } finally {
      setLoading(false);
    }
  }

  if (esFlujoEnlace && linkReady === 'checking') {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-card p-6 sm:p-8 text-center text-slate-600 text-sm">
          Verificando enlace…
        </div>
      </div>
    );
  }

  if (esFlujoEnlace && linkReady === 'bad') {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-card p-6 sm:p-8 space-y-4">
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Enlace no válido</h1>
          {error && (
            <div className="p-3 rounded-lg bg-red-50/80 border border-red-100 text-red-700 text-sm">{error}</div>
          )}
          <p className="text-sm text-slate-600">Pedí un correo nuevo desde la pantalla de restablecimiento.</p>
          <Link to="/restablecer-contrasena" className="inline-block font-medium text-[#2097A9] hover:text-[#1a7a89] text-sm">
            Solicitar nuevo enlace
          </Link>
        </div>
      </div>
    );
  }

  if (location.state?.contrasenaActualizada) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-card p-6 sm:p-8 space-y-4">
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Listo</h1>
          <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm" role="alert">
            Contraseña actualizada. Ya podés iniciar sesión con la nueva clave.
          </div>
          <p className="text-center">
            <Link to="/iniciar-sesion" className="font-medium text-[#2097A9] hover:text-[#1a7a89] text-sm">
              Ir a iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    );
  }

  if (esFlujoEnlace && linkReady === 'ok') {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-card p-6 sm:p-8">
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight mb-2">Nueva contraseña</h1>
          <p className="text-slate-500 text-sm mb-6">
            Cuenta: <span className="font-medium text-slate-700">{linkEmail}</span>
          </p>

          <form onSubmit={handleNuevaClave} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50/80 border border-red-100 text-red-700 text-sm" role="alert">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="nueva" className="block text-sm font-medium text-slate-600 mb-1.5">
                Nueva contraseña
              </label>
              <input
                id="nueva"
                type="password"
                autoComplete="new-password"
                value={nueva}
                onChange={(e) => { setNueva(e.target.value); setError(''); }}
                required
                minLength={6}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white focus:border-[#2097A9] focus:outline-none text-slate-900"
              />
            </div>
            <div>
              <label htmlFor="confirmar" className="block text-sm font-medium text-slate-600 mb-1.5">
                Confirmar contraseña
              </label>
              <input
                id="confirmar"
                type="password"
                autoComplete="new-password"
                value={confirmar}
                onChange={(e) => { setConfirmar(e.target.value); setError(''); }}
                required
                minLength={6}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white focus:border-[#2097A9] focus:outline-none text-slate-900"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? 'Guardando...' : 'Guardar contraseña'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-card p-6 sm:p-8">
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight mb-2">Restablecer contraseña</h1>
        <p className="text-slate-500 text-sm mb-6">
          Ingresá el correo de tu cuenta y te enviaremos un enlace. Al abrirlo, vas a definir la nueva contraseña
          aquí mismo en Cuponía (no en otra página de Firebase).
        </p>

        {success ? (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm" role="alert">
              Revisá tu correo. El enlace te llevará a esta misma web para elegir tu nueva contraseña. Si no lo ves,
              revisá spam.
            </div>
            <p className="text-center text-sm text-slate-500">
              <Link to="/iniciar-sesion" className="font-medium text-[#2097A9] hover:text-[#1a7a89]">
                Volver a iniciar sesión
              </Link>
            </p>
          </div>
        ) : (
          <form onSubmit={handleEnviarCorreo} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50/80 border border-red-100 text-red-700 text-sm" role="alert">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="correo" className="block text-sm font-medium text-slate-600 mb-1.5">
                Correo
              </label>
              <input
                id="correo"
                name="correo"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="correo@ejemplo.com"
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white focus:border-[#2097A9] focus:outline-none text-slate-900"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? 'Enviando...' : 'Enviar enlace'}
            </button>
          </form>
        )}

        {!success && (
          <p className="mt-6 text-center text-sm text-slate-500">
            <Link to="/iniciar-sesion" className="font-medium text-[#2097A9] hover:text-[#1a7a89]">
              Volver a iniciar sesión
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
