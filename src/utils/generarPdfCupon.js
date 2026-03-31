import { jsPDF } from 'jspdf';
import { ref, getBlob } from 'firebase/storage';
import { storage } from '../firebase';

/** Marca Cuponía — #2097A9 */
const BRAND = { r: 32, g: 151, b: 169 };
const BRAND_DARK = { r: 26, g: 122, b: 137 };
const BRAND_TINT = { r: 232, g: 244, b: 246 };
const SLATE = { r: 71, g: 85, b: 105 };
const SLATE_LIGHT = { r: 148, g: 163, b: 184 };

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

/** Tamaño del canvas cuadrado (alto dpi); dibujo tipo object-fit: cover. */
const FOTO_COVER_PX = 256;

/**
 * Fondo detrás de la foto (evita bandas blancas si el visor asume transparencia).
 * RGB de Tailwind slate-100.
 */
const FOTO_BG = '#f1f5f9';

function normalizeImageUrl(u) {
  if (!u || typeof u !== 'string') return null;
  const t = u.trim();
  if (!t) return null;
  if (t.startsWith('//')) return `https:${t}`;
  return t;
}

/**
 * URL de foto: cupón (denormalizado) u oferta; Firestore puede usar fotoURL o foto_url.
 */
function fotoUrlOferta(cupon = {}, oferta = {}) {
  const raw =
    cupon.fotoURL ||
    cupon.foto_url ||
    oferta.fotoURL ||
    oferta.foto_url ||
    '';
  return normalizeImageUrl(raw);
}

function drawableSize(d) {
  const w = d.naturalWidth ?? d.width;
  const h = d.naturalHeight ?? d.height;
  return { w, h };
}

/**
 * object-fit: cover en canvas cuadrado; sin clip redondeado (evita artefactos).
 */
function productImageToCoverCanvas(drawable) {
  const side = FOTO_COVER_PX;
  const { w: nw, h: nh } = drawableSize(drawable);
  if (!nw || !nh) throw new Error('Imagen sin dimensiones');
  const canvas = document.createElement('canvas');
  canvas.width = side;
  canvas.height = side;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.fillStyle = FOTO_BG;
  ctx.fillRect(0, 0, side, side);
  const scale = Math.max(side / nw, side / nh);
  const dw = nw * scale;
  const dh = nh * scale;
  const dx = (side - dw) / 2;
  const dy = (side - dh) / 2;
  ctx.drawImage(drawable, 0, 0, nw, nh, dx, dy, dw, dh);
  return canvas;
}

/**
 * URL de descarga de Firebase Storage → path del objeto (p. ej. ofertas%2Ffoto.jpg → ofertas/foto.jpg).
 * fetch() a esa URL suele fallar por CORS; getBlob(ref(storage, path)) usa el SDK y sí obtiene el archivo.
 */
function parseFirebaseStorageDownloadUrl(url) {
  try {
    const u = new URL(url);
    if (!u.hostname.includes('firebasestorage.googleapis.com')) return null;
    const m = u.pathname.match(/\/v0\/b\/[^/]+\/o\/(.+)/);
    if (!m) return null;
    return decodeURIComponent(m[1]);
  } catch {
    return null;
  }
}

async function tryGetBlobViaFirebaseStorage(url) {
  const path = parseFirebaseStorageDownloadUrl(url);
  if (!path) return null;
  try {
    const storageRef = ref(storage, path);
    return await getBlob(storageRef);
  } catch {
    return null;
  }
}

async function blobToCoverCanvas(blob) {
  if (typeof createImageBitmap === 'function') {
    try {
      const bmp = await createImageBitmap(blob);
      try {
        return productImageToCoverCanvas(bmp);
      } finally {
        bmp.close();
      }
    } catch {
      /* seguir con Image */
    }
  }
  const objectUrl = URL.createObjectURL(blob);
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          resolve(productImageToCoverCanvas(img));
        } catch (e) {
          reject(e);
        } finally {
          URL.revokeObjectURL(objectUrl);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('blob no es imagen'));
      };
      img.src = objectUrl;
    });
  } catch (e) {
    URL.revokeObjectURL(objectUrl);
    throw e;
  }
}

