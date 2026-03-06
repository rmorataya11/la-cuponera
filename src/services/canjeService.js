import { collection, doc, getDoc, getDocs, query, where, limit, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Crea/actualiza empleadoByUid/{uid} con { empresaId }. Debe llamarlo el propio empleado (tras crear su cuenta).
 */
export async function setEmpleadoByUid(uid, empresaId) {
  if (!uid || !empresaId) return;
  await setDoc(doc(db, 'empleadoByUid', uid), { empresaId });
}

function normalizarEmpresaId(id) {
  return id === 'empresal' ? 'empresa1' : (id || null);
}

/**
 * Devuelve el empresaId del empleado (desde empleadoByUid). Null si no existe. Normaliza empresal -> empresa1.
 */
export async function getEmpresaIdEmpleado(uid) {
  if (!uid) return null;
  const snap = await getDoc(doc(db, 'empleadoByUid', uid));
  return snap.exists() ? normalizarEmpresaId(snap.data().empresaId) : null;
}

/**
 * Asegura que exista empleadoByUid/{uid} con empresaId para que las reglas permitan al empleado leer/canjear cupones.
 * Si no existe, busca el empleado por uid y escribe el doc. Devuelve el empresaId si existe o se creó.
 */
export async function ensureEmpleadoByUid(uid) {
  if (!uid) return null;
  const ref = doc(db, 'empleadoByUid', uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return normalizarEmpresaId(snap.data().empresaId);
  const empleadosSnap = await getDocs(
    query(collection(db, 'empleados'), where('uid', '==', uid), limit(1))
  );
  if (empleadosSnap.empty) return null;
  let empresaId = empleadosSnap.docs[0].data().empresaId;
  if (!empresaId) return null;
  if (empresaId === 'empresal') empresaId = 'empresa1';
  await setDoc(ref, { empresaId });
  return empresaId;
}

/**
 * Cupones disponibles de una empresa (para pantalla del empleado). Solo estado disponible y no vencidos.
 * Si hay dos IDs para la misma empresa (ej. empresal / empresa1), consulta ambos y une resultados.
 */
const today = () => new Date().toISOString().slice(0, 10);

async function getCuponesDisponiblesPorEmpresaId(empresaId, hoy) {
  const snap = await getDocs(
    query(
      collection(db, 'cupones'),
      where('empresaId', '==', empresaId),
      where('estado', '==', 'disponible'),
      limit(100)
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((c) => (c.fechaLimiteUso || '') >= hoy);
}

export async function getCuponesDisponiblesPorEmpresa(empresaId) {
  if (!empresaId) return [];
  const hoy = today();
  const ids = [empresaId];
  if (empresaId === 'empresal') ids.push('empresa1');
  if (empresaId === 'empresa1') ids.push('empresal');
  const listas = [];
  for (const id of ids) {
    try {
      const lista = await getCuponesDisponiblesPorEmpresaId(id, hoy);
      listas.push(lista);
    } catch (_) {
      // El empleado solo puede leer cupones de su empresaId; el otro id puede dar permission-denied
    }
  }
  const seen = new Set();
  return listas.flat().filter((c) => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });
}

/**
 * Busca un cupón por código. El empleado solo podrá leer cupones de su empresa (reglas).
 */
export async function getCuponByCodigo(codigo) {
  const c = (codigo || '').toString().trim();
  if (!c) return null;
  const snap = await getDocs(
    query(
      collection(db, 'cupones'),
      where('codigo', '==', c),
      limit(1)
    )
  );
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

/**
 * Marca el cupón como canjeado. Solo permitido si el empleado es de la misma empresa que el cupón.
 */
export async function canjearCupon(cuponId) {
  const ref = doc(db, 'cupones', cuponId);
  await updateDoc(ref, {
    estado: 'canjeado',
    fechaCanje: new Date().toISOString(),
  });
}
