import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { isAdmin, setEmpleadoUid } from './adminService';
import { setEmpleadoByUid } from './canjeService';

/**
 * Devuelve el rol del usuario: 'admin' | 'adminEmpresa' | 'empleado' | 'cliente'.
 * Orden: primero admin La Cuponera, luego admin de empresa, luego empleado.
 * Si se pasa email y no hay empleado con ese uid, busca empleado por correo y si tiene uid null lo vincula (para primer login del empleado).
 */
export async function getRolUsuario(uid, email) {
  if (!uid) return 'cliente';
  try {
    if (await isAdmin(uid)) return 'admin';
    const empresasSnap = await getDocs(
      query(
        collection(db, 'empresas'),
        where('adminUid', '==', uid),
        limit(1)
      )
    );
    if (!empresasSnap.empty) return 'adminEmpresa';
    let empleadosSnap = await getDocs(
      query(
        collection(db, 'empleados'),
        where('uid', '==', uid),
        limit(1)
      )
    );
    if (!empleadosSnap.empty) return 'empleado';
    if (email && (email || '').trim()) {
      const correo = (email || '').trim().toLowerCase();
      empleadosSnap = await getDocs(
        query(
          collection(db, 'empleados'),
          where('correo', '==', correo),
          limit(1)
        )
      );
      if (!empleadosSnap.empty) {
        const doc = empleadosSnap.docs[0];
        const data = doc.data();
        if (data.uid == null || data.uid === '') {
          await setEmpleadoUid(doc.id, uid);
          if (data.empresaId) await setEmpleadoByUid(uid, data.empresaId);
          return 'empleado';
        }
      }
    }
  } catch (err) {
    if (err?.code === 'permission-denied' || err?.message?.includes('permission')) {
      return 'cliente';
    }
    throw err;
  }
  return 'cliente';
}
