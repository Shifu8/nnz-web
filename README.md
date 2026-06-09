# DAWGS Web

Next.js 16 app with PayPhone checkout, one-use QR validation, staff scanner, admin tickets, and live giveaway.

## Local Setup

1. Copy `.env.example` to `.env.local`.
2. Configure PayPhone (`PAYPHONE_TOKEN`, `PAYPHONE_STORE_ID`).
3. Add Supabase or Firebase Admin credentials.
4. Configure Gmail API for ticket delivery. WhatsApp/Baileys sends confirmation only.
5. Run:

```bash
npm install
npm run dev
```

## Payments (PayPhone)

Flow:

1. User completes buyer form and clicks pay.
2. Backend calls PayPhone `Prepare` and redirects to PayPhone checkout (card or PayPhone balance).
3. PayPhone redirects to `/checkout/result?id=...&clientTransactionId=...`.
4. Backend calls PayPhone `Confirm` within 5 minutes (required by PayPhone).
5. On approval: ticket + unique QR saved, Gmail API sends the PDF; WhatsApp/Baileys sends a short confirmation.

PayPhone Developer app type must be **WEB** with:

- **Dominio Web**: your site domain (or `http://localhost:3000` for local tests)
- **URL de Respuesta**: `https://your-domain.com/checkout/result`

## QR Testing

1. Buy a ticket through PayPhone (test env approves in sandbox).
2. Open staff mode, log in, scan the QR.
3. First scan: `ACCESO PERMITIDO`.
4. Scan again: `QR YA USADO`.

## Security Testing

```bash
npm run test
npm run build
```

## Supabase

Run `supabase/schema.sql` in the Supabase SQL editor.

## Production (Vercel)

Required env:

- `NEXT_PUBLIC_SITE_URL`
- `PAYPHONE_ENV=production`
- `PAYPHONE_TOKEN`
- `PAYPHONE_STORE_ID`
- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (or Firebase Admin)
- `DATA_ENCRYPTION_KEY`, `JWT_SECRET`, `QR_HASH_SECRET`
- `STAFF_PASSWORD_HASH_B64`, `ADMIN_PASSWORD_HASH_B64` (generar con `node scripts/gen-password-hashes.mjs`)
- `GMAIL_USER=soporte.dawgs@gmail.com`, `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`
- `GMAIL_DAILY_LIMIT=100`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY_VISIBLE`, `TURNSTILE_SECRET_KEY_VISIBLE`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY_INVISIBLE`, `TURNSTILE_SECRET_KEY_INVISIBLE`
- `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`
