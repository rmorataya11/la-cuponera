import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

const today = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD

/**
 * Ofertas vigentes: estado aprobada, fecha actual entre inicio y fin, y con cupones disponibles.
 */
export function filterOfertasVigentes(ofertas) {
  const now = today();
  return ofertas.filter((o) => {
    if (o.estado !== 'aprobada') return false;
    if (o.fechaInicio > now || o.fechaFin < now) return false;
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
  const q = query(
    collection(db, 'ofertas'),
    where('estado', '==', 'aprobada')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
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
