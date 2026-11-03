import assert from "node:assert/strict";
import test from "node:test";
import { buildGoogleAuthorizationUrl } from "../lib/auth/google";
import { GET } from "../app/api/auth/google/route";

const clientId = "123456789-configured-client.apps.googleusercontent.com";
const options = { clientId, origin: "http://localhost:3000", nonce: "login-nonce" };

test("Google vuelve al origen exacto de localhost sin añadir una barra", () => {
  const url = new URL(buildGoogleAuthorizationUrl(options));
  assert.equal(url.origin, "https://accounts.google.com");
  assert.equal(url.searchParams.get("client_id"), clientId);
  assert.equal(url.searchParams.get("redirect_uri"), "http://localhost:3000");
  assert.equal(url.searchParams.get("nonce"), "login-nonce");
});

test("conserva literalmente una URI de retorno registrada con barra final", () => {
  const redirectUri = "https://4go.example/";
  const url = new URL(buildGoogleAuthorizationUrl({ ...options, origin: "https://4go.example", redirectUri }));
  assert.equal(url.searchParams.get("redirect_uri"), redirectUri);
});

test("rechaza retornos inseguros o con fragmentos y credenciales", () => {
  for (const redirectUri of ["http://4go.example", "https://4go.example/#token", "https://user:password@4go.example"]) {
    assert.throws(() => buildGoogleAuthorizationUrl({ ...options, redirectUri }));
  }
});

test("no sustituye una configuración ausente por otro cliente OAuth", () => {
  for (const clientId of [undefined, "", "   ", "invalid-client"]) {
    assert.throws(() => buildGoogleAuthorizationUrl({ ...options, clientId }));
  }
});

const environmentKeys = ["GOOGLE_CLIENT_ID", "NEXT_PUBLIC_GOOGLE_CLIENT_ID", "GOOGLE_REDIRECT_URI"] as const;

async function withConfiguration(values: Partial<Record<typeof environmentKeys[number], string>>, run: () => Promise<void>) {
  const original = Object.fromEntries(environmentKeys.map((key) => [key, process.env[key]]));
  try {
    for (const key of environmentKeys) {
      if (values[key] === undefined) delete process.env[key];
      else process.env[key] = values[key];
    }
    await run();
  } finally {
    for (const key of environmentKeys) {
      if (original[key] === undefined) delete process.env[key];
      else process.env[key] = original[key];
    }
  }
}

test("el botón obtiene el cliente vigente del servidor sin depender de una compilación anterior", async () => {
  await withConfiguration({ GOOGLE_CLIENT_ID: clientId }, async () => {
    const request = new Request("http://localhost:3000/api/auth/google");
    const firstResponse = GET(request);
    assert.equal(firstResponse.status, 200);
    assert.equal(firstResponse.headers.get("Cache-Control"), "no-store");
    const first = new URL((await firstResponse.json()).url);
    assert.equal(first.searchParams.get("client_id"), clientId);

    const updatedClient = "987654321-updated-client.apps.googleusercontent.com";
    process.env.GOOGLE_CLIENT_ID = updatedClient;
    const second = new URL((await GET(request).json()).url);
    assert.equal(second.searchParams.get("client_id"), updatedClient);
    assert.notEqual(first.searchParams.get("nonce"), second.searchParams.get("nonce"));
  });
});

test("mantiene la configuración existente NEXT_PUBLIC_GOOGLE_CLIENT_ID", async () => {
  await withConfiguration({ NEXT_PUBLIC_GOOGLE_CLIENT_ID: clientId }, async () => {
    const response = GET(new Request("http://localhost:3000/api/auth/google"));
    assert.equal(response.status, 200);
    const url = new URL((await response.json()).url);
    assert.equal(url.searchParams.get("client_id"), clientId);
    assert.equal(url.searchParams.get("redirect_uri"), "http://localhost:3000");
  });
});

test("una configuración ausente devuelve un error recuperable sin redirigir a Google", async () => {
  await withConfiguration({}, async () => {
    const response = GET(new Request("http://localhost:3000/api/auth/google"));
    assert.equal(response.status, 503);
    const result = await response.json();
    assert.equal(typeof result.error, "string");
    assert.equal(result.url, undefined);
  });
});
