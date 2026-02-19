import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

const today = () => new Date().toISOString().slice(0, 10);

export async function getCuponesByClienteId(clienteId) {
  const q = query(
    collection(db, 'cupones'),
    where('clienteId', '==', clienteId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Clasifica cupones en disponibles, canjeados y vencidos.
 * Disponibles: estado 'disponible' y fecha límite >= hoy.
 * Canjeados: estado 'canjeado'.
 * Vencidos: estado 'vencido' o (estado 'disponible' y fecha límite < hoy).
 */
export function clasificarCupones(cupones) {
  const now = today();
  const disponibles = cupones.filter(
    (c) => c.estado === 'disponible' && (c.fechaLimiteUso || '') >= now
  );
  const canjeados = cupones.filter((c) => c.estado === 'canjeado');
  const vencidos = cupones.filter(
    (c) =>
      c.estado === 'vencido' ||
      (c.estado === 'disponible' && (c.fechaLimiteUso || '') < now)
  );
  return { disponibles, canjeados, vencidos };
}
