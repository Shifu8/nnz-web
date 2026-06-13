import assert from "node:assert/strict";
import test from "node:test";
import {
  countRecoveryLogs,
  createRecoveryOtp,
  getLastRecoveryLogAt,
  recordRecoveryLog,
  recoveryEmailHash,
  resetRecoveryStoreForTests,
  verifyRecoveryOtp,
} from "@/lib/access-drop/recoveryStore";
import { getActiveTicketEvent } from "@/lib/tickets/activeEvent";
import { createRecoveryToken, verifyRecoveryToken } from "@/lib/tickets/recoveryToken";

Object.assign(process.env, { NODE_ENV: "test" });
process.env.TICKET_RECOVERY_SECRET ||= "test-ticket-recovery-secret-with-32-bytes";
process.env.QR_HASH_SECRET ||= "test-qr-secret";
process.env.CURRENT_EVENT_ID = "trap-loud";
delete process.env.SUPABASE_URL;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;

function resetStore() {
  resetRecoveryStoreForTests();
}

test("recovery OTP is single-use and returns its ticket reference", async () => {
  resetStore();
  const event = getActiveTicketEvent();
  const otp = await createRecoveryOtp({
    email: "buyer@example.com",
    eventId: event.id,
    ticketId: "receipt-1",
    ticketSource: "receipt",
  });

  const verified = await verifyRecoveryOtp("BUYER@example.com", event.id, otp.code);
  assert.deepEqual(verified, {
    ok: true,
    ticketId: "receipt-1",
    ticketSource: "receipt",
  });

  const replay = await verifyRecoveryOtp("buyer@example.com", event.id, otp.code);
  assert.equal(replay.ok, false);
  if (!replay.ok) assert.equal(replay.reason, "not-found");
});

test("recovery OTP locks on the fifth incorrect attempt", async () => {
  resetStore();
  const event = getActiveTicketEvent();
  await createRecoveryOtp({
    email: "locked@example.com",
    eventId: event.id,
    ticketId: "receipt-2",
    ticketSource: "receipt",
  });

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const result = await verifyRecoveryOtp("locked@example.com", event.id, "000000");
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "invalid");
  }

  const locked = await verifyRecoveryOtp("locked@example.com", event.id, "000000");
  assert.equal(locked.ok, false);
  if (!locked.ok) assert.equal(locked.reason, "locked");
});

test("recovery logs support resend and daily-limit checks", async () => {
  resetStore();
  const event = getActiveTicketEvent();
  const emailHash = recoveryEmailHash("logs@example.com");

  await recordRecoveryLog({
    emailHash,
    eventId: event.id,
    action: "RECOVERY_RESEND",
    ipHash: "ip",
    userAgentHash: "ua",
  });

  assert.equal(await countRecoveryLogs(emailHash, event.id, "RECOVERY_RESEND"), 1);
  assert.ok(await getLastRecoveryLogAt(emailHash, event.id, "RECOVERY_RESEND"));
});

test("recovery JWT is scoped to the active event", async () => {
  const event = getActiveTicketEvent();
  const token = await createRecoveryToken(
    {
      id: "receipt-3",
      source: "receipt",
      eventId: event.id,
      email: "jwt@example.com",
      firstName: "TEST",
      lastName: "BUYER",
      serialNumber: "DAWGS-1234-ABCDEF",
      qrPayload: "{}",
      quantity: 1,
      status: "APPROVED",
    },
    event,
    recoveryEmailHash("jwt@example.com"),
  );

  const payload = await verifyRecoveryToken(token, event);
  assert.equal(payload.ticketId, "receipt-3");
  assert.equal(payload.ticketSource, "receipt");

  await assert.rejects(() =>
    verifyRecoveryToken(token, {
      ...event,
      id: "another-event",
      aliases: ["another-event"],
    }),
  );
});