const FETCH_IMAGE_MS = 8000;

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    promise
      .then((v) => {
        clearTimeout(t);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(t);
        reject(e);
      });
  });
}

async function fetchImageBlob(url, signal) {
  const res = await fetch(url, {
    mode: 'cors',
    credentials: 'omit',
    cache: 'force-cache',
    signal,
  });
  if (!res.ok) throw new Error('fetch');
  return res.blob();
}

async function fetchImageBlobWithFallback(url) {
  const controller = new AbortController();
  const kill = setTimeout(() => controller.abort(), FETCH_IMAGE_MS);
  try {
    try {
      return await fetchImageBlob(url, controller.signal);
    } catch {
      const c2 = new AbortController();
      const k2 = setTimeout(() => c2.abort(), FETCH_IMAGE_MS);
      try {
        const res = await fetch(url, {
          mode: 'cors',
          credentials: 'omit',
          cache: 'force-cache',
          referrerPolicy: 'no-referrer',
          signal: c2.signal,
        });
        if (!res.ok) throw new Error('fetch');
        return res.blob();
      } finally {
        clearTimeout(k2);
      }
    }
  } finally {
    clearTimeout(kill);
  }
}

/**
 * Devuelve canvas listo para jsPDF.addImage (cuadrado, cover).
 */
async function loadProductPhotoCanvas(url) {
  if (url.startsWith('data:image')) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          resolve(productImageToCoverCanvas(img));
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = () => reject(new Error('data URL inválida'));
      img.src = url;
    });
  }

  const fbBlob = await tryGetBlobViaFirebaseStorage(url);
  if (fbBlob) {
    try {
      return await blobToCoverCanvas(fbBlob);
    } catch {
      /* blob obtenido pero no decodifica; seguir con fetch / Image */
    }
  }

  try {
    const blob = await fetchImageBlobWithFallback(url);
    return await blobToCoverCanvas(blob);
  } catch {
    /* último recurso: Image + crossOrigin */
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const t = setTimeout(() => reject(new Error('timeout')), FETCH_IMAGE_MS);
    img.onload = () => {
      clearTimeout(t);
      try {
        resolve(productImageToCoverCanvas(img));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => {
      clearTimeout(t);
      reject(new Error('No se pudo cargar la imagen'));
    };
    img.src = url;
  });
}

/** Máx. tiempo cargando la foto: si CDN/posters van lentos, el PDF igual se genera (sin foto) y la descarga no se bloquea. */
const PRODUCT_IMAGE_TOTAL_MS = 9000;

async function loadProductPhotoCanvasOrSkip(url) {
  try {
    return await withTimeout(loadProductPhotoCanvas(url), PRODUCT_IMAGE_TOTAL_MS);
  } catch {
    return null;
  }
}

/**
 * Logo PNG (mantiene transparencia / nitidez para el PDF).
 */
function loadLogoPngDataUrl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const maxH = 140;
        let w = img.naturalWidth;
        let h = img.naturalHeight;
        if (h > maxH) {
          w = (w * maxH) / h;
          h = maxH;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve({ dataUrl: canvas.toDataURL('image/png'), w: img.naturalWidth, h: img.naturalHeight });
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error('Logo no disponible'));
    img.src = url;
  });
}

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
 */
