# Payment Gateway & Staff Access Revamp

## Goal Description

- Fully functional Kushki integration for credit/debit card payments, removing the placeholder "Pasarela de pagos temporalmente no disponible".
- Fix errors in the staff area (admin panel / scanner) so admins can access it without crashes.
- Remove the legacy "Recuperar ticket" UI option.
- Implement the new ticket flow: validate payment → generate ticket → send ticket via email/SMS.
- Ensure the UI follows the project's premium design language (glassmorphism, vibrant gradients, micro‑animations).

## User Review Required

> [!IMPORTANT]
> This plan modifies core components (`AccessDrop.tsx`, API routes, env vars) and introduces new backend endpoints. Please review the proposed file changes before we proceed.

## Open Questions

> [!QUESTION]
> 1. Do you have separate Kushki credentials for sandbox and production? If so, provide the variable names (e.g., `KUSHKI_PUBLIC_KEY_PROD`).
> 2. Should staff authentication use JWT tokens or keep the existing password‑based login?
> 3. Which service should be used for ticket delivery (SendGrid, Twilio, etc.)?
> 4. Confirm that the "Recuperar ticket" button can be removed entirely from all pages.

## Proposed Changes

---
### Frontend

#### [MODIFY] [AccessDrop.tsx](file:///c:/Users/Brandon/OneDrive/Escritorio/dawgs-web/frontend/features/access-drop/AccessDrop.tsx)
- Refactor `gatewayAvailable` handling: fetch real status from `/api/kushki/status` on mount.
- Replace placeholder UI with active payment form when gateway is available.
- Add loading spinner while waiting for status.
- Clean up stray parentheses / JSX mismatches that caused the build error.
- Remove any import of the now‑deleted `RecoverTicketButton` component.

#### [MODIFY] [AdminPanelModal.tsx](file:///c:/Users/Brandon/OneDrive/Escritorio/dawgs-web/frontend/features/staff/AdminPanelModal.tsx)
- Update login call to `/api/staff/login` and handle JSON `{ success, token }`.
- Add error UI for network/auth failures.
- Ensure CORS headers are set on the backend.

#### [MODIFY] [StaffModal.tsx](file:///c:/Users/Brandon/OneDrive/Escritorio/dawgs-web/frontend/features/staff/StaffModal.tsx)
- Same adjustments as AdminPanelModal for login flow.
- After successful login, redirect to `/staff/scanner` using `router.push`.

#### [DELETE] [RecoverTicketButton.tsx] (if exists)
- Delete component and all its imports/usages.

#### [ADD] [NewTicketFlow.tsx](file:///c:/Users/Brandon/OneDrive/Escritorio/dawgs-web/frontend/features/ticket/NewTicketFlow.tsx)
- Component shown after successful payment; calls `/api/tickets/create` and displays ticket info.
- Includes resend email/phone UI (already present in `AccessDrop`).

---
### Backend (Next.js API routes)

#### [MODIFY] [/api/kushki/config.ts]
- Return `{ gatewayAvailable: true, publicKey: process.env.KUSHKI_PUBLIC_KEY, apiBase: process.env.KUSHKI_API_BASE }`.
- Add proper error handling and CORS.

#### [ADD] [/api/kushki/status.ts]
- Simple health‑check endpoint that validates the SDK config and returns availability.

#### [MODIFY] [/api/kushki/initiate.ts]
- Accept `{ token, …userData }`, verify token with Kushki SDK, create a transaction record (mock DB JSON), and respond with `{ transactionId, status: "PENDING" }`.
- On success, trigger webhook simulation (`/api/kushki/webhook`).

#### [ADD] [/api/kushki/webhook.ts]
- Receives webhook payload, marks transaction as APPROVED, creates a ticket entry, and sends email/SMS via configured service.

#### [MODIFY] [/api/staff/login.ts]
- Add CORS headers.
- Validate credentials, issue a JWT (using `jsonwebtoken`).
- Return `{ success: true, token }`.

#### [ADD] [/api/tickets/create.ts]
- Validate payment status, generate a unique ticket ID, store in mock DB, and send email/SMS.
- Return ticket data for frontend display.

---
### Environment

#### [MODIFY] [.env.local]
- `KUSHKI_PUBLIC_KEY=...`
- `KUSHKI_PRIVATE_KEY=...`
- `KUSHKI_API_BASE=https://api-uat.kushkipagos.com`
- `JWT_SECRET=...`
- `EMAIL_SERVICE_API_KEY=...` (if using SendGrid)
- `SMS_SERVICE_API_KEY=...` (if using Twilio)

---
## Verification Plan

### Automated Tests
- Run existing Jest tests plus new tests for `/api/kushki/status`, `/api/staff/login`, and `/api/tickets/create`.
- Use Playwright to simulate a full purchase flow and verify the ticket UI appears.

### Manual Verification
- `npm run dev` → open homepage, click "COMPRAR TICKET", complete payment with sandbox card (4242 4242 4242 4242).
- Confirm the success UI, ticket details, and email/SMS receipt.
- Open staff modal, login with admin credentials, ensure scanner page loads without console errors.
- Verify the "Recuperar ticket" button is no longer in the UI.

---
