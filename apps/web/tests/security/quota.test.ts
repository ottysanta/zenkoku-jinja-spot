import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { reserveAiRequest } from "../../lib/security/ai-quota.ts";

test("quota survives fresh connections and enforces daily and parallel limits", () => {
 const dir=mkdtempSync(path.join(tmpdir(),"shrine-security-test-")); const db=path.join(dir,"synthetic.db");
 const now=Date.UTC(2026,9,21,12);
 try {
  const first=reserveAiRequest(db,"u1",now); assert.ok(first);
  assert.equal(reserveAiRequest(db,"u1",now),null); first();
  for(let i=0;i<2;i++){const release=reserveAiRequest(db,"u1",now);assert.ok(release);release();}
  assert.equal(reserveAiRequest(db,"u1",now),null);
  const nextDay=reserveAiRequest(db,"u1",now+86400000); assert.ok(nextDay);nextDay();
  const releases=["u2","u3","u4"].map(u=>reserveAiRequest(db,u,now)); assert.ok(releases.every(Boolean));
  assert.equal(reserveAiRequest(db,"u5",now),null); releases.forEach(r=>r!());
  for(let i=0;i<94;i++){const r=reserveAiRequest(db,`other:${i}`,now);assert.ok(r);r();}
  assert.equal(reserveAiRequest(db,"over-global-limit",now),null);
 } finally {rmSync(dir,{recursive:true,force:true});}
});
test("relative quota store is rejected",()=>assert.throws(()=>reserveAiRequest("relative.db","u")));
