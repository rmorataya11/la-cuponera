import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ERROR_MESSAGES = {
  'auth/email-already-in-use': 'Este correo ya está registrado.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  'auth/invalid-email': 'El correo no es válido.',
};

export default function RegistroPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    nombres: '',
    apellidos: '',
    telefono: '',
    correo: '',
    direccion: '',
    dui: '',
    password: '',
    confirmPassword: '',
  });

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  }

  function validate() {
    if (!form.nombres.trim()) return 'Ingresa tus nombres.';
    if (!form.apellidos.trim()) return 'Ingresa tus apellidos.';
    if (!form.telefono.trim()) return 'Ingresa tu teléfono.';
    if (!form.correo.trim()) return 'Ingresa tu correo.';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.correo)) return 'El correo no es válido.';
    if (!form.direccion.trim()) return 'Ingresa tu dirección.';
    if (!form.dui.trim()) return 'Ingresa tu DUI.';
    if (!form.password) return 'Ingresa una contraseña.';
    if (form.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';
    if (form.password !== form.confirmPassword) return 'Las contraseñas no coinciden.';
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register(form.correo.trim(), form.password, {
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        telefono: form.telefono.trim(),
        correo: form.correo.trim(),
        direccion: form.direccion.trim(),
        dui: form.dui.trim(),
      });
      navigate('/', { replace: true });
    } catch (err) {
      const message = ERROR_MESSAGES[err.code] || err.message || 'Error al registrarse.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Registro de cliente</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-100 text-red-700 text-sm" role="alert">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="nombres" className="block text-sm font-medium text-gray-700 mb-1">
            Nombres *
          </label>
          <input
            id="nombres"
            name="nombres"
            type="text"
            value={form.nombres}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="Ej. Juan Carlos"
            required
          />
        </div>

        <div>
          <label htmlFor="apellidos" className="block text-sm font-medium text-gray-700 mb-1">
            Apellidos *
          </label>
          <input
            id="apellidos"
            name="apellidos"
            type="text"
            value={form.apellidos}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="Ej. Pérez López"
            required
          />
        </div>

        <div>
          <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono *
          </label>
          <input
            id="telefono"
            name="telefono"
            type="tel"
            value={form.telefono}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="Ej. 7000-0000"
            required
          />
        </div>

        <div>
          <label htmlFor="correo" className="block text-sm font-medium text-gray-700 mb-1">
            Correo *
          </label>
          <input
            id="correo"
            name="correo"
            type="email"
            value={form.correo}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="correo@ejemplo.com"
            required
          />
        </div>

        <div>
          <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 mb-1">
            Dirección *
          </label>
          <input
            id="direccion"
            name="direccion"
            type="text"
            value={form.direccion}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="Ej. San Salvador"
            required
          />
        </div>

        <div>
          <label htmlFor="dui" className="block text-sm font-medium text-gray-700 mb-1">
            DUI *
          </label>
          <input
            id="dui"
            name="dui"
            type="text"
            value={form.dui}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="Ej. 00000000-0"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Contraseña *
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="Mínimo 6 caracteres"
            required
            minLength={6}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Repetir contraseña *
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="Repite tu contraseña"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Registrando...' : 'Registrarme'}
        </button>
      </form>

      <p className="mt-4 text-center text-gray-600 text-sm">
        ¿Ya tienes cuenta?{' '}
        <Link to="/iniciar-sesion" className="text-orange-600 hover:text-orange-700 font-medium">
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}
