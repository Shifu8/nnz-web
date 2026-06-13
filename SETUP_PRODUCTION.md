# DAWGS — Guía de producción

Sistema completo: PayPhone, Supabase, tickets QR, giveaway realtime, staff scanner, admin, Gmail API y WhatsApp/Baileys.

---

## 1. Dependencias

```bash
npm install
```

Ya incluidas en `package.json`: `@supabase/supabase-js`, `bcryptjs`, `jose`, `qrcode`, `nodemailer`, `gsap`, `framer-motion`, etc.

---

## 2. Variables `.env.local`

Copia `.env.example`:

```bash
cp .env.example .env.local
```

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_SITE_URL` | URL pública (Vercel o dominio) |
| `PAYPHONE_DEMO_MODE` | `true` = pagos simulados; `false` = PayPhone real |
| `PAYPHONE_TOKEN` | Bearer token Payphone Developer |
| `PAYPHONE_STORE_ID` | Store ID de tu app WEB |
| `SUPABASE_URL` | Proyecto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo servidor (nunca en cliente) |
| `GMAIL_*` | Gmail API (email + PDF de entrada) |
| `TURNSTILE_*` | Cloudflare Turnstile visible/invisible |
| `OPENAI_API_KEY` | Opcional; añade análisis visual al OCR y perfiles locales |
| `OPENAI_RECEIPT_MODEL` | Modelo visual complementario; por defecto `gpt-5.5` |
| `RECEIPT_AI_MIN_CONFIDENCE` | Umbral del análisis visual; recomendado `0.72` |
| `WHATSAPP_*` | Meta WhatsApp Cloud API |
| `STAFF_PASSWORD_HASH_B64` | Hash bcrypt staff |
| `ADMIN_PASSWORD_HASH_B64` | Hash bcrypt admin |
| `GIVEAWAY_OPEN_HOUR` | 19 = 7:30 PM Ecuador |
| `GIVEAWAY_OPEN_MINUTE` | 30 |
| `GIVEAWAY_DURATION_MINUTES` | 10 |

### Referencias válidas de comprobantes

Coloca ejemplos curados JPG/JPEG/PNG en `public/uploads/example-transfers/`.
El analizador usa hasta tres imágenes recientes como referencia visual, pero no
exige que el banco o diseño coincidan exactamente. También incluye perfiles para
Banco de Loja, Banco Pichincha/Deuna y depósitos físicos. El endpoint para agregar
ejemplos requiere una sesión de administrador y token CSRF.

---

## 3. Supabase — SQL

En **SQL Editor** de Supabase, ejecuta todo el archivo:

```
supabase/schema.sql
```

Tablas principales:

- `tickets` — compras PayPhone
- `party_passes` — QR de un solo uso
- `access_drops` — participantes
- `ticket_resends` — logs de reenvío
- `giveaway_entries` — sorteo en vivo
- `admin_logs` — acciones admin

---

## 4. Contraseñas Staff / Admin

Generar hashes:

```bash
node scripts/gen-password-hashes.mjs
```

**Contraseñas por defecto del script** (cámbialas en producción):

| Rol | Contraseña |
|-----|------------|
| **Staff** (scanner) | `D@wgs-St4ff#9Kp2!Qm7&Vx4` |
| **Admin** (tickets) | `D@wgs-@dm1n#R7n!Wq3$Zp8&Kf5` |

Pega los valores `*_HASH_B64` en `.env.local`.

**Acceso staff:** mantén pulsado el logo **DAWGS** 3 segundos → menú oculto.

---

## 5. PayPhone — paso a paso

### 5.1 Crear cuenta

