import test from "node:test";
import assert from "node:assert/strict";
import { guardRequest } from "../../lib/security/policy.ts";
import { matchesSecret } from "../../lib/security/shared-secret.ts";
import { readLimitedBody } from "../../lib/security/body.ts";

const req = () => new Request("https://example.test/api/admin/update", { method: "POST" });
test("anonymous admin denied before side effects", async () => {
  const r = await guardRequest(req(), async () => null);
  assert.ok("response" in r); assert.equal(r.response.status, 401);
});
test("ordinary user and moderator cannot operate administration", async () => {
  for (const role of ["user", "moderator", undefined]) {
    const r = await guardRequest(req(), async () => ({ userId: 1, role }));
    assert.ok("response" in r); assert.equal(r.response.status, 403);
  }
});
test("authenticated admin accepted; role alone is not identity", async () => {
  assert.ok(!("response" in await guardRequest(req(), async () => ({ userId: 1, role: "admin" }))));
  const r = await guardRequest(req(), async () => ({ role: "admin" }));
  assert.ok("response" in r); assert.equal(r.response.status, 401);
});
test("auth outage fails closed", async () => {
  const r = await guardRequest(req(), async () => { throw Error("unavailable"); });
  assert.ok("response" in r); assert.equal(r.response.status, 503);
});
test("cross origin mutation fails before even reading session", async () => {
  let calls = 0;
  const r = await guardRequest(new Request("https://example.test/api/admin", {method:"POST",headers:{origin:"https://evil.test"}}), async () => {calls++;return { userId: 1,role:"admin" };});
  assert.ok("response" in r); assert.equal(r.response.status,403); assert.equal(calls,0);
});
test("paid user guard allows authenticated users, never anonymous", async () => {
  assert.ok(!("response" in await guardRequest(req(), async () => ({providerKey:"google:1",role:"user"}), false)));
  assert.ok("response" in await guardRequest(req(), async () => null, false));
});
test("push secret is fail closed for all missing and malformed cases", () => {
  for (const actual of [undefined,null,{},[],1,"","bad"]) assert.equal(matchesSecret(actual,"test-only"),false);
  assert.equal(matchesSecret("test-only",undefined),false);
  assert.equal(matchesSecret("test-only",""),false);
  assert.equal(matchesSecret("test-only","test-only"),true);
});
test("body limit counts bytes despite dishonest Content-Length", async () => {
  await assert.rejects(readLimitedBody(new Request("https://example.test",{method:"POST",headers:{"content-length":"1"},body:"large payload"}),3));
  const r=await readLimitedBody(new Request("https://example.test",{method:"POST",headers:{"content-type":"application/json"},body:'{"ok":1}'}),20);
  assert.deepEqual(await r.json(),{ok:1});
});
