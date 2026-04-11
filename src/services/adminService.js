import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  limit,
  updateDoc,
  addDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';

/**
 * Comprueba si el usuario con uid está en la colección admins.
 * Si Firestore deniega (reglas no publicadas o sin permiso), devuelve false.
 */
export async function isAdmin(uid) {
  if (!uid) return false;
  try {
    const ref = doc(db, 'admins', uid);
    const snap = await getDoc(ref);
    return snap.exists();
  } catch (err) {
    if (err?.code === 'permission-denied' || err?.message?.includes('permission')) {
      return false;
    }
    throw err;
  }
}

// --- Ofertas ---

/** Sube una imagen a Storage en ofertas/{timestamp}_{nombre} y devuelve la URL de descarga. Solo imágenes. */
export async function uploadOfertaImagen(file) {
  if (!file || !file.type.startsWith('image/')) {
    throw new Error('Solo se permiten archivos de imagen.');
  }
  const ext = (file.name.match(/\.[a-zA-Z0-9]+$/) || ['.jpg'])[0];
  const path = `ofertas/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_').slice(0, 80)}${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file, { contentType: file.type });
  return getDownloadURL(storageRef);
}

export async function getOfertasTodas() {
  const snap = await getDocs(collection(db, 'ofertas'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Ofertas de una empresa (para panel admin empresa). */
export async function getOfertasPorEmpresa(empresaId) {
  if (!empresaId) return [];
  const snap = await getDocs(
    query(collection(db, 'ofertas'), where('empresaId', '==', empresaId))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function updateOfertaEstado(id, estado) {
  const docRef = doc(db, 'ofertas', id);
  await updateDoc(docRef, { estado });
}

/** Actualiza los campos editables de una oferta (no modifica estado ni cuponesVendidos). */
export async function updateOferta(id, data) {
  const docRef = doc(db, 'ofertas', id);
  await updateDoc(docRef, {
    titulo: data.titulo ?? '',
    precioRegular: Number(data.precioRegular) || 0,
    precioOferta: Number(data.precioOferta) || Number(data.precioRegular) || 0,
    fechaInicio: (data.fechaInicio || '').slice(0, 10),
    fechaFin: (data.fechaFin || '').slice(0, 10),
    fechaLimiteUso: (data.fechaLimiteUso || data.fechaFin || '').slice(0, 10),
    cantidadLimite: data.cantidadLimite === '' || data.cantidadLimite == null ? null : Number(data.cantidadLimite),
    descripcion: data.descripcion ?? '',
    otrosDetalles: data.otrosDetalles ?? '',
    empresaId: data.empresaId ?? '',
    rubroId: data.rubroId ?? '',
    fotoURL: (data.fotoURL || '').trim() || null,
  });
}

export async function addOferta(data) {
  const ref = await addDoc(collection(db, 'ofertas'), {
    titulo: data.titulo || '',
    precioRegular: Number(data.precioRegular) || 0,
    precioOferta: Number(data.precioOferta) || Number(data.precioRegular) || 0,
    fechaInicio: (data.fechaInicio || '').slice(0, 10),
    fechaFin: (data.fechaFin || '').slice(0, 10),
    fechaLimiteUso: (data.fechaLimiteUso || data.fechaFin || '').slice(0, 10),
    cantidadLimite: data.cantidadLimite === '' || data.cantidadLimite == null ? null : Number(data.cantidadLimite),
    descripcion: data.descripcion || '',
    otrosDetalles: data.otrosDetalles || '',
    estado: 'pendiente',
    empresaId: data.empresaId || '',
    rubroId: data.rubroId || '',
    cuponesVendidos: 0,
    fotoURL: (data.fotoURL || '').trim() || null,
  });
  return ref.id;
}

// --- Rubros (getRubros está en ofertasService; aquí añadimos write) ---

export async function getRubros() {
  const snap = await getDocs(collection(db, 'rubros'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addRubro(data) {
  const ref = await addDoc(collection(db, 'rubros'), {
    nombre: data.nombre || '',
    activo: data.activo !== false,
    ...(data.icono != null && { icono: data.icono }),
  });
  return ref.id;
}

export async function updateRubro(id, data) {
  const ref = doc(db, 'rubros', id);
  const update = {};
  if (data.nombre !== undefined) update.nombre = data.nombre;
  if (data.activo !== undefined) update.activo = data.activo;
  if (data.icono !== undefined) update.icono = data.icono;
  if (Object.keys(update).length) await updateDoc(ref, update);
}

// --- Empresas ---

export async function getEmpresas() {
  const snap = await getDocs(collection(db, 'empresas'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Empresa cuyo usuario es admin de empresa (adminUid === uid).
 * Si email está definido y la primera consulta no devuelve nada, busca por correo (mismo criterio que las reglas: correo del doc = email del usuario).
 */
export async function getEmpresaByAdminUid(uid, email) {
  if (!uid) return null;
  const snap = await getDocs(
    query(
      collection(db, 'empresas'),
      where('adminUid', '==', uid),
      limit(1)
    )
  );
  if (!snap.empty) {
    const d = snap.docs[0];
    return { id: d.id, ...d.data() };
  }
  const e = email && String(email).trim();
  if (!e) return null;
  const correoNorm = e.toLowerCase();
  const snapCorreo = await getDocs(
    query(
      collection(db, 'empresas'),
      where('correo', '==', correoNorm),
      limit(25)
    )
  );
  const found = snapCorreo.docs.find((doc) => {
    const data = doc.data();
    return data.adminUid === uid || String(data.adminUid ?? '') === String(uid);
  });
  if (found) return { id: found.id, ...found.data() };
  return null;
}

export async function addEmpresa(data) {
  const ref = await addDoc(collection(db, 'empresas'), {
    nombre: data.nombre || '',
    codigo: (data.codigo || '').trim().toUpperCase().slice(0, 6),
    direccion: data.direccion || '',
    nombreContacto: data.nombreContacto || '',
    telefono: data.telefono || '',
    correo: (data.correo || '').trim(),
    rubroId: data.rubroId || '',
    porcentajeComision: Number(data.porcentajeComision) || 0,
    estado: 'aprobada',
  });
  return ref.id;
}

/** Elimina una empresa y todas sus ofertas. Solo admin. */
export async function deleteEmpresa(empresaId) {
  if (!empresaId) return;
  const ofertasSnap = await getDocs(
    query(collection(db, 'ofertas'), where('empresaId', '==', empresaId))
  );
  const batch = writeBatch(db);
  ofertasSnap.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(doc(db, 'empresas', empresaId));
  await batch.commit();
}

// --- Empleados (admin o admin de empresa para su empresa) ---

/**
 * Empleados de una empresa (panel empresa).
 * Si pasás viewerAdminUid (UID del admin de empresa), se usa consulta compuesta con empresaAdminUid
 * para cumplir reglas de Firestore en listados (sin get() a /empresas en la regla de list).
 */
export async function getEmpleadosPorEmpresa(empresaId, viewerAdminUid) {
  if (!empresaId) return [];
  if (viewerAdminUid) {
    const snap = await getDocs(
      query(
        collection(db, 'empleados'),
        where('empresaId', '==', empresaId),
        where('empresaAdminUid', '==', viewerAdminUid)
      )
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  const snap = await getDocs(
    query(collection(db, 'empleados'), where('empresaId', '==', empresaId))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Todos los empleados (panel admin global). */
export async function getEmpleadosTodos() {
  const snap = await getDocs(collection(db, 'empleados'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addEmpleado(data) {
  const empresaId = (data.empresaId && String(data.empresaId).trim()) || null;
  if (!empresaId) throw new Error('empresaId es requerido para agregar un empleado.');
  const payload = {
    empresaId,
    nombres: (data.nombres || '').trim(),
    apellidos: (data.apellidos || '').trim(),
    correo: (data.correo || '').trim().toLowerCase(),
    uid: data.uid || null,
  };
  if (data.empresaAdminUid) {
    payload.empresaAdminUid = data.empresaAdminUid;
  }
  const ref = await addDoc(collection(db, 'empleados'), payload);
  return ref.id;
}

/**
 * Rellena empresaAdminUid en empleados antiguos (copiado de empresas/{id}.adminUid).
 * Solo puede ejecutarlo un admin global; llamar desde el panel admin.
 */
export async function backfillEmpresaAdminUidEnEmpleados() {
  const [empleadosSnap, empresasSnap] = await Promise.all([
    getDocs(collection(db, 'empleados')),
    getDocs(collection(db, 'empresas')),
  ]);
  const empresaAdminById = Object.fromEntries(
    empresasSnap.docs.map((d) => [d.id, d.data()?.adminUid || null])
  );
  let actualizados = 0;
  for (const d of empleadosSnap.docs) {
    const e = d.data();
    if (e.empresaAdminUid) continue;
    const empresaId = e.empresaId;
    if (!empresaId) continue;
    const adminUid = empresaAdminById[empresaId];
    if (!adminUid) continue;
    await updateDoc(doc(db, 'empleados', d.id), { empresaAdminUid: adminUid });
    actualizados += 1;
  }
  return actualizados;
}

export async function updateEmpleado(id, data) {
  const ref = doc(db, 'empleados', id);
  const updates = {
    nombres: (data.nombres || '').trim(),
    apellidos: (data.apellidos || '').trim(),
    correo: (data.correo || '').trim().toLowerCase(),
  };
  if (data.uid !== undefined) updates.uid = data.uid;
  await updateDoc(ref, updates);
}

/** Solo actualiza el campo uid del empleado (para vincular cuenta Auth). Lo debe llamar el propio usuario recién creado. */
export async function setEmpleadoUid(empleadoId, uid) {
  await updateDoc(doc(db, 'empleados', empleadoId), { uid });
}

export async function deleteEmpleado(id) {
  await deleteDoc(doc(db, 'empleados', id));
}

// --- Clientes (solo admin puede leer todos; el cliente puede leer su propio doc) ---

/** Obtiene un cliente por uid. El propio cliente puede leer su doc. */
export async function getClienteByUid(uid) {
  if (!uid) return null;
  const snap = await getDoc(doc(db, 'clientes', uid));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    id: snap.id,
    ...d,
    nombre: [d.nombres, d.apellidos].filter(Boolean).join(' ') || d.correo || snap.id,
  };
}

export async function getClientesTodos() {
  const snap = await getDocs(collection(db, 'clientes'));
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    nombre: [d.data().nombres, d.data().apellidos].filter(Boolean).join(' ') || d.id,
  }));
}

// --- Cupones (solo admin puede leer todos) ---

export async function getCuponesTodos() {
  const snap = await getDocs(collection(db, 'cupones'));
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    vence: d.data().fechaLimiteUso,
    fecha: d.data().fechaCompra,
  }));
}

/**
 * Asigna empresaId a cupones que lo tienen null, tomándolo de la oferta.
 * Solo admin. Devuelve cuántos cupones se actualizaron.
 */
export async function asignarEmpresaIdACuponesSinEmpresa() {
  const cuponesRaw = await getCuponesTodos();
  const sinEmpresa = cuponesRaw.filter((c) => c.empresaId == null || c.empresaId === '');
  let actualizados = 0;
  for (const c of sinEmpresa) {
    if (!c.ofertaId) continue;
    const ofertaSnap = await getDoc(doc(db, 'ofertas', c.ofertaId));
    if (!ofertaSnap.exists()) continue;
    let empresaId = ofertaSnap.data().empresaId;
    if (empresaId == null || empresaId === '') continue;
    if (empresaId === 'empresal') empresaId = 'empresa1';
    await updateDoc(doc(db, 'cupones', c.id), { empresaId });
    actualizados += 1;
  }
  return actualizados;
}