1. Regístrate en [Payphone Developer](https://pay.payphonetodoesposible.com) (Ecuador).
2. Crea una aplicación tipo **WEB**.
3. Obtén **Token** y **Store ID**.

### 5.2 Sandbox / testing

```env
PAYPHONE_ENV=test
PAYPHONE_DEMO_MODE=false
PAYPHONE_TOKEN=tu_token_sandbox
PAYPHONE_STORE_ID=tu_store_id
```

En Developer configura:

- **Dominio web:** `localhost:3000` (dev) o tu dominio
- **URL respuesta:** `https://tu-dominio.com/checkout/result`
- **URL cancelación:** `https://tu-dominio.com/checkout/result?cancelled=1`
- **Webhook (opcional):** `https://tu-dominio.com/api/payphone/webhook`

### 5.3 Modo demo (sin PayPhone aún)

```env
PAYPHONE_DEMO_MODE=true
NEXT_PUBLIC_PAYPHONE_DEMO_MODE=true
```

Flujo: formulario → `/api/payphone/prepare` → redirect demo → `/api/payphone/demo-complete` → ticket por Gmail + confirmacion WhatsApp.

### 5.4 Producción

```env
PAYPHONE_ENV=production
PAYPHONE_DEMO_MODE=false
```

1. Conecta cuenta bancaria en Payphone.
2. Activa app en producción.
3. Usa token y store ID de producción.
4. Verifica webhook y URLs HTTPS.

---

## 6. Gmail API (email + entradas PDF)

Canal principal: `soporte.dawgs@gmail.com`. El sistema cuenta envios diarios exitosos en `data/gmail-usage.json`. WhatsApp/Baileys solo confirma la compra y dirige al usuario a Gmail o Recuperar entrada.

Variables:

```env
GMAIL_USER=soporte.dawgs@gmail.com
GMAIL_FROM=DAWGS <soporte.dawgs@gmail.com>
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
GMAIL_REFRESH_TOKEN=...
GMAIL_DAILY_LIMIT=100
```

Sin credenciales en desarrollo: Gmail se omite. En produccion configura Gmail para enviar el PDF y usa WhatsApp solo como confirmacion.

---

## 7. Cloudflare Turnstile

Turnstile protege compra, carga de comprobante, recuperacion por Gmail y login admin.

1. Entra a Cloudflare Dashboard -> Turnstile.
2. Crea un widget `DAWGS Visible` en modo **Managed** para compra/admin.
3. Crea un widget `DAWGS Invisible` en modo **Invisible** para recuperacion por Gmail.
4. Agrega tus hostnames: dominio real, preview de Vercel si aplica, y `localhost` para pruebas.
5. Copia Sitekey y Secret de cada widget en el entorno:

```env
NEXT_PUBLIC_TURNSTILE_SITE_KEY_VISIBLE=...
TURNSTILE_SECRET_KEY_VISIBLE=...
NEXT_PUBLIC_TURNSTILE_SITE_KEY_INVISIBLE=...
TURNSTILE_SECRET_KEY_INVISIBLE=...
```

En desarrollo sin claves, el backend no bloquea para que puedas trabajar. En produccion las claves son obligatorias.

---

## 8. WhatsApp (Meta Cloud API)

1. Ve a [Meta for Developers](https://developers.facebook.com) y crea una app.
2. Añade el producto **WhatsApp**.
3. Configura el **Business Account** y obtén un **Phone Number ID**.
4. Genera un **Access Token** permanente (Settings → Permanent Token).
5. (Opcional) Configura webhook para recibir mensajes entrantes — en este proyecto solo se envían mensajes salientes automáticos.

```env
WHATSAPP_ACCESS_TOKEN=EAAT...
WHATSAPP_PHONE_NUMBER_ID=123456789
WHATSAPP_VERIFY_TOKEN=tu_token_para_webhook
```

Los mensajes se envían al formato `+593XXXXXXXXX`.  
WhatsApp/Baileys no adjunta entradas: solo confirma la compra y pide revisar Gmail.

---

## 8. Endpoints API

| Método | Ruta | Uso |
|--------|------|-----|
| GET | `/api/payphone/config` | Estado gateway + demo |
| POST | `/api/payphone/prepare` | Iniciar compra |
| POST | `/api/payphone/confirm` | Confirmar tras PayPhone |
| POST | `/api/payphone/demo-complete` | Solo si `PAYPHONE_DEMO_MODE=true` |
| POST | `/api/payphone/webhook` | Webhook PayPhone |
| POST | `/api/access-drop/resend` | Reenviar ticket |
| GET | `/api/tickets/[serial]/pass.png` | Imagen QR firmada |
| POST | `/api/passes/validate` | Staff scanner |
| POST | `/api/admin/generate-ticket` | Ticket manual admin |
| POST | `/api/staff/login` | Login staff/admin |
| GET | `/api/giveaway/status` | Fases countdown/open/drawing |
| POST | `/api/giveaway/register` | Registro sorteo |
| GET | `/api/giveaway/participants` | Lista en vivo |

---

## 9. Deploy (Vercel)

```bash
npm run build
```

1. Conecta repo en Vercel.
2. Añade todas las variables de `.env.example`.
3. `NEXT_PUBLIC_SITE_URL=https://tu-dominio.vercel.app`
4. Ejecuta `supabase/schema.sql` en tu proyecto.
5. `PAYPHONE_DEMO_MODE=false` cuando PayPhone esté listo.

---

## 10. Archivos creados / editados

### Crear

- `lib/persistence/clientState.ts`
- `lib/db/giveawayStore.ts`
- `lib/db/adminLogs.ts`
- `app/api/payphone/demo-complete/route.ts`
- `app/api/payphone/webhook/route.ts`
- `SETUP_PRODUCTION.md`

### Editar

- `supabase/schema.sql` — `giveaway_entries`, `admin_logs`
- `lib/payments/payphoneEnv.ts` — demo mode
- `app/api/payphone/*` — prepare, config, confirm
- `app/api/giveaway/register`, `participants`
- `frontend/features/access-drop/AccessDrop.tsx`
- `frontend/features/giveaway/LiveGiveaway.tsx`
- `app/checkout/result/page.tsx`
- `frontend/components/AIChatbot.tsx`
- `frontend/components/IntroCinematic.tsx`
- `.env.example`

### Eliminar

- `app/api/kushki/*`
- `lib/payments/kushki*`

---

## 11. Persistencia anti-reload

El cliente guarda en `localStorage` / `sessionStorage`:

- Ticket comprado (`dawgs_ticket_pass`)
- Token de transacción
- Borrador del formulario de compra
- Estado del giveaway
- Modal activo (access/giveaway)

Al recargar, el usuario continúa donde estaba.

---

## 12. Flujo de compra

1. Usuario completa datos → **Comprar ticket**
2. `POST /api/payphone/prepare` → redirect PayPhone (o demo)
3. Pago aprobado → `POST /api/payphone/confirm`
4. `activateTicket` → QR único en Supabase
5. Gmail API + confirmacion por WhatsApp/Baileys
6. Pantalla: *"Tu acceso fue enviado correctamente"*

---

## 13. Desarrollo local

```bash
cp .env.example .env.local
# PAYPHONE_DEMO_MODE=true + SUPABASE_URL + keys

npm run dev
```

Abre `http://localhost:3000`.
