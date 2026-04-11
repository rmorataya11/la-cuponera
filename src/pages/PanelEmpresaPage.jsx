import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRubros } from '../services/ofertasService';
import {
  createUserWithEmailAndPassword,
  signOut,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '../firebase';
import {
  getEmpresaByAdminUid,
  getOfertasPorEmpresa,
  getEmpleadosPorEmpresa,
  addOferta,
  updateOferta,
  uploadOfertaImagen,
  addEmpleado,
  updateEmpleado,
  setEmpleadoUid,
  deleteEmpleado,
} from '../services/adminService';
import { setEmpleadoByUid } from '../services/canjeService';
import { IconPencil } from '../components/icons';

const PRIMARY = '#2097A9';
const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';

function diasHasta(fechaStr) {
  if (!fechaStr) return null;
  const hoy = new Date();
  const f = new Date(fechaStr);
  return Math.ceil((f - hoy) / (1000 * 60 * 60 * 24));
}

function Badge({ estado }) {
  const map = {
    aprobada: 'bg-green-100 text-green-700',
    pendiente: 'bg-amber-100 text-amber-700',
    rechazada: 'bg-red-100 text-red-700',
  };
  const c = map[(estado || '').toLowerCase()] ?? 'bg-slate-100 text-slate-500';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c}`}>
      {estado || '—'}
    </span>
  );
}

export default function PanelEmpresaPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [empresa, setEmpresa] = useState(null);
  const [ofertas, setOfertas] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [rubros, setRubros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState('todas');
  const [showForm, setShowForm] = useState(false);
  const [editingOferta, setEditingOferta] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadImageError, setUploadImageError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef(null);
  const [showFormEmpleado, setShowFormEmpleado] = useState(false);
  const [editingEmpleado, setEditingEmpleado] = useState(null);
  const [savingEmpleado, setSavingEmpleado] = useState(false);
  const [formEmpleado, setFormEmpleado] = useState({
  nombres: '',
  apellidos: '',
  correo: '',
  crearCuenta: false,
  contraseña: '',
  tuContraseña: '',
});
const [credencialesCreadas, setCredencialesCreadas] = useState(null);
  const [empleadosLoadError, setEmpleadosLoadError] = useState(null);
  const [form, setForm] = useState({
    rubroId: '',
    titulo: '',
    precioRegular: '',
    precioOferta: '',
    fechaInicio: '',
    fechaFin: '',
    fechaLimiteUso: '',
    cantidadLimite: '',
    descripcion: '',
    otrosDetalles: '',
    fotoURL: '',
  });

  const empleadosEmpresaId = (empresa?.id === 'empresal') ? 'empresa1' : (empresa?.id ?? '');

  async function refetch() {
    if (!user?.uid || !empresa?.id) return;
    setError('');
    setEmpleadosLoadError(null);
    try {
      const ofertasIds = [empresa.id];
      if (empresa.id === 'empresal') ofertasIds.push('empresa1');
      if (empresa.id === 'empresa1') ofertasIds.push('empresal');
      const [ofertasListas, rubrosRaw, empleadosResult] = await Promise.all([
        Promise.all(ofertasIds.map((id) => getOfertasPorEmpresa(id))),
        getRubros(),
        getEmpleadosPorEmpresa(empleadosEmpresaId || empresa.id, user.uid).then((data) => ({ ok: true, data })).catch((err) => ({ ok: false, err })),
      ]);
      const seenO = new Set();
      const ofertasRaw = ofertasListas.flat().filter((o) => {
        if (seenO.has(o.id)) return false;
        seenO.add(o.id);
        return true;
      });
      setOfertas(ofertasRaw);
      setRubros(rubrosRaw);
      if (empleadosResult.ok) {
        setEmpleados(empleadosResult.data);
        setEmpleadosLoadError(null);
      } else {
        setEmpleadosLoadError(empleadosResult.err?.message || 'Sin permiso para leer empleados.');
      }
    } catch (err) {
      setError(err?.message || 'Error al cargar datos.');
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user?.uid) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const emp = await getEmpresaByAdminUid(user.uid);
        if (cancelled) return;
        setEmpresa(emp);
        if (!emp) {
          setLoading(false);
          return;
        }
        // Normalizar ID: si el doc está como "empresal" (typo) pero los empleados usan "empresa1", usar empresa1 para empleados.
        const empleadosEmpresaId = (emp.id === 'empresal') ? 'empresa1' : emp.id;
        const ofertasIds = [emp.id];
        if (emp.id === 'empresal') ofertasIds.push('empresa1');
        if (emp.id === 'empresa1') ofertasIds.push('empresal');
        const [ofertasListas, rubrosRaw, empleadosResult] = await Promise.all([
          Promise.all(ofertasIds.map((id) => getOfertasPorEmpresa(id))),
          getRubros(),
          getEmpleadosPorEmpresa(empleadosEmpresaId, user.uid).then((data) => ({ ok: true, data })).catch((err) => ({ ok: false, err })),
        ]);
        if (cancelled) return;
        const seenO = new Set();
        const ofertasRaw = ofertasListas.flat().filter((o) => {
          if (seenO.has(o.id)) return false;
          seenO.add(o.id);
          return true;
        });
        setOfertas(ofertasRaw);
        setRubros(rubrosRaw);
        if (empleadosResult.ok) {
          setEmpleados(empleadosResult.data);
          setEmpleadosLoadError(null);
        } else {
          setEmpleados([]);
          setEmpleadosLoadError(empleadosResult.err?.message || 'No se pudieron cargar los empleados. Revisá permisos y reglas.');
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Error al cargar.');
} finally {
      if (!cancelled) setLoading(false);
    }
  }
  load();
  return () => { cancelled = true; };
}, [user?.uid]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setUploadImageError('');
  };

  const processImageFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setUploadImageError('Solo se permiten imágenes (JPG, PNG, WebP, GIF).');
      return;
    }
    setUploadImageError('');
    setUploadingImage(true);
    try {
      const url = await uploadOfertaImagen(file);
      setForm((prev) => ({ ...prev, fotoURL: url }));
    } catch (err) {
      setUploadImageError(err?.message || 'No se pudo subir la imagen.');
    } finally {
      setUploadingImage(false);
    }
  };

  const openCreateForm = () => {
    setEditingOferta(null);
    setForm({
      rubroId: empresa?.rubroId ?? '',
      titulo: '',
      precioRegular: '',
      precioOferta: '',
      fechaInicio: '',
      fechaFin: '',
      fechaLimiteUso: '',
      cantidadLimite: '',
      descripcion: '',
      otrosDetalles: '',
      fotoURL: '',
    });
    setUploadImageError('');
    setShowUrlInput(false);
    setError('');
    setShowForm(true);
  };

  const openEditForm = (o) => {
    setEditingOferta(o);
    setForm({
      rubroId: o.rubroId ?? '',
      titulo: o.titulo ?? '',
      precioRegular: o.precioRegular != null && o.precioRegular !== '' ? String(o.precioRegular) : '',
      precioOferta: o.precioOferta != null && o.precioOferta !== '' ? String(o.precioOferta) : '',
      fechaInicio: (o.fechaInicio || '').slice(0, 10),
      fechaFin: (o.fechaFin || '').slice(0, 10),
      fechaLimiteUso: (o.fechaLimiteUso || '').slice(0, 10),
      cantidadLimite: o.cantidadLimite != null ? String(o.cantidadLimite) : '',
      descripcion: o.descripcion ?? '',
      otrosDetalles: o.otrosDetalles ?? '',
      fotoURL: o.fotoURL ?? '',
    });
    setUploadImageError('');
    setShowUrlInput(false);
    setError('');
    setShowForm(true);
  };

  const handleSubmitOferta = async (e) => {
    e.preventDefault();
    if (!form.titulo?.trim()) {
      setError('El título es obligatorio.');
      return;
    }
    if (!form.rubroId) {
      setError('Elegí un rubro.');
      return;
    }
    if (!empresa?.id) return;
    setError('');
    setSaving(true);
    try {
      const payload = { ...form, empresaId: empleadosEmpresaId || empresa.id };
      if (editingOferta) {
        await updateOferta(editingOferta.id, payload);
        setEditingOferta(null);
      } else {
        await addOferta(payload);
      }
      setShowForm(false);
      await refetch();
    } catch (err) {
      const denied =
        err?.code === 'permission-denied' || (err?.message && String(err.message).toLowerCase().includes('permission'));
      if (denied) {
        setError(
          'No tenés permiso para guardar la oferta. Publicá en Firebase las reglas de Firestore del repositorio y comprobá que en la empresa tu UID esté en adminUid.'
        );
      } else {
        setError(err?.message || (editingOferta ? 'No se pudo actualizar.' : 'No se pudo crear la oferta.'));
      }
    } finally {
      setSaving(false);
    }
  };

  const ofertasParaUI = ofertas.map((o) => {
    const precio = Number(o.precioOferta ?? o.precioRegular ?? 0);
    const vendidos = o.cuponesVendidos ?? 0;
    const limite = o.cantidadLimite ?? null;
    const disponibles = limite != null ? Math.max(0, limite - vendidos) : null;
    const ingresos = vendidos * precio;
    const pctComision = Number(empresa?.porcentajeComision ?? 0) / 100;
    const cargoServicio = ingresos * pctComision;
    const rubro = rubros.find((r) => r.id === o.rubroId)?.nombre ?? '—';
    return {
      ...o,
      estado: (o.estado || 'pendiente').toLowerCase(),
      titulo: o.titulo ?? '—',
      rubro,
      precio,
      vendidos,
      limite,
      disponibles,
      ingresos,
      cargoServicio,
      fin: o.fechaFin,
    };
  });

  const filtradas = filtro === 'todas' ? ofertasParaUI : ofertasParaUI.filter((o) => o.estado === filtro);

  const totalVendidos = ofertasParaUI.reduce((s, o) => s + o.vendidos, 0);
  const totalIngresos = ofertasParaUI.reduce((s, o) => s + o.ingresos, 0);
  const totalCargo = ofertasParaUI.reduce((s, o) => s + o.cargoServicio, 0);
  const ofertasAprobadas = ofertasParaUI.filter((o) => o.estado === 'aprobada').length;

  const openCreateFormEmpleado = () => {
    setEditingEmpleado(null);
    setFormEmpleado({ nombres: '', apellidos: '', correo: '', crearCuenta: false, contraseña: '', tuContraseña: '' });
    setCredencialesCreadas(null);
    setError('');
    setShowFormEmpleado(true);
  };
  const openEditFormEmpleado = (e) => {
    setEditingEmpleado(e);
    setFormEmpleado({
      nombres: e.nombres ?? '',
      apellidos: e.apellidos ?? '',
      correo: e.correo ?? '',
      crearCuenta: false,
      contraseña: '',
      tuContraseña: '',
    });
    setError('');
    setShowFormEmpleado(true);
  };
  const handleFormEmpleadoChange = (ev) => {
    const { name, value } = ev.target;
    const next = { ...formEmpleado, [name]: name === 'crearCuenta' ? ev.target.checked : value };
    setFormEmpleado(next);
    setError('');
  };
  const handleSubmitEmpleado = async (ev) => {
    ev.preventDefault();
    if (!formEmpleado.nombres?.trim()) { setError('Los nombres son obligatorios.'); return; }
    if (!formEmpleado.apellidos?.trim()) { setError('Los apellidos son obligatorios.'); return; }
    if (!formEmpleado.correo?.trim()) { setError('El correo es obligatorio.'); return; }
    const correo = (formEmpleado.correo || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      setError('El correo del empleado no es válido. Debe ser un correo electrónico (ej: nombre@dominio.com).');
      return;
    }
    if (!empresa?.id) return;
    const crearCuenta = !editingEmpleado && formEmpleado.crearCuenta;
    if (crearCuenta) {
      if (!(formEmpleado.contraseña || '').trim()) { setError('Ingresá la contraseña para el empleado.'); return; }
      if (formEmpleado.contraseña.length < 6) { setError('La contraseña del empleado debe tener al menos 6 caracteres.'); return; }
      if (!(formEmpleado.tuContraseña || '').trim()) { setError('Ingresá tu contraseña actual para poder volver a tu sesión.'); return; }
    }
    setError('');
    setSavingEmpleado(true);
    try {
      if (editingEmpleado) {
        await updateEmpleado(editingEmpleado.id, formEmpleado);
        setEditingEmpleado(null);
        setShowFormEmpleado(false);
        setFormEmpleado({ nombres: '', apellidos: '', correo: '', crearCuenta: false, contraseña: '', tuContraseña: '' });
        await refetch();
      } else if (crearCuenta) {
        const newId = await addEmpleado({
          nombres: formEmpleado.nombres,
          apellidos: formEmpleado.apellidos,
          correo: formEmpleado.correo,
          empresaId: empleadosEmpresaId || empresa.id,
          empresaAdminUid: user.uid,
          uid: null,
        });
        const adminEmail = user.email;
        const adminPassword = formEmpleado.tuContraseña;
        await createUserWithEmailAndPassword(
          auth,
          (formEmpleado.correo || '').trim().toLowerCase(),
          formEmpleado.contraseña
        );
        try {
          await setEmpleadoUid(newId, auth.currentUser.uid);
          await setEmpleadoByUid(auth.currentUser.uid, empleadosEmpresaId || empresa.id);
        } catch {
          await signOut(auth);
          setError('El empleado se creó pero no se pudo vincular la cuenta (revisá reglas de Firestore). Cerrá sesión y entrá de nuevo con tu correo de admin.');
          setSavingEmpleado(false);
          return;
        }
        await signOut(auth);
        try {
          await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
        } catch {
          navigate('/iniciar-sesion', { replace: true, state: { message: 'Empleado creado. No se pudo volver a tu sesión (tu contraseña de admin no es correcta). Entrá con tu correo de admin.' } });
          setSavingEmpleado(false);
          return;
        }
        navigate('/panel-empresa', { replace: true });
        setCredencialesCreadas({
          correo: (formEmpleado.correo || '').trim().toLowerCase(),
          contraseña: formEmpleado.contraseña,
        });
        setShowFormEmpleado(false);
        setFormEmpleado({ nombres: '', apellidos: '', correo: '', crearCuenta: false, contraseña: '', tuContraseña: '' });
        await refetch();
      } else {
        const newId = await addEmpleado({
          ...formEmpleado,
          empresaId: empleadosEmpresaId || empresa.id,
          empresaAdminUid: user.uid,
        });
        setEmpleados((prev) => [...prev, {
          id: newId,
          empresaId: empleadosEmpresaId || empresa.id,
          nombres: (formEmpleado.nombres || '').trim(),
          apellidos: (formEmpleado.apellidos || '').trim(),
          correo: (formEmpleado.correo || '').trim().toLowerCase(),
          uid: null,
        }]);
        setShowFormEmpleado(false);
        setFormEmpleado({ nombres: '', apellidos: '', correo: '', crearCuenta: false, contraseña: '', tuContraseña: '' });
        await refetch();
      }
    } catch (err) {
      const isPermissionDenied = err?.code === 'permission-denied' || (err?.message && err.message.includes('permission'));
      const isAuth = err?.code === 'auth/email-already-in-use'
        ? 'Ese correo ya está registrado. Usá otro o no marques "Crear cuenta de acceso".'
        : err?.code === 'auth/invalid-email'
          ? 'El correo del empleado no es válido. Usá un correo electrónico (ej: nombre@dominio.com).'
          : err?.code === 'auth/invalid-credential' || err?.code === 'auth/wrong-password'
            ? 'Tu contraseña actual no es correcta. Volvé a intentar.'
            : err?.code === 'auth/weak-password'
              ? 'La contraseña del empleado debe tener al menos 6 caracteres.'
              : null;
      setError(isAuth || (isPermissionDenied
        ? 'No tenés permiso para agregar o editar empleados. Verificá en Firebase que la empresa tenga el campo adminUid con tu UID de usuario y que las reglas de Firestore estén publicadas.'
        : (err?.message || 'No se pudo guardar el empleado.')));
    } finally {
      setSavingEmpleado(false);
    }
  };
  const handleDeleteEmpleado = async (e) => {
    if (!window.confirm(`¿Eliminar a ${(e.nombres || '').trim()} ${(e.apellidos || '').trim()}?`)) return;
    try {
      await deleteEmpleado(e.id);
      await refetch();
    } catch (err) {
      setError(err?.message || 'No se pudo eliminar.');
    }
  };

  const FILTROS = [
    { id: 'todas', label: 'Todas' },
    { id: 'pendiente', label: 'Pendientes' },
    { id: 'aprobada', label: 'Aprobadas' },
    { id: 'rechazada', label: 'Rechazadas' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p className="text-slate-500">Cargando panel...</p>
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-md text-center space-y-4">
          <p className="text-slate-600">No se encontró una empresa vinculada a tu cuenta. Si acabás de crear un empleado con &quot;Crear cuenta&quot;, cerrá sesión y entrá con tu correo de admin.</p>
          <button
            type="button"
            onClick={() => { logout(); navigate('/iniciar-sesion'); }}
            className="px-4 py-2 rounded-lg bg-slate-200 text-slate-800 font-medium hover:bg-slate-300"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <main className="max-w-5xl mx-auto p-6 space-y-6">
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-800 text-sm" role="alert">
            <p>{error}</p>
            {error.includes('adminUid') && user?.uid && empresa?.id && (
              <p className="mt-2 pt-2 border-t border-red-200 text-xs">
                <strong>Para verificar en Firebase:</strong> Tu UID es <code className="bg-red-100 px-1 rounded">{user.uid}</code>. 
                En Firestore, colección <code className="bg-red-100 px-1 rounded">empresas</code>, documento con id <code className="bg-red-100 px-1 rounded">{empresa.id}</code>: el campo <code>adminUid</code> debe ser exactamente ese texto (sin espacios). 
                Publicá las reglas con <code>firebase deploy --only firestore:rules</code>.
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Cupones vendidos</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{totalVendidos}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Ingresos totales</p>
            <p className="text-xl font-bold text-slate-900 mt-1">${totalIngresos.toFixed(2)}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Cargo por servicio</p>
            <p className="text-xl font-bold text-slate-900 mt-1">${totalCargo.toFixed(2)}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Ofertas aprobadas</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{ofertasAprobadas}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFiltro(f.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                filtro === f.id ? 'text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
              }`}
              style={filtro === f.id ? { backgroundColor: PRIMARY } : undefined}
            >
              {f.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => (showForm ? (setShowForm(false), setEditingOferta(null)) : openCreateForm())}
            className="px-4 py-2 rounded-lg text-white font-medium"
            style={{ backgroundColor: PRIMARY }}
          >
            {showForm ? 'Cancelar' : 'Crear oferta'}
          </button>
        </div>

        {showForm && (
          <div className="flex justify-center">
            <form onSubmit={handleSubmitOferta} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 w-full max-w-2xl">
            {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm" role="alert">{error}</div>}
            <h3 className="font-bold text-slate-900">{editingOferta ? 'Editar oferta' : 'Nueva oferta (pendiente de aprobación)'}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-1">Rubro *</label>
                <select name="rubroId" value={form.rubroId} onChange={handleFormChange} required className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white focus:border-[#2097A9] focus:outline-none text-slate-900">
                  <option value="">Elegir rubro</option>
                  {rubros.filter((r) => r.activo !== false).map((r) => (
                    <option key={r.id} value={r.id}>{r.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-1">Imagen (opcional)</label>
                <input ref={fileInputRef} type="file" accept={IMAGE_ACCEPT} onChange={(e) => { const f = e.target?.files?.[0]; if (f) processImageFile(f); e.target.value = ''; }} className="hidden" aria-hidden="true" />
                {form.fotoURL ? (
                  <div className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg bg-slate-50">
                    <img src={form.fotoURL} alt="Vista previa" className="w-24 h-24 object-cover rounded-lg shrink-0" />
                    <button type="button" onClick={() => setForm((p) => ({ ...p, fotoURL: '' }))} className="text-sm font-medium text-red-600">Quitar imagen</button>
                  </div>
                ) : (
                  <div
                    onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer?.files?.[0]; if (f) processImageFile(f); }}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer ${isDragging ? 'border-[#2097A9] bg-[#2097A9]/5' : 'border-slate-200 hover:bg-slate-50'} ${uploadingImage ? 'opacity-70 pointer-events-none' : ''}`}
                  >
                    {uploadingImage ? 'Subiendo...' : 'Arrastrá una imagen o hacé clic'}
                  </div>
                )}
                {showUrlInput && (
                  <input type="url" name="fotoURL" value={form.fotoURL} onChange={handleFormChange} placeholder="URL de imagen" className="mt-2 w-full px-4 py-2 border border-slate-200 rounded-lg text-sm" />
                )}
                <button type="button" onClick={() => setShowUrlInput((v) => !v)} className="mt-2 text-xs text-slate-500">{showUrlInput ? 'Ocultar URL' : 'O pegar URL'}</button>
                {uploadImageError && <p className="mt-1 text-sm text-red-600">{uploadImageError}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-1">Título *</label>
                <input type="text" name="titulo" value={form.titulo} onChange={handleFormChange} required className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white focus:border-[#2097A9] focus:outline-none text-slate-900" placeholder="Ej. 2x1 en desayunos" />
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-1">Precio regular</label>
                <input type="number" name="precioRegular" value={form.precioRegular} onChange={handleFormChange} min={0} step={0.01} className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white focus:border-[#2097A9] focus:outline-none text-slate-900" placeholder="0" />
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-1">Precio oferta</label>
                <input type="number" name="precioOferta" value={form.precioOferta} onChange={handleFormChange} min={0} step={0.01} className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white focus:border-[#2097A9] focus:outline-none text-slate-900" placeholder="0" />
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-1">Fecha inicio</label>
                <input type="date" name="fechaInicio" value={form.fechaInicio} onChange={handleFormChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white focus:border-[#2097A9] focus:outline-none text-slate-900" />
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-1">Fecha fin</label>
                <input type="date" name="fechaFin" value={form.fechaFin} onChange={handleFormChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white focus:border-[#2097A9] focus:outline-none text-slate-900" />
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-1">Fecha límite uso cupón</label>
                <input type="date" name="fechaLimiteUso" value={form.fechaLimiteUso} onChange={handleFormChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white focus:border-[#2097A9] focus:outline-none text-slate-900" />
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-1">Límite cupones (vacío = sin límite)</label>
                <input type="number" name="cantidadLimite" value={form.cantidadLimite} onChange={handleFormChange} min={0} className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white focus:border-[#2097A9] focus:outline-none text-slate-900" placeholder="Opcional" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-1">Descripción</label>
                <textarea name="descripcion" value={form.descripcion} onChange={handleFormChange} rows={2} className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white focus:border-[#2097A9] focus:outline-none text-slate-900" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-1">Otros detalles</label>
                <textarea name="otrosDetalles" value={form.otrosDetalles} onChange={handleFormChange} rows={2} className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white focus:border-[#2097A9] focus:outline-none text-slate-900" />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50" style={{ backgroundColor: PRIMARY }}>
                {saving ? 'Guardando...' : editingOferta ? 'Guardar cambios' : 'Crear oferta'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditingOferta(null); }} className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 font-medium hover:bg-slate-200">Cancelar</button>
            </div>
          </form>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-100">
                  <th className="text-left py-3 px-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Oferta</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Rubro</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Precio</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Vendidos</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Disponibles</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Ingresos totales</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Cargo por servicio</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Días rest.</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Estado</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map((o) => {
                  const dias = o.fin ? diasHasta(o.fin) : null;
                  const diasClass = dias != null && dias <= 3 ? 'text-red-600' : dias != null && dias <= 7 ? 'text-amber-600' : 'text-slate-400';
                  return (
                    <tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 font-medium text-slate-900">{o.titulo}</td>
                      <td className="py-3 px-4 text-sm text-slate-500">{o.rubro}</td>
                      <td className="py-3 px-4 text-slate-600">${Number(o.precio).toFixed(2)}</td>
                      <td className="py-3 px-4 text-slate-600">{o.vendidos}</td>
                      <td className="py-3 px-4 text-slate-600">{o.disponibles ?? '—'}</td>
                      <td className="py-3 px-4 text-slate-600">${o.ingresos.toFixed(2)}</td>
                      <td className="py-3 px-4 text-slate-600">${o.cargoServicio.toFixed(2)}</td>
                      <td className={`py-3 px-4 text-sm font-medium ${diasClass}`}>
                        {dias != null ? (dias > 0 ? `${dias} días` : 'Vencida') : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge estado={o.estado} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => openEditForm(o)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-slate-600 bg-slate-100 hover:bg-slate-200 text-sm"
                        >
                          <IconPencil className="w-3.5 h-3.5 shrink-0" />
                          editar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtradas.length === 0 && (
            <p className="py-8 text-center text-slate-500 text-sm">No hay ofertas en esta categoría.</p>
          )}
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Empleados</h2>
            <button
              type="button"
              onClick={() => (showFormEmpleado ? (setShowFormEmpleado(false), setEditingEmpleado(null)) : openCreateFormEmpleado())}
              className="px-4 py-2 rounded-lg text-white font-medium"
              style={{ backgroundColor: PRIMARY }}
            >
              {showFormEmpleado ? 'Cancelar' : 'Agregar empleado'}
            </button>
          </div>
          {empleadosLoadError && (
            <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-2 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-4">
                <p className="text-slate-600 text-sm">No se pudieron cargar los empleados.</p>
                <button type="button" onClick={() => { setEmpleadosLoadError(null); refetch(); }} className="shrink-0 px-3 py-1.5 rounded-lg bg-slate-200 text-slate-800 font-medium hover:bg-slate-300 text-sm">Reintentar</button>
              </div>
              <p className="text-xs text-slate-500 font-mono">Empresa: {empresa?.id ?? '—'} · Error: {empleadosLoadError}</p>
            </div>
          )}
          {credencialesCreadas && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-green-800 mb-1">Cuenta creada. Credenciales para iniciar sesión:</p>
                <p className="text-sm text-green-700 font-mono">Correo: {credencialesCreadas.correo}</p>
                <p className="text-sm text-green-700 font-mono">Contraseña: {credencialesCreadas.contraseña}</p>
                <p className="text-xs text-green-600 mt-2">Compartí estos datos con el empleado (podrá cambiar la contraseña después).</p>
              </div>
              <button type="button" onClick={() => setCredencialesCreadas(null)} className="shrink-0 px-3 py-1 rounded-lg bg-green-200 text-green-800 font-medium hover:bg-green-300">Cerrar</button>
            </div>
          )}
          {showFormEmpleado && (
            <div className="flex justify-center">
              <form onSubmit={handleSubmitEmpleado} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 w-full max-w-md">
                <h3 className="font-bold text-slate-900">{editingEmpleado ? 'Editar empleado' : 'Nuevo empleado'}</h3>
                <div>
                  <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-1">Nombres *</label>
                  <input type="text" name="nombres" value={formEmpleado.nombres} onChange={handleFormEmpleadoChange} required className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white focus:border-[#2097A9] focus:outline-none text-slate-900" placeholder="Ej. María" />
                </div>
                <div>
                  <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-1">Apellidos *</label>
                  <input type="text" name="apellidos" value={formEmpleado.apellidos} onChange={handleFormEmpleadoChange} required className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white focus:border-[#2097A9] focus:outline-none text-slate-900" placeholder="Ej. García" />
                </div>
                <div>
                  <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-1">Correo *</label>
                  <input type="email" name="correo" value={formEmpleado.correo} onChange={handleFormEmpleadoChange} required className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white focus:border-[#2097A9] focus:outline-none text-slate-900" placeholder="empleado@ejemplo.com" />
                </div>
                {!editingEmpleado && (
                  <>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" name="crearCuenta" checked={!!formEmpleado.crearCuenta} onChange={handleFormEmpleadoChange} className="rounded border-slate-300" />
                      <span className="text-sm text-slate-700">Crear cuenta de acceso para que pueda iniciar sesión</span>
                    </label>
                    {formEmpleado.crearCuenta && (
                      <>
                        <div>
                          <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-1">Contraseña del empleado * (mín. 6 caracteres)</label>
                          <p className="text-xs text-slate-500 mb-1">Elegí cualquier contraseña; el empleado la usará para iniciar sesión. Podés compartirla después.</p>
                          <input type="password" name="contraseña" value={formEmpleado.contraseña || ''} onChange={handleFormEmpleadoChange} minLength={6} placeholder="Ej. empleado123" className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white focus:border-[#2097A9] focus:outline-none text-slate-900" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-1">Tu contraseña actual (admin) *</label>
                          <p className="text-xs text-slate-500 mb-1">La contraseña con la que entraste a este panel. Se usa para volver a tu sesión después de crear la cuenta del empleado.</p>
                          <input type="password" name="tuContraseña" value={formEmpleado.tuContraseña || ''} onChange={handleFormEmpleadoChange} placeholder="Tu contraseña de cafelaesquina@correo.com" className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white focus:border-[#2097A9] focus:outline-none text-slate-900" />
                        </div>
                      </>
                    )}
                  </>
                )}
                <div className="flex gap-2">
                  <button type="submit" disabled={savingEmpleado} className="px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50" style={{ backgroundColor: PRIMARY }}>
                    {savingEmpleado ? 'Guardando...' : editingEmpleado ? 'Guardar cambios' : 'Agregar'}
                  </button>
                  <button type="button" onClick={() => { setShowFormEmpleado(false); setEditingEmpleado(null); }} className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 font-medium hover:bg-slate-200">Cancelar</button>
                </div>
              </form>
            </div>
          )}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-100">
                  <th className="text-left py-3 px-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Nombres</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Apellidos</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Correo</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {empleados.map((e) => (
                  <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium text-slate-900">{e.nombres || '—'}</td>
                    <td className="py-3 px-4 text-slate-600">{e.apellidos || '—'}</td>
                    <td className="py-3 px-4 text-slate-600">{e.correo || '—'}</td>
                    <td className="py-3 px-4 text-right">
                      <button type="button" onClick={() => openEditFormEmpleado(e)} className="mr-1 inline-flex items-center gap-1 px-2 py-1 rounded text-slate-600 bg-slate-100 hover:bg-slate-200 text-sm"><IconPencil className="w-3.5 h-3.5 shrink-0" />editar</button>
                      <button type="button" onClick={() => handleDeleteEmpleado(e)} className="px-2 py-1 rounded text-red-700 bg-red-100 hover:bg-red-200 text-sm">Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {empleados.length === 0 && !showFormEmpleado && (
              <p className="py-8 text-center text-slate-500 text-sm">No hay empleados. Agregá uno para que puedan canjear cupones.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
