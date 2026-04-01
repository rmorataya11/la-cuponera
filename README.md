# Cuponía

Aplicación web para publicar ofertas con cupones: clientes compran cupones, empresas gestionan ofertas y empleados pueden canjearlos. Incluye paneles por rol (administración global, empresa, empleado).

## Stack

- **React** 19 y **Vite** 7
- **React Router** 7
- **Tailwind CSS** 3
- **Firebase**: Authentication, Cloud Firestore, Storage
- **jsPDF**: descarga de cupón en PDF

## Requisitos

- Node.js (recomendado: versión LTS actual)
- Proyecto en [Firebase Console](https://console.firebase.google.com/) con Authentication, Firestore y Storage habilitados según tu configuración

## Configuración local

1. Cloná el repositorio e instalá dependencias:

   ```bash
   npm install
   ```

2. Creá el archivo de entorno a partir del ejemplo y completá los valores de tu app web en Firebase (Proyecto → Configuración → Tus aplicaciones):

   ```bash
   copy .env.example .env
   ```

   En macOS/Linux:

   ```bash
   cp .env.example .env
   ```

   Variables (`VITE_*` son expuestas solo en build/dev de Vite):

   | Variable | Descripción |
   |----------|-------------|
   | `VITE_FIREBASE_API_KEY` | API key |
   | `VITE_FIREBASE_AUTH_DOMAIN` | Dominio de auth (`proyecto.firebaseapp.com`) |
   | `VITE_FIREBASE_PROJECT_ID` | ID del proyecto |
   | `VITE_FIREBASE_STORAGE_BUCKET` | Bucket de Storage |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender ID |
   | `VITE_FIREBASE_APP_ID` | App ID |

3. En Firebase Console, en **Authentication → Configuración → Dominios autorizados**, agregá `localhost` para desarrollo y el dominio de producción cuando despliegues.

## Scripts

| Comando | Uso |
|---------|-----|
| `npm run dev` | Servidor de desarrollo (HMR) |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Vista previa local del build |
| `npm run lint` | ESLint |

## Despliegue

1. Generá el build: `npm run build`.
2. Publicá el contenido de la carpeta **`dist/`** en tu hosting estático (Firebase Hosting, Netlify, Vercel, etc.). Para SPA, configurá **fallback a `index.html`** en rutas que no sean archivos.
3. Volvé a **Authentication → Dominios autorizados** y agregá la URL definitiva del sitio.
4. Anotá abajo la URL pública del proyecto cuando la tengas:

**URL de producción:** _(pendiente — reemplazar al publicar, p. ej. `https://tu-dominio.web.app`)_

---

Desarrollo académico — Desarrollo Web II.
