import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { createClient } from '@supabase/supabase-js';
assert.equal(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname, 'mbrdrexnhxihqlyqukmx.supabase.co');
const require = createRequire(import.meta.url);
function stub(path, exports) { const id=require.resolve(path); require.cache[id]={id,filename:id,loaded:true,exports}; }
stub('server-only', {});
let calls=0, fixtures=[];
stub('../src/db/queries/vendors.ts', {findVendorsByPreferences: async preferences => { calls++; if(preferences[0].budget===13) throw new Error('matching failure'); return fixtures; }});
const service=await import('../src/services/others/manualSearchService.ts');
const {db}=await import('../src/db/index.ts');
const {sql}=await import('drizzle-orm');
const {vendorsTable,packagesTable}=await import('../src/db/schema.ts');
const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PRIVATE_SUPABASE_SERVICE_KEY,{auth:{persistSession:false}});
const run=randomUUID(), users=[], vendorIds=[];
const preferences=[{serviceId:1,budget:10000,location:[1],criteria:{}}];
async function account() { const {data,error}=await admin.auth.admin.createUser({email:`lifecycle-${run}-${users.length}@example.test`,email_confirm:true,app_metadata:{lifecycle_test:run}}); assert.ifError(error);users.push(data.user.id);return {userId:data.user.id,role:'user',isPaid:false,paidUntil:null,canViewVendorIdentity:false}; }
try {
 const free=await account(), other=await account();
 const paid={...free,isPaid:true,canViewVendorIdentity:true};
 const [catalogue]=await db.execute(sql`select id from public."servicesTable" order by id limit 1`);
 const vendors=await db.insert(vendorsTable).values(Array.from({length:23},(_,i)=>({vendorName:`TEST ${run} ${i}`,serviceId:catalogue.id,locationId:[1],imagePaths:[],status:'approved'}))).returning();
 vendorIds.push(...vendors.map(v=>v.id));
 const packages=await db.insert(packagesTable).values(vendors.map((v,i)=>({vendorId:v.id,packageName:`TEST ${run} ${i}`,price:100+i,filters:{}}))).returning();
 fixtures=vendors.map(v=>({vendor:{...v,imageUrls:[]},packages:packages.filter(p=>p.vendorId===v.id)}));
 await assert.rejects(service.runManualSearch(free,randomUUID(),[{...preferences[0],budget:13}]),/matching failure/);
 assert.equal((await service.getManualSearchUsage(free)).used,0);
 const id=randomUUID();
 // 23 matches are cut to the best 10: a top pick and 9 in the list. Free: the top pick locked, the first of the
 // list unlocked (in full), the other 8 counted only.
 const results=await Promise.all(Array.from({length:3},()=>service.runManualSearch(free,id,preferences)));
 assert.equal(results[0].topMatches.length,1);assert.equal(results[0].matches.length,1);assert.equal(results[0].lockedCount,8);
 assert.equal(results[0].total,1);assert.equal(results[0].pageCount,1);
 assert.ok(results.every(r=>r.usage.used===1&&r.usage.remaining===0));
 assert.ok(results[0].topMatches.every(m=>m.identityLocked&&!('packages' in m)&&!('vendorName' in m.vendor)));
 assert.ok(results[0].matches.every(m=>!m.identityLocked&&m.vendor.id===vendors[1].id&&m.packages.length));
 const [unlockedRow]=await db.execute(sql`select count(*)::integer as count from public.unlocked_vendors where user_id=${free.userId} and vendor_id=${vendors[1].id}`);
 assert.equal(unlockedRow.count,1);
 const count=calls;
 const saved=await db.execute(sql`select matches,created_at,expires_at from public.manual_search_snapshots where user_id=${free.userId} and search_id=${id}`);
 assert.equal(new Date(saved[0].expires_at)-new Date(saved[0].created_at),86400000);
 assert.equal(saved[0].matches.length,10);
 assert.deepEqual(Object.keys(saved[0].matches[0]).sort(),['isTopPick','matchedPackageIds','position','serviceId','vendorId'].sort());
 const again=await service.readManualSearch(free,id);
 assert.equal(again.usage.used,1);assert.equal(calls,count);
 // Plus sees the same search in full: 9 in the list on one page of 10.
 const full=await service.readManualSearch(paid,id);
 assert.equal(full.matches.length,9);assert.equal(full.total,9);assert.equal(full.lockedCount,0);assert.equal(full.pageCount,1);
 assert.ok([...full.matches,...full.topMatches].every(m=>!m.identityLocked));
 await assert.rejects(service.readManualSearch(free,id,2),e=>e.status===404);
 await assert.rejects(service.readManualSearch(other,id),e=>e.status===410);
 // Vendor details: the top pick and other locked vendors are refused to free; the unlocked one is given.
 await assert.rejects(service.readManualSearchVendor(free,id,vendors[0].id),e=>e.status===403);
 await assert.rejects(service.readManualSearchVendor(free,id,vendors[2].id),e=>e.status===403);
 assert.ok((await service.readManualSearchVendor(free,id,vendors[1].id)).packages.length);
 await assert.rejects(service.runManualSearch(free,id,[{...preferences[0],budget:99}]),e=>e.status===409);
 // One free search, ever.
 await assert.rejects(service.runManualSearch(free,randomUUID(),preferences),e=>e.status===403);
 await db.execute(sql`update public."vendorsTable" set "vendorName"=${`UPDATED ${run}`} where id=${vendors[0].id}`);
 await db.execute(sql`update public."packagesTable" set price=777 where id=${packages[0].id}`);
 const fresh=await service.readManualSearchVendor(paid,id,vendors[0].id);
 assert.equal(fresh.vendor.vendorName,`UPDATED ${run}`);assert.equal(fresh.packages[0].price,777);
 const freshPage=await service.readManualSearch(free,id);
 assert.equal(freshPage.topMatches[0].cheapestPrice,777);assert.equal(calls,count);
 // A vendor that loses its packages drops out of the list.
 await db.execute(sql`delete from public."packagesTable" where "vendorId"=${vendors[9].id}`);
 assert.equal((await service.readManualSearch(paid,id)).total,8);
 await assert.rejects(service.readManualSearchVendor(paid,id,vendors[9].id),e=>e.status===404);
 await db.execute(sql`update public.manual_search_snapshots set expires_at=now()-interval '1 second' where user_id=${free.userId} and search_id=${id}`);
 await assert.rejects(service.readManualSearch(free,id),e=>e.status===410);
 await assert.rejects(service.runManualSearch(free,id,preferences),e=>e.status===410);
 assert.equal((await service.getManualSearchUsage(free)).used,1);assert.equal(calls,count);
 await db.execute(sql`delete from public.manual_search_snapshots where user_id=${free.userId} and search_id=${id}`);
 await assert.rejects(service.readManualSearch(free,id),e=>e.status===410);
 assert.equal(calls,count);
 // The unlocked vendor stays unlocked after the search is gone (for the shortlist and budget).
 const [kept]=await db.execute(sql`select count(*)::integer as count from public.unlocked_vendors where user_id=${free.userId}`);
 assert.equal(kept.count,1);
 for(let i=0;i<10;i++) await service.throttleSearch(other.userId,'create');
 await assert.rejects(service.throttleSearch(other.userId,'create'),e=>e.status===429);
 await db.execute(sql`update public.search_request_limits set window_start=now()-interval '2 minutes' where user_id=${other.userId}`);
 await service.throttleSearch(other.userId,'create');
 for (const table of ['manual_search_snapshots','search_request_limits','free_searches','unlocked_vendors']) {
  const [grants]=await db.execute(sql`select has_table_privilege('anon',${`public.${table}`},'SELECT') as anon, has_table_privilege('authenticated',${`public.${table}`},'SELECT') as authenticated`);
  assert.equal(grants.anon,false);assert.equal(grants.authenticated,false);
 }
 console.log('PASS lifecycle: rollback after matching failure, concurrent idempotency, 10-per-service cap, compact snapshots, exact 24h expiry, free view (locked top pick, one unlocked vendor, rest counted), Plus full view, one free search, read without matching/quota, isolation, detail guards, live names/prices, removed packages, expired/missing reads, unlocked vendor kept after expiry, throttle/reset, browser grants.');
} finally {
 if(vendorIds.length) {
  await db.execute(sql`delete from public."packagesTable" where "vendorId" in (${sql.join(vendorIds.map(id=>sql`${id}`),sql`, `)})`);
  await db.execute(sql`delete from public."vendorsTable" where id in (${sql.join(vendorIds.map(id=>sql`${id}`),sql`, `)})`);
 }
 for(const id of users) {const {data}=await admin.auth.admin.getUserById(id);if(data.user?.app_metadata.lifecycle_test===run) assert.ifError((await admin.auth.admin.deleteUser(id)).error);}
 await db.$client.end();
}
