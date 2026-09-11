const GATEWAY = "https://modularhousing.ie/survey-route-api/";
const main = document.getElementById("routeContent");
const syncState = document.getElementById("syncState");
const doneDialog = document.getElementById("doneDialog");
let route = null;
let routeId = "";
let completed = new Set();
let pendingSegment = "";

function escapeHtml(value) { return String(value ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"); }
function idFromPath() { const match = location.pathname.match(/\/installation-route\/([a-f0-9]{32})(?:\/|$)/i); return match?.[1]?.toLowerCase() || new URLSearchParams(location.search).get("id") || ""; }
function keyFromHash() { return new URLSearchParams(location.hash.slice(1)).get("key") || ""; }
function storageKey(kind) { return `installation-route:${routeId}:${kind}`; }
function fromBase64Url(value) { const base64=value.replaceAll("-","+").replaceAll("_","/").padEnd(Math.ceil(value.length/4)*4,"="); const binary=atob(base64); return Uint8Array.from(binary,(char)=>char.charCodeAt(0)); }
function dateLabel(value) { return new Intl.DateTimeFormat("en-IE",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(new Date(`${value}T12:00:00`)); }
function minutes(value) { const n=Math.round(Number(value||0)); return n>=60?`${Math.floor(n/60)}h${n%60?` ${n%60}m`:""}`:`${n}m`; }
function phoneHref(value) { return `tel:${String(value||"").replace(/[^+\d]/g,"")}`; }
function mapsLink(location) { const url=new URL("https://www.google.com/maps/dir/"); url.searchParams.set("api","1"); url.searchParams.set("destination",location); url.searchParams.set("travelmode","driving"); return url; }
function fullRouteLink() { const points=[route.start.location,...route.stops.map((stop)=>stop.address||stop.eircode),route.finish?.location].filter(Boolean); const origin=points.shift(); const destination=points.pop()||origin; const url=new URL("https://www.google.com/maps/dir/"); url.searchParams.set("api","1"); url.searchParams.set("origin",origin); url.searchParams.set("destination",destination); url.searchParams.set("travelmode","driving"); if(points.length)url.searchParams.set("waypoints",points.join("|")); return url; }

async function decryptEnvelope(envelope,keyValue) {
  if(envelope?.kind!=="encrypted-installation-route"||envelope.v!==1) throw new Error("This route format is not supported.");
  const keyBytes=fromBase64Url(keyValue); if(keyBytes.length!==32) throw new Error("The private route key is incomplete.");
  const key=await crypto.subtle.importKey("raw",keyBytes,{name:"AES-GCM"},false,["decrypt"]);
  const plaintext=await crypto.subtle.decrypt({name:"AES-GCM",iv:fromBase64Url(envelope.iv)},key,fromBase64Url(envelope.ciphertext));
  const payload=JSON.parse(new TextDecoder().decode(plaintext));
  if(payload?.kind!=="installation-route"||payload.v!==1||!Array.isArray(payload.stops)) throw new Error("This installation route is incomplete.");
  return payload;
}

async function fetchRoute() {
  const response=await fetch(`${GATEWAY}?id=${encodeURIComponent(routeId)}`,{headers:{Accept:"application/json"},cache:"no-store"});
  if(!response.ok) throw new Error(response.status===404?"This route has expired or was replaced.":"The route service is unavailable.");
  return decryptEnvelope(await response.json(),keyFromHash());
}

function loadState() {
  try { completed=new Set(JSON.parse(localStorage.getItem(storageKey("completed"))||"[]")); } catch { completed=new Set(); }
}
function saveState() { localStorage.setItem(storageKey("completed"),JSON.stringify([...completed])); }
function queue() { try { return JSON.parse(localStorage.getItem(storageKey("queue"))||"[]"); } catch { return []; } }
function saveQueue(value) { localStorage.setItem(storageKey("queue"),JSON.stringify(value)); }

function render() {
  const doneCount=route.stops.filter((stop)=>completed.has(stop.segmentId)).length;
  const progress=route.stops.length?Math.round(doneCount/route.stops.length*100):100;
  document.title=`${route.crew.name} · ${dateLabel(route.date)}`;
  main.innerHTML=`
    <section class="masthead"><div><span class="eyebrow">${escapeHtml(route.crew.name)}</span><h1>${escapeHtml(dateLabel(route.date))}</h1><p>${escapeHtml(route.crew.lead?.name||"Lead not set")} responsible · leave ${escapeHtml(route.start.departure)} · finish around ${escapeHtml(route.totals.finishTime)}</p></div><a class="route-link" href="${escapeHtml(fullRouteLink())}" target="_blank" rel="noopener">Full route ↗</a></section>
    <section class="progress"><div><strong>${doneCount} / ${route.stops.length}</strong><span>jobs completed</span></div><div class="progress-track"><i style="width:${progress}%"></i></div></section>
    ${navigator.onLine?"":'<div class="offline-note">Offline mode: completions will be sent automatically when signal returns.</div>'}
    ${doneCount===route.stops.length?'<section class="day-complete"><strong>Route complete</strong><span>Every job on this crew route is marked done.</span></section>':nextCards()}
    <div class="section-label"><strong>Route order</strong><span>${route.totals.distanceKm} km · ${minutes(route.totals.drivingMinutes)} driving</span></div>
    <section class="timeline">${timeline()}</section>`;
  main.querySelectorAll("[data-done]").forEach((button)=>button.addEventListener("click",()=>openDone(button.dataset.done)));
}

function nextCards() {
  const remaining=route.stops.filter((stop)=>!completed.has(stop.segmentId));
  return `<div class="section-label"><strong>Next jobs</strong><span>Swipe to look ahead →</span></div><section class="next-scroller">${remaining.map((stop,index)=>`
    <article class="next-card"><div class="next-top"><span>${index===0?"NEXT JOB":"COMING UP"}</span><span>${stop.order} OF ${route.stops.length}</span></div><div class="next-time"><span>PLANNED ARRIVAL</span><strong>${escapeHtml(stop.arrival)}</strong></div><h2>${escapeHtml(stop.name)}</h2><p class="address">${escapeHtml(stop.address||stop.eircode)}</p><div class="facts"><span>${escapeHtml(stop.workType)}</span><span>${minutes(stop.durationMinutes)} work</span><span>${minutes(stop.driveMinutes)} drive</span></div>${stop.notes?`<p class="notes">${escapeHtml(stop.notes)}</p>`:""}<div class="actions"><a href="${escapeHtml(mapsLink(stop.address||stop.eircode))}" target="_blank" rel="noopener">Navigate ↗</a>${stop.phone?`<a class="call" href="${escapeHtml(phoneHref(stop.phone))}">Call</a>`:"<span></span>"}</div><button class="done-button" data-done="${escapeHtml(stop.segmentId)}">Mark done</button></article>`).join("")}</section>`;
}

function timeline() {
  const events=[...route.stops.map((stop)=>({kind:"job",time:stop.arrival,value:stop})),...(route.breaks||[]).map((item)=>({kind:"break",time:item.start,value:item}))].sort((a,b)=>a.time.localeCompare(b.time));
  return events.map((event)=>event.kind==="break"?`<div class="event break"><time>${escapeHtml(event.value.start)}</time><article><span>BREAK</span><strong>${escapeHtml(event.value.label)}</strong><p>${escapeHtml(event.value.start)}–${escapeHtml(event.value.end)}</p></article></div>`:stopEvent(event.value)).join("");
}
function stopEvent(stop) { const done=completed.has(stop.segmentId); return `<div class="event"><time>${escapeHtml(stop.arrival)}</time><article><span>${done?"COMPLETED":"JOB "+stop.order}</span><strong>${escapeHtml(stop.name)} ${done?"✓":""}</strong><p>${escapeHtml(stop.address||stop.eircode)} · finish around ${escapeHtml(stop.end)}</p>${stop.notes?`<p class="notes">${escapeHtml(stop.notes)}</p>`:""}${done?"":`<button class="done-button" data-done="${escapeHtml(stop.segmentId)}">Mark done</button>`}</article></div>`; }

function openDone(segmentId) { const stop=route.stops.find((item)=>item.segmentId===segmentId); if(!stop)return; pendingSegment=segmentId; document.getElementById("doneJobName").textContent=stop.name; doneDialog.showModal(); }
async function confirmDone() {
  if(!pendingSegment)return;
  completed.add(pendingSegment); saveState();
  const events=queue();
  events.push({action:"complete",id:routeId,capability:route.completionCapability,segmentId:pendingSegment,eventId:crypto.randomUUID(),completedAt:new Date().toISOString()});
  saveQueue(events); pendingSegment=""; doneDialog.close(); render(); await flushQueue();
}

async function flushQueue() {
  const events=queue(); if(!events.length){setSync("Up to date",true);return;}
  if(!navigator.onLine){setSync(`${events.length} update queued`,false);return;}
  const remaining=[];
  for(const event of events){try{const response=await fetch(GATEWAY,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(event)});if(!response.ok)throw new Error();}catch{remaining.push(event);}}
  saveQueue(remaining); setSync(remaining.length?`${remaining.length} update queued`:"Up to date",!remaining.length);
}
function setSync(value,online){syncState.textContent=value;syncState.classList.toggle("online",online);}
function showError(message){main.innerHTML=`<section class="error"><span class="eyebrow">ROUTE UNAVAILABLE</span><h1>This route won’t open</h1><p>${escapeHtml(message)}</p><small>Ask dispatch to publish the crew route again.</small></section>`;setSync("Unavailable",false);}

async function initialise(){routeId=idFromPath();if(!routeId||!keyFromHash())return showError("Open the complete private link sent by dispatch.");loadState();try{route=await fetchRoute();localStorage.setItem(storageKey("payload"),JSON.stringify(route));setSync("Up to date",true);}catch(error){try{route=JSON.parse(localStorage.getItem(storageKey("payload"))||"null");if(!route)throw error;setSync("Offline copy",false);}catch{return showError(error.message);}}render();flushQueue();if("serviceWorker"in navigator)navigator.serviceWorker.register("./service-worker.js").catch(()=>{});}
document.getElementById("confirmDone").addEventListener("click",confirmDone);
window.addEventListener("online",()=>{render();flushQueue();});window.addEventListener("offline",render);
initialise();
