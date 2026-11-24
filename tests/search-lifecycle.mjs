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
 const vendors=await db.insert(vendorsTable).values(Array.from({length:23},(_,i)=>({vendorName:`TEST ${run} ${i}`,serviceId:catalogue.id,locationId:[1],imagePaths:[]}))).returning();
 vendorIds.push(...vendors.map(v=>v.id));
 const packages=await db.insert(packagesTable).values(vendors.map((v,i)=>({vendorId:v.id,packageName:`TEST ${run} ${i}`,price:100+i,filters:{}}))).returning();
 fixtures=vendors.map(v=>({vendor:{...v,imageUrls:[]},packages:packages.filter(p=>p.vendorId===v.id)}));
 await assert.rejects(service.runManualSearch(free,randomUUID(),[{...preferences[0],budget:13}]),/matching failure/);
 assert.equal((await service.getManualSearchUsage(free)).used,0);
 const id=randomUUID();
 const results=await Promise.all(Array.from({length:3},()=>service.runManualSearch(free,id,preferences)));
 assert.equal(results[0].topMatches.length,1);assert.equal(results[0].matches.length,20);assert.equal(results[0].pageCount,2);assert.equal(results[0].total,22);
 assert.ok(results.every(r=>r.usage.used===1));
 const count=calls;
 const saved=await db.execute(sql`select matches,created_at,expires_at from public.manual_search_snapshots where user_id=${free.userId} and search_id=${id}`);
 assert.equal(new Date(saved[0].expires_at)-new Date(saved[0].created_at),86400000);
 assert.deepEqual(Object.keys(saved[0].matches[0]).sort(),['isTopPick','matchedPackageIds','position','serviceId','vendorId'].sort());
 const second=await service.readManualSearch(free,id,2);
 assert.equal(second.matches.length,2);assert.equal(second.usage.used,1);assert.equal(calls,count);
 assert.ok([...second.matches,...second.topMatches].every(m=>m.identityLocked&&!('packages' in m)&&!('vendorName' in m.vendor)));
 await assert.rejects(service.readManualSearch(other,id),e=>e.status===410);
 await assert.rejects(service.readManualSearchVendor(free,id,vendors[0].id),e=>e.status===403);
 await assert.rejects(service.runManualSearch(free,id,[{...preferences[0],budget:99}]),e=>e.status===409);
 await db.execute(sql`update public."vendorsTable" set "vendorName"=${`UPDATED ${run}`} where id=${vendors[0].id}`);
 await db.execute(sql`update public."packagesTable" set price=777 where id=${packages[0].id}`);
 const fresh=await service.readManualSearchVendor(paid,id,vendors[0].id);
 assert.equal(fresh.vendor.vendorName,`UPDATED ${run}`);assert.equal(fresh.packages[0].price,777);
 const freshPage=await service.readManualSearch(free,id);
 assert.equal(freshPage.topMatches[0].cheapestPrice,777);assert.equal(calls,count);
 await db.execute(sql`delete from public."packagesTable" where "vendorId"=${vendors[22].id}`);
 assert.equal((await service.readManualSearch(free,id,2)).matches.length,1);
 await assert.rejects(service.readManualSearchVendor(paid,id,vendors[22].id),e=>e.status===404);
 await db.execute(sql`update public.manual_search_snapshots set expires_at=now()-interval '1 second' where user_id=${free.userId} and search_id=${id}`);
 await assert.rejects(service.readManualSearch(free,id),e=>e.status===410);
 await assert.rejects(service.runManualSearch(free,id,preferences),e=>e.status===410);
 assert.equal((await service.getManualSearchUsage(free)).used,1);assert.equal(calls,count);
 await db.execute(sql`delete from public.manual_search_snapshots where user_id=${free.userId} and search_id=${id}`);
 await assert.rejects(service.readManualSearch(free,id),e=>e.status===410);
 assert.equal(calls,count);
 const legacy=randomUUID();
 await db.execute(sql`insert into public.manual_search_results (user_id,search_id,fingerprint,matches,created_at) values (${free.userId},${legacy},${'a'.repeat(64)},${JSON.stringify(fixtures)}::jsonb,now()-interval '23 hours')`);
 const legacyPage=await service.readManualSearch(free,legacy);
 assert.equal(legacyPage.topMatches[0].cheapestPrice,777);assert.equal(calls,count);
 await db.execute(sql`update public.manual_search_results set created_at=now()-interval '25 hours' where user_id=${free.userId} and search_id=${legacy}`);
 await assert.rejects(service.readManualSearch(free,legacy),e=>e.status===410);
 for(let i=0;i<10;i++) await service.throttleSearch(other.userId,'create');
 await assert.rejects(service.throttleSearch(other.userId,'create'),e=>e.status===429);
 await db.execute(sql`update public.search_request_limits set window_start=now()-interval '2 minutes' where user_id=${other.userId}`);
 await service.throttleSearch(other.userId,'create');
 for (const table of ['manual_search_snapshots','search_request_limits']) {
  const [grants]=await db.execute(sql`select has_table_privilege('anon',${`public.${table}`},'SELECT') as anon, has_table_privilege('authenticated',${`public.${table}`},'SELECT') as authenticated`);
  assert.equal(grants.anon,false);assert.equal(grants.authenticated,false);
 }
 console.log('PASS lifecycle: rollback after matching failure, concurrent idempotency, compact snapshots, exact 24h expiry, pagination, read without matching/quota, isolation, locked projection, live names/prices, removed packages, expired/missing reads, legacy compatibility, throttle/reset, browser grants.');
} finally {
 if(vendorIds.length) {
  await db.execute(sql`delete from public."packagesTable" where "vendorId" in (${sql.join(vendorIds.map(id=>sql`${id}`),sql`, `)})`);
  await db.execute(sql`delete from public."vendorsTable" where id in (${sql.join(vendorIds.map(id=>sql`${id}`),sql`, `)})`);
 }
 for(const id of users) {const {data}=await admin.auth.admin.getUserById(id);if(data.user?.app_metadata.lifecycle_test===run) assert.ifError((await admin.auth.admin.deleteUser(id)).error);}
 await db.$client.end();
}
