import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const ERROR_MESSAGES = {
  'auth/email-already-in-use': 'Este correo ya tiene una cuenta. Iniciá sesión.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  'auth/invalid-email': 'El correo no es válido.',
};

export default function ActivarEmpresaPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ correo: '', password: '', confirmPassword: '' });

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const { correo, password, confirmPassword } = form;
    const email = correo.trim();
    if (!email) {
      setError('Ingresá el correo de la empresa.');
      return;
    }
    if (!password || password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      const snap = await getDocs(
        query(
          collection(db, 'empresas'),
          where('correo', '==', email),
          where('estado', '==', 'aprobada')
        )
      );
      const empresaPendiente = snap.docs.find((d) => !d.data().adminUid);
      if (!empresaPendiente) {
        setError('No hay una empresa aprobada con ese correo pendiente de activar, o ya tiene una cuenta vinculada.');
        setLoading(false);
        return;
      }
      await updateDoc(doc(db, 'empresas', empresaPendiente.id), { adminUid: uid });
      navigate('/panel-empresa', { replace: true });
    } catch (err) {
      const message = ERROR_MESSAGES[err.code] || err.message || 'Error al activar la cuenta.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-card p-6 sm:p-8">
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight mb-2">Activar cuenta de empresa</h1>
        <p className="text-slate-500 text-sm mb-6">
          Usá el correo con el que fue aprobada tu empresa. Si ya tenés cuenta, <Link to="/iniciar-sesion" className="font-medium text-blue-800 hover:text-blue-900">iniciá sesión</Link>.
          {' '}<Link to="/restablecer-contrasena" className="font-medium text-blue-800 hover:text-blue-900">¿Olvidaste tu contraseña?</Link>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50/80 border border-red-100 text-red-700 text-sm" role="alert">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="correo" className="block text-sm font-medium text-slate-600 mb-1.5">
              Correo de la empresa
            </label>
            <input
              id="correo"
              name="correo"
              type="email"
              value={form.correo}
              onChange={handleChange}
              placeholder="empresa@ejemplo.com"
              required
              className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white focus:border-blue-600 focus:outline-none text-slate-900"
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
              placeholder="Mínimo 6 caracteres"
              required
              className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white focus:border-blue-600 focus:outline-none text-slate-900"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-600 mb-1.5">
              Confirmar contraseña
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Repetí la contraseña"
              required
              className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white focus:border-blue-600 focus:outline-none text-slate-900"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-base disabled:opacity-50"
          >
            {loading ? 'Activando...' : 'Activar cuenta'}
          </button>
        </form>
      </div>
    </div>
  );
}
