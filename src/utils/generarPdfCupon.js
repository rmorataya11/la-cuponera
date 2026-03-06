import { jsPDF } from 'jspdf';

const PRIMARY_RGB = { r: 45, g: 63, b: 194 };
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/**
 * Formatea YYYY-MM-DD a "15 de marzo de 2025".
 */
function formatearFecha(str) {
  if (!str || typeof str !== 'string') return '';
  const [y, m, d] = str.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return str;
  const mes = MESES[m - 1];
  return `${d} de ${mes} de ${y}`;
}

/**
 * Carga una imagen desde URL y la convierte a base64 (data URL) para jsPDF.
 */
function loadImageAsDataUrl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const maxSize = 120;
        let w = img.naturalWidth;
        let h = img.naturalHeight;
        if (w > maxSize || h > maxSize) {
          if (w > h) {
            h = (h * maxSize) / w;
            w = maxSize;
          } else {
            w = (w * maxSize) / h;
            h = maxSize;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
    img.src = url;
  });
}

/**
 * Envuelve texto en el PDF dentro del ancho máximo (en mm).
 */
function wrapText(doc, text, x, y, maxWidth, lineHeight = 5) {
  if (!text) return y;
  const lines = doc.splitTextToSize(String(text), maxWidth);
  lines.forEach((line) => {
    doc.text(line, x, y);
    y += lineHeight;
  });
  return y;
}

/**
 * Genera y descarga un PDF con los datos del cupón.
 * @param {Object} cupon - { codigo, fechaCompra, fechaLimiteUso }
 * @param {Object} oferta - { titulo, precioOferta, descripcion, fotoURL, empresaNombre } (opcional)
 */
export async function descargarPdfCupon(cupon, oferta = {}) {
  const doc = new jsPDF({ format: 'a5' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 18;
  const maxW = pageW - margin * 2;
  let y = 18;

  const titulo = oferta.titulo || 'Cupón';
  const precio = oferta.precioOferta != null ? `$${Number(oferta.precioOferta).toFixed(2)}` : '';
  const empresaNombre = oferta.empresaNombre || oferta.empresa || '';
  const descripcion = oferta.descripcion || '';
  const fechaCompraStr = formatearFecha(cupon.fechaCompra);
  const fechaLimiteStr = formatearFecha(cupon.fechaLimiteUso);
  const codigo = (cupon.codigo || '').toString();

  // --- Encabezado con color de marca ---
  doc.setFillColor(PRIMARY_RGB.r, PRIMARY_RGB.g, PRIMARY_RGB.b);
  doc.rect(0, 0, pageW, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Cuponía', margin, 14);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Cupón de descuento', margin, 20);
  doc.setTextColor(0, 0, 0);
  y = 30;

  // --- Imagen de la oferta (opcional) ---
  let imgData = null;
  if (oferta.fotoURL) {
    try {
      imgData = await loadImageAsDataUrl(oferta.fotoURL);
    } catch (_) {
      // Si falla la carga, seguimos sin imagen
    }
  }

  if (imgData) {
    doc.addImage(imgData, 'JPEG', margin, y, 28, 28);
    y += 32;
  }

  // --- Título de la oferta (destacado) ---
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(titulo, margin, y);
  y += 7;

  if (empresaNombre) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`Canjeable en: ${empresaNombre}`, margin, y);
    doc.setTextColor(0, 0, 0);
    y += 6;
  }

  if (precio) {
    doc.setFontSize(11);
    doc.text(`Precio oferta: ${precio}`, margin, y);
    y += 6;
  }

  // --- Descripción (con wrap) ---
  if (descripcion) {
    y += 2;
    doc.setFontSize(9);
    y = wrapText(doc, descripcion, margin, y, maxW, 5);
    y += 3;
  }

  // --- Línea separadora ---
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  // --- Fechas legibles ---
  doc.setFontSize(10);
  doc.text(`Comprado: ${fechaCompraStr}`, margin, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text(`Válido hasta: ${fechaLimiteStr}`, margin, y);
  doc.setFont('helvetica', 'normal');
  y += 10;

  // --- Recuadro "Código para el comercio" ---
  const boxH = 26;
  doc.setDrawColor(PRIMARY_RGB.r, PRIMARY_RGB.g, PRIMARY_RGB.b);
  doc.setLineWidth(0.6);
  doc.rect(margin, y, maxW, boxH);
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text('Código para el comercio — Presentar en caja', margin + 2, y + 6);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('courier', 'bold');
  doc.text(codigo, pageW / 2, y + 18, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  y += boxH + 8;

  // --- Aviso ---
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Este cupón es intransferible. Válido solo con DUI del comprador.', margin, y);
  y += 10;

  // --- Pie de página ---
  const hoyStr = formatearFecha(new Date().toISOString().slice(0, 10));
  doc.setFontSize(7);
  doc.text(`Cuponía · Generado el ${hoyStr}`, pageW / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });

  const tituloCorto = titulo.slice(0, 30).replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') || 'cupon';
  const nombre = `cupon-${(codigo || 'cupon').replace(/\s/g, '-')}-${tituloCorto}.pdf`;
  doc.save(nombre);
}
