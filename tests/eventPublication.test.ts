import assert from "node:assert/strict";
import test from "node:test";
import { eventPublicationSchema } from "../lib/events/publication";
import { GET, POST } from "../app/api/events/route";
import { existsSync, mkdtempSync, rmdirSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const event = {
  title: "Feria de emprendimientos de Loja",
  date: "2026-11-21",
  time: "10:30",
  venue: "Plaza de San Sebastián",
  organizer: "Colectivo de Loja",
  category: "Ferias y gastronomía",
  price: 12.35,
};

test("publica categorías comunitarias conservando los centavos y la hora", () => {
  const result = eventPublicationSchema.parse(event);
  assert.equal(result.price, 12.35);
  assert.equal(result.time, "10:30");
  assert.equal(result.category, "Ferias y gastronomía");
  assert.equal(result.city, "Loja");
});

test("conserva el precio cero de un evento gratuito y sus preventas", () => {
  const result = eventPublicationSchema.parse({ ...event, price: 0, presales: [{ id: 1, name: "Registro", price: "0" }] });
  assert.equal(result.price, 0);
  assert.equal(result.presales[0].price, 0);
});

test("rechaza eventos sin título o lugar y fechas u horas inválidas", () => {
  for (const invalid of [{ title: " " }, { venue: " " }, { date: "2026-02-30" }, { time: "25:00" }]) {
    assert.equal(eventPublicationSchema.safeParse({ ...event, ...invalid }).success, false);
  }
});

test("rechaza precios negativos o no numéricos en el evento y las preventas", () => {
  for (const price of [-1, "gratis", Infinity]) {
    assert.equal(eventPublicationSchema.safeParse({ ...event, price }).success, false);
    assert.equal(eventPublicationSchema.safeParse({ ...event, presales: [{ id: 1, name: "General", price }] }).success, false);
  }
});

test("el evento publicado queda guardado y aparece en la cartelera pública con sus datos reales", async () => {
  const cwd = process.cwd();
  const temporary = mkdtempSync(path.join(tmpdir(), "4go-publication-"));
  try {
    process.chdir(temporary);
    const response = await POST(new Request("http://localhost:3000/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json", origin: "http://localhost:3000", "user-agent": "4go-publication-test" },
      body: JSON.stringify({ ...event, price: 0, address: "Centro de Loja", organizers: ["Colectivo de Loja"], presales: [{ id: 1, name: "Registro gratuito", price: "0" }] }),
    }));
    assert.equal(response.status, 200);
    const published = await response.json();
    assert.equal(published.success, true);
    assert.ok(existsSync(path.join(temporary, "data/events.json")));

    const catalog = await (await GET()).json();
    const saved = catalog.events.find((item: { id: string }) => item.id === published.event.id);
    assert.ok(saved);
    assert.equal(saved.title, event.title);
    assert.equal(saved.city, "Loja");
    assert.equal(saved.category, event.category);
    assert.equal(saved.price, 0);
    assert.equal(saved.presales[0].price, 0);
    assert.equal(saved.address, "Centro de Loja");
    assert.equal(saved.startsAt, "2026-11-21T10:30:00-05:00");
    assert.deepEqual(saved.organizers, ["Colectivo de Loja"]);
  } finally {
    process.chdir(cwd);
    const metadata = path.join(temporary, "data/events.json");
    if (existsSync(metadata)) unlinkSync(metadata);
    const data = path.join(temporary, "data");
    if (existsSync(data)) rmdirSync(data);
    rmdirSync(temporary);
  }
});
