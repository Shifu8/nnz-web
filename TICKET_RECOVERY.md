# Recuperacion de entradas

El flujo recupera exclusivamente la entrada aprobada asociada al evento definido por `CURRENT_EVENT_ID`. No lista compras, eventos pasados ni eventos futuros.

## Configuracion

1. Define en el entorno del servidor:

```env
CURRENT_EVENT_ID=trap-loud
TICKET_RECOVERY_SECRET=un-secreto-aleatorio-de-al-menos-32-bytes
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
GMAIL_USER=soporte@tu-dominio.com
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
GMAIL_REFRESH_TOKEN=...
```

Como alternativa a Gmail API, se puede usar SMTP de Gmail:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=tu-correo@gmail.com
SMTP_PASS=contrasena-de-aplicacion-de-16-caracteres
SMTP_FROM=DAWGS <tu-correo@gmail.com>
```

No se usa la contrasena normal de Gmail. La cuenta debe tener verificacion en dos pasos y una contrasena de aplicacion.

2. Ejecuta en Supabase:

```text
supabase/migrations/202606120001_ticket_recovery.sql
```

3. Confirma que el evento de `data/events.json` tenga ese `slug` o `id`.

En desarrollo sin Supabase, OTPs y logs usan `data/ticket-recovery.json`. En produccion debe usarse Supabase porque el filesystem de un despliegue serverless no es persistente.

El endpoint `GET /api/notifications/status` muestra el estado de correo, Supabase y WhatsApp sin exponer secretos.

## Endpoints

- `POST /api/tickets/recovery/request`
- `POST /api/tickets/recovery/verify`
- `GET /api/tickets/recovery/qr?token=...`
- `GET /api/tickets/recovery/download?token=...`
- `POST /api/tickets/recovery/resend`

Los endpoints antiguos `/api/access-drop/recovery/*` usan internamente el mismo flujo para mantener compatibilidad.

## Limites

- OTP de 6 digitos, hash HMAC y expiracion de 10 minutos.
- Maximo 5 intentos por OTP.
- Maximo 3 OTP enviados por correo/evento por dia.
- JWT de recuperacion firmado y valido por 15 minutos.
- Maximo 3 reenvios por correo/evento por dia.
- Espera minima de 2 minutos entre reenvios.
- Rate limit adicional por IP y correo.

Los correos, IPs y user agents se guardan como hashes. La solicitud inicial siempre devuelve el mismo mensaje exista o no una compra elegible.

## Pruebas manuales

1. **Compra aprobada del evento activo:** solicita OTP, verifica, revisa QR, descarga PDF y confirma que el serial coincide.
2. **Correo inexistente:** debe responder el mensaje generico y no enviar OTP.
3. **Compra pendiente/rechazada:** mismo mensaje generico y sin OTP.
4. **OTP incorrecto:** falla cuatro veces y queda bloqueado en el quinto intento.
5. **OTP expirado:** despues de 10 minutos debe pedir un codigo nuevo.
6. **Evento anterior:** prepara un ticket con otro `event_id`; no debe recuperarse.
7. **Reenvio:** el cuarto reenvio del dia debe responder `429`; dos solicitudes separadas por menos de 2 minutos tambien.

## Verificacion local

```bash
npm test
npm run lint
npm run build
```
