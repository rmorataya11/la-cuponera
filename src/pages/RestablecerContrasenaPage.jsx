import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ERROR_MESSAGES = {
  'auth/invalid-email': 'El correo no es válido.',
  'auth/user-not-found': 'No hay ninguna cuenta con ese correo.',
  'auth/too-many-requests': 'Demasiados intentos. Probá más tarde.',
};

export default function RestablecerContrasenaPage() {
  const { resetPassword, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState(user?.email ?? '');

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user?.email]);

  async function handleSubmit(e) {
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
      setError(ERROR_MESSAGES[err.code] || err.message || 'No se pudo enviar el correo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-card p-6 sm:p-8">
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight mb-2">Restablecer contraseña</h1>
        <p className="text-slate-500 text-sm mb-6">
          Ingresá el correo de tu cuenta y te enviaremos un enlace para crear una nueva contraseña.
        </p>

        {success ? (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm" role="alert">
              Revisá tu correo. Te enviamos un enlace para restablecer tu contraseña. Si no lo ves, revisá la carpeta de spam.
            </div>
            <p className="text-center text-sm text-slate-500">
              <Link to="/iniciar-sesion" className="font-medium text-[#2097A9] hover:text-[#1a7a89]">
                Volver a iniciar sesión
              </Link>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base"
            >
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
