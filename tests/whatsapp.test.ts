import assert from "node:assert/strict";
import test from "node:test";
import { normalizeEcuadorMobile } from "@/lib/whatsapp";

test("normalizes Ecuador mobile numbers without preserving the trunk zero", () => {
  assert.equal(normalizeEcuadorMobile("0988831372"), "+593988831372");
  assert.equal(normalizeEcuadorMobile("5930988831372"), "+593988831372");
  assert.equal(normalizeEcuadorMobile("+593 988 831 372"), "+593988831372");
});

test("rejects invalid Ecuador mobile numbers", () => {
  assert.equal(normalizeEcuadorMobile("593123"), null);
  assert.equal(normalizeEcuadorMobile("022345678"), null);
});
