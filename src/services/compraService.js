import { collection, doc, increment, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Genera un código único: código empresa (3 letras + 3 dígitos) + 7 dígitos aleatorios.
 */
function generarCodigoCupon(empresaCodigo) {
  const base = (empresaCodigo || '').toString().toUpperCase().replace(/\s/g, '');
  const siete = String(Math.floor(1000000 + Math.random() * 9000000));
  return base + siete;
}

function normalizarEmpresaId(id) {
  if (id == null || id === '') return null;
  return id === 'empresal' ? 'empresa1' : id;
}

/**
 * Procesa la compra: crea N documentos en cupones y actualiza cuponesVendidos en la oferta.
 * @param {string} ofertaId - ID del documento oferta
 * @param {string} clienteId - uid del cliente
 * @param {number} cantidad - número de cupones a generar
 * @param {string} fechaLimiteUso - fecha límite para canjear (de la oferta)
 * @param {string} empresaCodigo - código de la empresa (3 letras + 3 dígitos)
 * @param {string} [empresaId] - ID del documento empresa (para que el empleado pueda canjear)
 */
export async function procesarCompra(ofertaId, clienteId, cantidad, fechaLimiteUso, empresaCodigo, empresaId = null) {
  const batch = writeBatch(db);
  const cuponesRef = collection(db, 'cupones');
  const fechaCompra = new Date().toISOString().slice(0, 10);
  const empresaIdNorm = normalizarEmpresaId(empresaId);

  for (let i = 0; i < cantidad; i++) {
    const codigo = generarCodigoCupon(empresaCodigo);
    const cuponRef = doc(cuponesRef);
    batch.set(cuponRef, {
      codigo,
      ofertaId,
      clienteId,
      empresaId: empresaIdNorm,
      estado: 'disponible',
      fechaCompra,
      fechaLimiteUso: fechaLimiteUso || fechaCompra,
    });
  }

  const ofertaRef = doc(db, 'ofertas', ofertaId);
  batch.update(ofertaRef, { cuponesVendidos: increment(cantidad) });

  await batch.commit();
}
