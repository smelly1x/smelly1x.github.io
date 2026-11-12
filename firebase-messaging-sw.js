/* Shaad & Fiaza - service worker. Lives next to index.html in the GitHub repo and
   must keep this exact filename (Firebase looks for it by name). It does two jobs:
   1. receives notifications, even when the app is closed
   2. keeps a copy of the app on the phone, so it opens with no signal, and always
      asks GitHub for the newest index.html first when there is a connection.
   It only ever touches this app's own page and files: nothing else on the site. */
const SDK='https://www.gstatic.com/firebasejs/10.12.2/';
const CACHE='sf-app-v1';
const HOME=new URL('./',self.location.href).href;               // e.g. https://smelly1x.github.io/
const KEEP=['icon-192.png','icon-512.png','icon-512-maskable.png','manifest.webmanifest'].map(f=>new URL(f,HOME).href);
const SDK_FILES=['firebase-app-compat.js','firebase-auth-compat.js','firebase-database-compat.js','firebase-messaging-compat.js'].map(f=>SDK+f);

/* Firebase's own code never changes for a given version, so it's fetched once and kept */
async function sdkFetch(url){
  try{const r=await fetch(url,{mode:'cors',credentials:'omit'});if(r.ok)return r;}catch(e){}
  return fetch(url,{mode:'no-cors'});
}
async function sdkFirst(url){
  const c=await caches.open(CACHE), hit=await c.match(url);
  if(hit)return hit;
  const r=await sdkFetch(url);
  if(r.ok||r.type==='opaque')c.put(url,r.clone()).catch(()=>{});
  return r;
}
/* the app itself: newest from GitHub if it answers within 4 seconds, otherwise the saved copy */
async function pageFirst(e){
  const c=await caches.open(CACHE);
  try{
    const ctl=new AbortController(), t=setTimeout(()=>ctl.abort(),4000);
    const r=await fetch(HOME,{cache:'no-store',signal:ctl.signal});
    clearTimeout(t);
    if(r.ok){
      const save=c.put(HOME,r.clone()).catch(()=>{});
      try{e.waitUntil(save);}catch(x){}        // saving the copy must never get in the way of showing the page
      return r.redirected?new Response(r.body,{status:r.status,statusText:r.statusText,headers:r.headers}):r;
    }
  }catch(err){}
  return (await c.match(HOME))||fetch(e.request);
}
/* icons and the manifest: show the saved one straight away, refresh it quietly */
async function keepFresh(e,url){
  const c=await caches.open(CACHE), hit=await c.match(url);
  const net=fetch(url,{cache:'no-cache'}).then(r=>{if(r.ok)c.put(url,r.clone()).catch(()=>{});return r;});
  if(hit){const quiet=net.catch(()=>{});try{e.waitUntil(quiet);}catch(x){}return hit;}
  return net;
}

self.addEventListener('install',e=>{
  e.waitUntil((async()=>{
    const c=await caches.open(CACHE);
    const grab=async(url,get)=>{try{const r=await get(url);if(r&&(r.ok||r.type==='opaque'))await c.put(url,r);}catch(err){}};
    await Promise.all([grab(HOME,u=>fetch(u,{cache:'no-store'}))]
      .concat(KEEP.map(u=>grab(u,x=>fetch(x,{cache:'no-cache'}))))
      .concat(SDK_FILES.map(u=>grab(u,sdkFetch))));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate',e=>{
  e.waitUntil((async()=>{
    const names=await caches.keys();
    await Promise.all(names.filter(n=>n.startsWith('sf-app-')&&n!==CACHE).map(n=>caches.delete(n)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;
  const url=req.url.split('#')[0].split('?')[0];
  if(req.mode==='navigate'){
    if(url===HOME||url===HOME+'index.html')e.respondWith(pageFirst(e));
    return;                                   // any other page on this site is left alone
  }
  if(KEEP.includes(url)){e.respondWith(keepFresh(e,url));return;}
  if(req.url.startsWith(SDK))e.respondWith(sdkFirst(req.url));
});

/* ---------- notifications ---------- */
importScripts(SDK+'firebase-app-compat.js');
importScripts(SDK+'firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:"AIzaSyDx5UmoKqq1fJ5tGtZsuqaALpvn7f7Pa7M",
  authDomain:"shaad-x-fiaza.firebaseapp.com",
  databaseURL:"https://shaad-x-fiaza-default-rtdb.europe-west1.firebasedatabase.app",
  projectId:"shaad-x-fiaza",
  storageBucket:"shaad-x-fiaza.firebasestorage.app",
  messagingSenderId:"49327927291",
  appId:"1:49327927291:web:0286d5f58264cec193e55e"
});

// Notifications sent with a title and body are shown automatically by Firebase
// when the app isn't open, and tapping one opens the link it carries.
// (A browser that can't do notifications still gets the offline copy above.)
try{firebase.messaging();}catch(e){}
