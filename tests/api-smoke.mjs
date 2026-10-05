import assert from "node:assert/strict";

// These requests must be rejected before any database insert or storage upload.
const base = process.argv[2] ?? "http://localhost:3011";
const cases = [
  ["/api/vendors", "{}", {}, 401],
  ["/api/packages", "{}", {}, 401],
  ["/api/vendors", "{}", { origin: "https://other.example" }, 403],
  ["/api/match/vendors", "{", {}, 400],
  ["/api/match/vendors", JSON.stringify([{ serviceId: 1, budget: -1, location: [1], criteria: {} }]), {}, 400],
];

for (const [path, body, headers, expected] of cases) {
  const response = await fetch(`${base}${path}`, {
    method: "POST", headers: { "content-type": "application/json", ...headers }, body,
  });
  assert.equal(response.status, expected, `${path} must return ${expected}`);
  const payload = await response.json();
  assert.equal(typeof payload.error, "string");
  console.log(`${path}: ${expected} verified`);
}
