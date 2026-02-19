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

  const labelClass = 'block text-sm font-medium text-slate-700 mb-1.5';

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-card p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-6">Registro de cliente</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm" role="alert">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="nombres" className={labelClass}>Nombres</label>
              <input id="nombres" name="nombres" type="text" value={form.nombres} onChange={handleChange} placeholder="Juan Carlos" required />
            </div>
            <div>
              <label htmlFor="apellidos" className={labelClass}>Apellidos</label>
              <input id="apellidos" name="apellidos" type="text" value={form.apellidos} onChange={handleChange} placeholder="Pérez López" required />
            </div>
          </div>

          <div>
            <label htmlFor="telefono" className={labelClass}>Teléfono</label>
            <input id="telefono" name="telefono" type="tel" value={form.telefono} onChange={handleChange} placeholder="7000-0000" required />
          </div>
          <div>
            <label htmlFor="correo" className={labelClass}>Correo</label>
            <input id="correo" name="correo" type="email" value={form.correo} onChange={handleChange} placeholder="correo@ejemplo.com" required />
          </div>
          <div>
            <label htmlFor="direccion" className={labelClass}>Dirección</label>
            <input id="direccion" name="direccion" type="text" value={form.direccion} onChange={handleChange} placeholder="San Salvador" required />
          </div>
          <div>
            <label htmlFor="dui" className={labelClass}>DUI</label>
            <input id="dui" name="dui" type="text" value={form.dui} onChange={handleChange} placeholder="00000000-0" required />
          </div>
          <div>
            <label htmlFor="password" className={labelClass}>Contraseña</label>
            <input id="password" name="password" type="password" value={form.password} onChange={handleChange} placeholder="Mínimo 6 caracteres" required minLength={6} />
          </div>
          <div>
            <label htmlFor="confirmPassword" className={labelClass}>Repetir contraseña</label>
            <input id="confirmPassword" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} placeholder="Repite tu contraseña" required />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 text-base font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Registrando...' : 'Registrarme'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          ¿Ya tienes cuenta?{' '}
          <Link to="/iniciar-sesion" className="font-medium text-orange-600 hover:text-orange-700">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
