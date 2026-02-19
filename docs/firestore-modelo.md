# Modelo de datos – Firestore (La Cuponera)

Referencia de las colecciones usadas en Fase 1 y futuras fases.

---

## 1. `rubros`

Categorías de ofertas (ej. Restaurantes, Entretenimiento).

| Campo   | Tipo   | Descripción  |
|---------|--------|--------------|
| nombre  | string | Nombre del rubro |

**Document ID:** generado por Firestore (add con `doc()`) o un slug (ej. `restaurantes`).

---

## 2. `empresas`

Empresas ofertantes registradas por La Cuponera.

| Campo              | Tipo   | Descripción                          |
|--------------------|--------|--------------------------------------|
| nombre             | string | Nombre de la empresa                 |
| codigo             | string | Código único (3 letras + 3 dígitos)  |
| direccion          | string | Dirección                             |
| nombreContacto     | string | Nombre del contacto                  |
| telefono           | string | Teléfono                             |
| correo             | string | Correo (usado para login admin emp.) |
| rubroId            | string | ID del documento en `rubros`         |
| porcentajeComision | number | Porcentaje de comisión por cupón      |

---

## 3. `ofertas`

Promociones registradas por las empresas. En Fase 1 solo se muestran las aprobadas y vigentes.

| Campo             | Tipo   | Descripción                                    |
|-------------------|--------|------------------------------------------------|
| titulo            | string | Título de la oferta                            |
| precioRegular     | number | Precio regular                                 |
| precioOferta      | number | Precio con descuento                           |
| fechaInicio       | string | Fecha inicio (ISO, ej. 2025-02-01)             |
| fechaFin          | string | Fecha fin de venta de la oferta                |
| fechaLimiteUso    | string | Fecha límite para usar el cupón                 |
| cantidadLimite    | number | Límite de cupones (opcional, null = sin límite)|
| descripcion       | string | Descripción de la oferta                       |
| otrosDetalles     | string | Otros detalles                                 |
| estado            | string | "pendiente" \| "aprobada" \| "rechazada" \| "descartada" |
| empresaId         | string | ID del documento en `empresas`                 |
| rubroId           | string | ID del documento en `rubros`                   |
| cuponesVendidos   | number | Cantidad de cupones vendidos (default 0)       |

**Vigente:** estado === "aprobada" y fecha actual entre fechaInicio y fechaFin, y (cantidadLimite es null o cuponesVendidos < cantidadLimite). Esto se valida en la app al consultar.

---

## 4. `clientes`

Perfil del cliente. Un documento por usuario; el ID del documento es el `uid` de Firebase Auth.

| Campo     | Tipo   | Descripción        |
|-----------|--------|--------------------|
| nombres   | string | Nombres            |
| apellidos | string | Apellidos          |
| telefono  | string | Teléfono           |
| correo    | string | Correo (coincide con Auth) |
| direccion | string | Dirección          |
| dui       | string | DUI                |

**Document ID:** `request.auth.uid` (mismo que el usuario en Authentication).

---

## 5. `cupones`

Cupones comprados por clientes. Código único por cupón.

| Campo          | Tipo   | Descripción                                      |
|----------------|--------|--------------------------------------------------|
| codigo         | string | Código único (código empresa + 7 dígitos aleatorios) |
| ofertaId       | string | ID del documento en `ofertas`                    |
| clienteId      | string | uid del cliente (Firebase Auth)                  |
| estado         | string | "disponible" \| "canjeado" \| "vencido"          |
| fechaCompra    | string | Fecha de compra (ISO)                            |
| fechaLimiteUso | string | Fecha límite para canjear (copia de la oferta)   |

**Document ID:** puede ser el mismo `codigo` o un ID autogenerado (el `codigo` debe ser único en todo caso).

---

## Resumen para Fase 1

- **Lectura pública:** `rubros`, `empresas`, y `ofertas` donde `estado === "aprobada"` (filtro por fechas en la app).
- **Cliente autenticado:** leer/escribir su documento en `clientes` (doc id = uid); leer y crear documentos en `cupones` con `clienteId === uid`.

---

## Cómo publicar las reglas en Firebase

1. Abre [Firebase Console](https://console.firebase.google.com/) → proyecto **la-cuponera**.
2. En el menú izquierdo: **Firestore Database** → pestaña **Reglas**.
3. Copia todo el contenido del archivo **`firestore.rules`** de la raíz del proyecto.
4. Pega en el editor de reglas (reemplaza lo que haya).
5. Clic en **Publicar**.

Las reglas quedarán activas de inmediato.