export async function descargarPdfCupon(cupon, oferta = {}, opciones = {}) {
  const nombreUsuario = (opciones.nombreUsuario && String(opciones.nombreUsuario).trim()) || '';
  const doc = new jsPDF({ format: 'a5', unit: 'mm' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const maxW = pageW - margin * 2;
  let y = 0;

  const titulo = oferta.titulo || 'Cupón';
  const precio = oferta.precioOferta != null ? `$${Number(oferta.precioOferta).toFixed(2)}` : '';
  const empresaNombre = oferta.empresaNombre || oferta.empresa || '';
  const descripcion = oferta.descripcion || '';
  const fechaCompraStr = formatearFecha(cupon.fechaCompra);
  const fechaLimiteStr = formatearFecha(cupon.fechaLimiteUso);
  const codigo = (cupon.codigo || '').toString();

  const headerH = 26;
  doc.setFillColor(BRAND.r, BRAND.g, BRAND.b);
  doc.rect(0, 0, pageW, headerH, 'F');

  let logoWmm = 0;
  let logoHmm = 11;
  const logoUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/logo_cuponia.png` : '';

  if (logoUrl) {
    try {
      const { dataUrl, w: natW, h: natH } = await loadLogoPngDataUrl(logoUrl);
      const aspect = natW / natH;
      logoWmm = Math.min(logoHmm * aspect, 48);
      logoHmm = logoWmm / aspect;
      const logoY = headerH / 2 - logoHmm / 2 + 1;
      // PNG teal sobre transparente: mismo estilo que los recuadros del cuerpo (tinte claro + borde marca).
      const pad = 2;
      doc.setFillColor(BRAND_TINT.r, BRAND_TINT.g, BRAND_TINT.b);
      doc.roundedRect(margin - pad, logoY - pad, logoWmm + pad * 2, logoHmm + pad * 2, 2.2, 2.2, 'F');
      doc.setDrawColor(BRAND.r, BRAND.g, BRAND.b);
      doc.setLineWidth(0.2);
      doc.roundedRect(margin - pad, logoY - pad, logoWmm + pad * 2, logoHmm + pad * 2, 2.2, 2.2, 'S');
      doc.addImage(dataUrl, 'PNG', margin, logoY, logoWmm, logoHmm, undefined, 'FAST');
    } catch {
      logoWmm = 0;
    }
  }

  // Espacio extra por el padding alrededor del logo (pad = 2 mm a cada lado)
  const textLeft = margin + (logoWmm > 0 ? logoWmm + 2 + 5 : 0);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text('Cuponía', textLeft, 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(230, 248, 250);
  doc.text('Cupón de descuento', textLeft, 19);
  doc.setTextColor(0, 0, 0);

  y = headerH + 10;

  // --- Bloque principal: tarjeta con borde suave ---
  const cardPad = 4;
  let cardTop = y - cardPad;
  let contentY = y;

  const fotoUrl = fotoUrlOferta(cupon, oferta);
  let photoCanvas = null;
  if (fotoUrl) {
    photoCanvas = await loadProductPhotoCanvasOrSkip(fotoUrl);
  }

  const imgColW = 34;
  const textStartX = photoCanvas ? margin + cardPad + imgColW + 4 : margin + cardPad;

  if (photoCanvas) {
    doc.addImage(photoCanvas, 'JPEG', margin + cardPad, contentY, imgColW, imgColW, undefined, 'FAST');
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  const titleMaxW = photoCanvas ? maxW - cardPad * 2 - imgColW - 4 : maxW - cardPad * 2;
  const titleLines = doc.splitTextToSize(titulo, titleMaxW);
  const titleLineH = 5.5;
  let titleY = contentY + 1.5;
  titleLines.forEach((line) => {
    doc.text(line, textStartX, titleY);
    titleY += titleLineH;
  });

  let textY = titleY + 1.5;

  if (empresaNombre) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(SLATE.r, SLATE.g, SLATE.b);
    doc.text('Canjeable en', textStartX, textY);
    textY += 3.8;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(empresaNombre, textStartX, textY);
    textY += 5;
  }

  if (precio) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(BRAND_DARK.r, BRAND_DARK.g, BRAND_DARK.b);
    doc.text(`Precio oferta: ${precio}`, textStartX, textY);
    textY += 5;
  }

  doc.setTextColor(0, 0, 0);
  /* La descripción empieza debajo del bloque más alto: columna de texto o foto (antes se forzaba “Canjeable” al pie de la imagen y quedaba un hueco arriba). */
  y = textY;
  if (photoCanvas) {
    y = Math.max(y, contentY + imgColW + 1.5);
  }

  if (descripcion) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(SLATE.r, SLATE.g, SLATE.b);
    y = wrapText(doc, descripcion, margin + cardPad, y + 1.2, maxW - cardPad * 2, 4.2);
    y += 3;
  }

  const cardBottom = y + cardPad;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.35);
  doc.roundedRect(margin, cardTop, maxW, cardBottom - cardTop, 3, 3, 'S');

  y = cardBottom + 8;

  // --- Fechas en bloque legible ---
  doc.setFillColor(BRAND_TINT.r, BRAND_TINT.g, BRAND_TINT.b);
  doc.roundedRect(margin, y, maxW, 18, 2, 2, 'F');
  doc.setDrawColor(BRAND.r, BRAND.g, BRAND.b);
  doc.setLineWidth(0.2);
  doc.roundedRect(margin, y, maxW, 18, 2, 2, 'S');

  let yInfo = y + 6;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(SLATE_LIGHT.r, SLATE_LIGHT.g, SLATE_LIGHT.b);
  doc.text('COMPRA', margin + 3, yInfo);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(fechaCompraStr || '—', margin + 3, yInfo + 4);

  const col2 = margin + maxW * 0.38;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(SLATE_LIGHT.r, SLATE_LIGHT.g, SLATE_LIGHT.b);
  doc.text('VÁLIDO HASTA', col2, yInfo);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(BRAND_DARK.r, BRAND_DARK.g, BRAND_DARK.b);
  doc.text(fechaLimiteStr || '—', col2, yInfo + 4);

  y = y + 22;
  if (nombreUsuario) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(SLATE.r, SLATE.g, SLATE.b);
    y = wrapText(doc, `Titular: ${nombreUsuario}`, margin, y, maxW, 4.5);
    y += 3;
  }

  // --- Código: bloque destacado tipo ticket ---
  const boxH = 30;
  doc.setFillColor(BRAND_TINT.r, BRAND_TINT.g, BRAND_TINT.b);
  doc.roundedRect(margin, y, maxW, boxH, 2.5, 2.5, 'F');
  doc.setDrawColor(BRAND.r, BRAND.g, BRAND.b);
  doc.setLineWidth(0.55);
  doc.roundedRect(margin, y, maxW, boxH, 2.5, 2.5, 'S');
  doc.setLineWidth(0.15);
  doc.setDrawColor(BRAND_DARK.r, BRAND_DARK.g, BRAND_DARK.b);
  doc.line(margin + 3, y + 9, pageW - margin - 3, y + 9);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(SLATE.r, SLATE.g, SLATE.b);
  doc.text('CÓDIGO PARA EL COMERCIO', margin + 4, y + 6);
  doc.setFontSize(16);
  doc.setFont('courier', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(codigo, pageW / 2, y + 22, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(SLATE_LIGHT.r, SLATE_LIGHT.g, SLATE_LIGHT.b);
  doc.text('Presentá este código en caja al momento del canje.', pageW / 2, y + 27, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  y += boxH + 7;

  doc.setFontSize(7.5);
  doc.setTextColor(SLATE_LIGHT.r, SLATE_LIGHT.g, SLATE_LIGHT.b);
  y = wrapText(
    doc,
    'Este cupón es personal e intransferible. Podés ser solicitado a mostrar identificación que coincida con la compra.',
    margin,
    y,
    maxW,
    3.8
  );
  y += 4;

  const hoyStr = formatearFecha(new Date().toISOString().slice(0, 10));
  doc.setFontSize(6.5);
  doc.setTextColor(180, 190, 200);
  doc.text(`Cuponía · Documento generado el ${hoyStr}`, pageW / 2, pageH - 7, { align: 'center' });

  const tituloCorto = titulo.slice(0, 30).replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') || 'cupon';
  const nombre = `cupon-${(codigo || 'cupon').replace(/\s/g, '-')}-${tituloCorto}.pdf`;
  descargarArchivoPdf(doc, nombre);
}

/**
 * Descarga el PDF de forma compatible con navegadores que bloquean doc.save()
 * tras muchas operaciones async (pierden el gesto del usuario).
 */
function descargarArchivoPdf(doc, filename) {
  try {
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  } catch {
    doc.save(filename);
  }
}
