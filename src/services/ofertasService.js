import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const today = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD

function aFecha(obj) {
  if (obj == null) return '';
  if (typeof obj === 'string') return obj.slice(0, 10);
  if (obj.toDate && typeof obj.toDate === 'function') return obj.toDate().toISOString().slice(0, 10);
  return String(obj).slice(0, 10);
}

/**
 * Ofertas vigentes: estado aprobada y con cupones disponibles.
 * Por ahora no se filtra por fechas (inicio/fin) para evitar problemas con zona horaria o fecha del sistema.
 */
export function filterOfertasVigentes(ofertas) {
  return ofertas.filter((o) => {
    if ((o.estado || '').toLowerCase() !== 'aprobada') return false;
    if (o.cantidadLimite != null && (o.cuponesVendidos ?? 0) >= o.cantidadLimite) return false;
    return true;
  });
}

export async function getRubros() {
  const snap = await getDocs(collection(db, 'rubros'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getEmpresas() {
  const snap = await getDocs(collection(db, 'empresas'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getOfertasAprobadas() {
  const snap = await getDocs(collection(db, 'ofertas'));
  const todas = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return todas.filter((o) => (o.estado || '').toLowerCase() === 'aprobada');
}

export async function getOfertaById(id) {
  const ref = doc(db, 'ofertas', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function getEmpresaById(id) {
  const ref = doc(db, 'empresas', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function getRubroById(id) {
  const ref = doc(db, 'rubros', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}
