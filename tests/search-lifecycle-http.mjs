import 'dotenv/config';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {createServerClient} from '@supabase/ssr';
import postgres from 'postgres';
const base=process.argv[2]??'http://localhost:3014';
assert.equal(new URL(base).hostname,'localhost');
assert.equal(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname,'mbrdrexnhxihqlyqukmx.supabase.co');
const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PRIVATE_SUPABASE_SERVICE_KEY,{auth:{persistSession:false}});
const db=postgres(process.env.DATABASE_URL,{prepare:false,max:2});
const run=randomUUID(),users=[];
async function account(role='user') {
 const email=`lifecycle-http-${run}-${users.length}@example.test`,password=`Test-${randomUUID()}!8a`;
 const {data,error}=await admin.auth.admin.createUser({email,password,email_confirm:true,app_metadata:{role,lifecycle_test:run}});assert.ifError(error);users.push(data.user.id);
 const jar=new Map();
 const auth=createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{autoRefreshToken:false},cookies:{getAll:()=>[...jar].map(([name,value])=>({name,value})),setAll:cookies=>cookies.forEach(({name,value})=>jar.set(name,value))}});
 assert.ifError((await auth.auth.signInWithPassword({email,password})).error);
 return {id:data.user.id,cookie:()=>[...jar].map(([k,v])=>`${k}=${encodeURIComponent(v)}`).join('; ')};
}
const prefs=[{serviceId:1,budget:1000000,location:[1,2,3],criteria:{}}];
async function request(user,path,{method='GET',body,id,expected=200,origin=base}={}) {
 const response=await fetch(`${base}${path}`,{method,headers:{...(user?{cookie:user.cookie()}:{}),origin,'content-type':'application/json',...(id?{'Idempotency-Key':id}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(60000)});
 const data=await response.json();assert.equal(response.status,expected,JSON.stringify(data));assert.match(response.headers.get('cache-control'),/no-store/);return data;
}
try {
 const free=await account(),other=await account(),operator=await account('admin');
 const id=randomUUID(),url=`/api/match/vendors?searchId=${id}`;
 await request(null,url,{expected:401});
 await request(free,'/api/match/vendors',{method:'POST',body:prefs,id,origin:'https://example.invalid',expected:403});
 const results=await Promise.all(Array.from({length:3},()=>request(free,'/api/match/vendors',{method:'POST',body:prefs,id})));
 assert.ok(results.every(r=>r.usage.used===1&&r.usage.remaining===0));
 const initial=results[0];assert.equal(initial.topMatches.length,1);
 // Free: the top pick is a locked preview; the list has only the one vendor the free search unlocked, in full.
 const visible=initial.topMatches;
 assert.ok(visible.every(m=>m.identityLocked&&!('vendorName' in m.vendor)&&!('packages' in m)));
 assert.ok(initial.matches.length<=1&&initial.matches.every(m=>!m.identityLocked&&m.vendor.vendorName));
 const unlocked=initial.matches[0];
 assert.equal((await request(free,url)).usage.used,1);
 // One free search, ever.
 await request(free,'/api/match/vendors',{method:'POST',body:prefs,id:randomUUID(),expected:403});
 const [before]=await db`select expires_at from public.manual_search_snapshots where user_id=${free.id} and search_id=${id}`;
 await request(free,url);const [after]=await db`select expires_at from public.manual_search_snapshots where user_id=${free.id} and search_id=${id}`;assert.equal(+before.expires_at,+after.expires_at);
 await request(other,url,{expected:410});
 await request(free,`${url}&page=0`,{expected:400});
 await request(free,`${url}&page=99999`,{expected:404});
 // The top pick's details are refused; the unlocked vendor's are given.
 await request(free,`${url}&vendorId=${visible[0].vendor.id}`,{expected:403});
 if(unlocked) assert.ok((await request(free,`${url}&vendorId=${unlocked.vendor.id}`)).packages.length);
 await admin.auth.admin.updateUserById(free.id,{app_metadata:{role:'user',lifecycle_test:run,paid_until:'2099-01-01T00:00:00Z'}});
 // Upgrading unlocks the same search in full.
 const paid=await request(free,url);assert.ok([...paid.matches,...paid.topMatches].every(m=>!m.identityLocked&&m.vendor.vendorName));
 assert.equal(paid.lockedCount,0);assert.ok(paid.matches.length>=initial.matches.length);
 const detail=await request(free,`${url}&vendorId=${visible[0].vendor.id}`);assert.ok(detail.packages.length);
 await admin.auth.admin.updateUserById(free.id,{app_metadata:{role:'user',lifecycle_test:run,paid_until:null}});
 await request(free,`${url}&vendorId=${visible[0].vendor.id}`,{expected:403});
 // After Plus ends: locked again, except the vendor the free search unlocked (kept permanently).
 const revoked=await request(free,url);
 assert.ok(revoked.topMatches.every(m=>!('packages' in m)&&!('vendorName' in m.vendor)));
 assert.deepEqual(revoked.matches.map(m=>m.vendor.id),initial.matches.map(m=>m.vendor.id));
 const adminResult=await request(operator,'/api/match/vendors',{method:'POST',body:prefs,id:randomUUID()});assert.equal(adminResult.usage.limit,null);
 await db`update public.manual_search_snapshots set expires_at=now()-interval '1 second' where user_id=${free.id} and search_id=${id}`;
 await request(free,url,{expected:410});
 await request(free,'/api/match/vendors',{method:'POST',body:prefs,id,expected:410});
 assert.equal((await request(free,'/api/account/search-usage')).used,1);
 const marker=randomUUID();
 for(let i=0;i<10;i++) await request(other,'/api/match/vendors',{method:'POST',body:prefs,id:marker});
 const throttled=await request(other,'/api/match/vendors',{method:'POST',body:prefs,id:marker,expected:429});assert.match(throttled.error,/Too many requests/);
 console.log('PASS HTTP: guest/CSRF denial, concurrent retries, one free search, locked top pick and unlocked vendor, GET without quota/expiry extension, ownership, pagination validation, upgrade unlocks the same search, revocation keeps the unlocked vendor, detail guards, expiry, and database-backed throttling.');
} finally {
 for(const id of users) {const {data}=await admin.auth.admin.getUserById(id);if(data.user?.app_metadata.lifecycle_test===run) assert.ifError((await admin.auth.admin.deleteUser(id)).error);}
 await db.end();
}
