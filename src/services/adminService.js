import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
} from 'firebase/firestore';
import { db } from '../firebase';

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

export async function getOfertasTodas() {
  const snap = await getDocs(collection(db, 'ofertas'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function updateOfertaEstado(id, estado) {
  const ref = doc(db, 'ofertas', id);
  await updateDoc(ref, { estado });
}

export async function addOferta(data) {
  const ref = await addDoc(collection(db, 'ofertas'), {
    titulo: data.titulo || '',
    precioRegular: Number(data.precioRegular) || 0,
    precioOferta: Number(data.precioOferta) ?? Number(data.precioRegular) ?? 0,
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
  });
  return ref.id;
}

// --- Clientes (solo admin puede leer todos) ---

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
