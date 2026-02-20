import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
      await login(form.correo.trim(), form.password);
      navigate(from, { replace: true });
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
            <label htmlFor="password" className="block text-sm font-medium text-slate-600 mb-1.5">
              Contraseña
            </label>
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
          <Link to="/registro" className="font-medium text-blue-800 hover:text-blue-900">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}
