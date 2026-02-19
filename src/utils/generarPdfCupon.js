import { jsPDF } from 'jspdf';

/**
 * Genera y descarga un PDF con los datos del cupón.
 * @param {Object} cupon - { codigo, fechaCompra, fechaLimiteUso }
 * @param {Object} oferta - { titulo, precioOferta } (opcional)
 */
export function descargarPdfCupon(cupon, oferta = {}) {
  const doc = new jsPDF({ format: 'a5' });
  const titulo = oferta.titulo || 'Cupón';
  const precio = oferta.precioOferta != null ? `$${Number(oferta.precioOferta).toFixed(2)}` : '';

  doc.setFontSize(18);
  doc.text('La Cuponera', 20, 25);
  doc.setFontSize(12);
  doc.text('Cupón de descuento', 20, 35);

  doc.setDrawColor(200, 200, 200);
  doc.line(20, 42, 175, 42);

  doc.setFontSize(14);
  doc.text(titulo, 20, 52);
  if (precio) {
    doc.setFontSize(11);
    doc.text(`Precio oferta: ${precio}`, 20, 60);
  }

  doc.setFontSize(10);
  doc.text(`Código del cupón: ${cupon.codigo || ''}`, 20, 75);
  doc.text(`Presentar este cupón antes del: ${cupon.fechaLimiteUso || ''}`, 20, 82);
  doc.text(`Fecha de compra: ${cupon.fechaCompra || ''}`, 20, 89);

  doc.setDrawColor(255, 150, 0);
  doc.setLineWidth(0.5);
  doc.rect(20, 95, 155, 25);
  doc.setFontSize(12);
  doc.text(cupon.codigo || '', 97, 110, { align: 'center' });

  doc.setFontSize(8);
  doc.text('Este cupón es intransferible. Válido solo con DUI del comprador.', 20, 135);

  const nombre = `cupon-${(cupon.codigo || 'cupon').replace(/\s/g, '-')}.pdf`;
  doc.save(nombre);
}
