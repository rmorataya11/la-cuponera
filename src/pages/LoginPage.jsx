import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRolUsuario } from '../services/rolesService';

const ERROR_MESSAGES = {
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/invalid-email': 'El correo no es válido.',
  'auth/user-disabled': 'Esta cuenta ha sido deshabilitada.',
  'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde.',
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ correo: '', password: '' });

  useEffect(() => {
    const msg = location.state?.message;
    if (msg) {
      setError(msg);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, []);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.correo.trim() || !form.password) {
      setError('Ingresa tu correo y contraseña.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const cred = await login(form.correo.trim(), form.password);
      const uid = cred?.user?.uid;
      const email = cred?.user?.email ?? form.correo?.trim();
      const rol = uid ? await getRolUsuario(uid, email) : 'cliente';
      const to = rol === 'admin' ? '/admin' : rol === 'adminEmpresa' ? '/panel-empresa' : rol === 'empleado' ? '/canjear' : from;
      navigate(to, { replace: true });
    } catch (err) {
      const message = ERROR_MESSAGES[err.code] || err.message || 'Error al iniciar sesión.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-card p-6 sm:p-8">
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight mb-6">Iniciar sesión</h1>

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
              value={form.correo}
              onChange={handleChange}
              placeholder="correo@ejemplo.com"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-slate-600">
                Contraseña
              </label>
              <Link to="/restablecer-contrasena" className="text-sm text-[#2097A9] hover:text-[#1a7a89] font-medium">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Tu contraseña"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-base"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          ¿No tienes cuenta?{' '}
          <Link to="/registro" className="font-medium text-[#2097A9] hover:text-[#1a7a89]">
            Regístrate
          </Link>
        </p>
        <p className="mt-3 text-center text-sm text-slate-500">
          ¿Sos una empresa? Iniciá sesión aquí con el correo de tu empresa. Si aún no activaste tu cuenta,{' '}
          <Link to="/activar-empresa" className="font-medium text-[#2097A9] hover:text-[#1a7a89]">
            activala
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
