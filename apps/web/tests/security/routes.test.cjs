const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
function files(dir) { return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]); }
function load(file, mockRequire, extra = {}) {
 const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true,target:ts.ScriptTarget.ES2022}}).outputText;
 const exports={}; vm.runInNewContext(js,{exports,require:mockRequire,process:{env:{},cwd:()=>root},Response,Request,URL,Buffer,console,AbortSignal,...extra},{filename:file}); return exports;
}
const policy=load(path.join(root,'lib/security/policy.ts'),require);
const routes=files(path.join(root,'app/api/admin')).filter(f=>f.endsWith('/route.ts'));
for(const file of routes) {
 test(`${path.relative(root,file)} rejects anonymous and regular users before any side effect`,async()=>{
  for(const principal of [null,{userId:2,role:'user'},...(file.includes('/submissions/')?[]:[{userId:3,role:'moderator'}])]) {
   let effects=0;
   const handlers=load(file,(name)=>{
    if(name==='@/lib/security/admin')return {requireAdmin:r=>policy.guardRequest(r,async()=>principal),requireSubmissionReviewer:r=>policy.guardRequest(r,async()=>principal)};
    if(name==='next/server')return {NextResponse:Response};
    if(name.startsWith('node:'))return require(name);
    return new Proxy({}, {get:()=>()=>{effects++;throw new Error('side effect before authorization');}});
   });
   for(const method of ['GET','POST','PUT','PATCH','DELETE']) if(handlers[method]) {
    const req=new Request('https://example.test/api/admin/test',{method});
    // Invalid/missing request body must not be parsed before auth.
    const result=await handlers[method](req,{params:Promise.resolve({id:'1'})});
    assert.equal(result.status,principal?403:401);
    assert.equal(effects,0);
   }
  }
 });
}
test('authorized admin can still invoke bulk import',async()=>{
 let writes=0;
 const h=load(path.join(root,'app/api/admin/bulk-import-shrines/route.ts'),name=>{
  if(name==='@/lib/security/admin')return {requireAdmin:r=>policy.guardRequest(r,async()=>({userId:1,role:'admin'}))};
  if(name==='next/server')return {NextResponse:Response};
  if(name==='@/lib/shrine-db')return {bulkImport:()=>{writes++;return {inserted:1,updated:0};}};
  throw Error(name);
 });
 const result=await h.POST(new Request('https://example.test/api/admin/bulk-import-shrines',{method:'POST',headers:{'content-type':'application/json',origin:'https://example.test'},body:JSON.stringify({shrines:[{name:'Synthetic',lat:35,lng:140}]})}));
 assert.equal(result.status,200);assert.equal(writes,1);
});

test('submission reviewers retain moderator and configured email access, regular users denied',async()=>{
 for(const principal of [null,{userId:1,role:'user'},{userId:2,role:'moderator'},{user:{email:'reviewer@example.test'},role:'user'}]) {
  const h=load(path.join(root,'lib/security/admin.ts'),name=>{
   if(name==='@/auth')return {auth:async()=>principal};
   if(name==='./policy')return policy;
   throw Error(name);
  },{process:{env:{ADMIN_EMAILS:'reviewer@example.test'}}});
  const result=await h.requireSubmissionReviewer(new Request('https://example.test/api/admin/submissions/1',{method:'POST'}));
  assert.equal(result.response?.status||200,principal===null?401:principal.role==='moderator'||principal.user?200:403);
 }
});

test('push missing or wrong shared secret never loads recipients or sends a notification',async()=>{
 for(const configured of [false,true]) {
  let effects=0;
  const h=load(path.join(root,'app/api/push/send/route.ts'),name=>{
   if(name==='@/lib/security/shared-secret')return load(path.join(root,'lib/security/shared-secret.ts'),require);
   if(name==='next/server')return {NextResponse:Response};
   if(name==='web-push')return {setVapidDetails:()=>{},sendNotification:()=>{effects++;}};
   if(name==='@/lib/shrine-db')return {listPushSubscriptions:()=>{effects++;return [];}};
   throw Error(name);
  },{process:{env:{NEXT_PUBLIC_VAPID_PUBLIC_KEY:'synthetic',VAPID_PRIVATE_KEY:'synthetic',...(configured?{PUSH_SEND_SECRET:'synthetic-secret'}:{})}}});
  const result=await h.POST(new Request('https://example.test/api/push/send',{method:'POST',body:JSON.stringify({secret:'wrong',title:'x',body:'x'})}));
  assert.equal(result.status,configured?401:503);assert.equal(effects,0);
 }
});

test('AI defaults disabled, rejects serverless or missing quota, and never reserves before auth',async()=>{
 for(const scenario of [{session:null,status:401},{session:{userId:1},status:503},{session:{userId:1},env:{AI_FEATURES_ENABLED:'true',AI_USAGE_DB_PATH:'/synthetic',AI_USAGE_STORAGE_MODE:'single-host-durable',OPENAI_API_KEY:'synthetic',VERCEL:'1'},status:503}]) {
  let effects=0;
  const h=load(path.join(root,'lib/security/ai.ts'),name=>{
   if(name==='@/auth')return {auth:async()=>scenario.session};
   if(name==='./policy')return policy;
   if(name==='./ai-quota')return {reserveAiRequest:()=>{effects++;}};
   throw Error(name);
  },{process:{env:scenario.env||{}}});
  const result=await h.requireAiRequest(new Request('https://example.test/api/unmei',{method:'POST'}));
  assert.equal(result.response.status,scenario.status);assert.equal(effects,0);
 }
});

test('Auth session callback preserves numeric application identity and reviewer roles',async()=>{
 const h=load(path.join(root,'auth.ts'),name=>{
  if(name==='next-auth')return ()=>({handlers:{},auth:()=>null,signIn:()=>{},signOut:()=>{}});
  if(name.startsWith('next-auth/providers/'))return ()=>({});
  throw Error(name);
 });
 const result=await h.authConfig.callbacks.session({session:{user:{email:'synthetic@example.test'},expires:'2099-01-01'},token:{userId:42,role:'moderator',providerKey:'synthetic:42'}});
 assert.equal(result.userId,42);assert.equal(typeof result.userId,'number');assert.equal(result.role,'moderator');
});
