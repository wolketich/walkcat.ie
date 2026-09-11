import { extractEircode, googleDestinationUrl, googleRouteUrl } from "./route-links.mjs";

const GATEWAY = "https://modularhousing.ie/survey-route-api/";
const main = document.getElementById("routeContent");
const syncState = document.getElementById("syncState");
const doneDialog = document.getElementById("doneDialog");
let route = null;
let routeId = "";
let completed = new Set();
let pendingSegment = "";
let carouselSegment = "";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function idFromPath() {
  const pathMatch = location.pathname.match(/\/installation-route\/([a-f0-9]{32})(?:\/|$)/iu);
  return pathMatch?.[1]?.toLowerCase() || new URLSearchParams(location.search).get("id") || "";
}

function keyFromHash() {
  return new URLSearchParams(location.hash.slice(1)).get("key") || "";
}

function storageKey(kind) {
  return `installation-route:${routeId}:${kind}`;
}

function fromBase64Url(value) {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function dateLabel(value) {
  return new Intl.DateTimeFormat("en-IE", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${value}T12:00:00`));
}

function generatedLabel(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-IE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
}

function minutes(value) {
  const amount = Math.round(Number(value || 0));
  return amount >= 60 ? `${Math.floor(amount / 60)}h${amount % 60 ? ` ${amount % 60}m` : ""}` : `${amount}m`;
}

function phoneHref(value) {
  return `tel:${String(value || "").replace(/[^+\d]/gu, "")}`;
}

function stopAddress(stop) {
  const address = String(stop.address || "").trim();
  const eircode = extractEircode(stop.eircode || stop.address);
  const includesEircode = address.replace(/\s/gu, "").toUpperCase().includes(eircode.replace(/\s/gu, "").toUpperCase());
  return [address, includesEircode ? "" : eircode].filter(Boolean).join(", ") || eircode || "Address unavailable";
}

function fullRouteLink() {
  return googleRouteUrl({
    origin: route.start.location,
    stops: route.stops.map((stop) => stop.eircode),
    destination: route.finish?.location || ""
  });
}

function routeAction(stop, { prominent = false } = {}) {
  const navigationUrl = googleDestinationUrl(stop.eircode);
  const actions = [
    navigationUrl ? `<a class="action navigate" href="${escapeHtml(navigationUrl)}" target="_blank" rel="noopener"><span aria-hidden="true">↗</span> Navigate</a>` : "",
    stop.phone ? `<a class="action call" href="${escapeHtml(phoneHref(stop.phone))}"><span aria-hidden="true">☎</span> Call</a>` : ""
  ].filter(Boolean);
  if (!actions.length) return "";
  return `<div class="stop-links ${prominent ? "prominent" : ""} ${actions.length === 1 ? "single" : ""}">${actions.join("")}</div>`;
}

async function decryptEnvelope(envelope, keyValue) {
  if (envelope?.kind !== "encrypted-installation-route" || envelope.v !== 1) throw new Error("This route format is not supported.");
  const keyBytes = fromBase64Url(keyValue);
  if (keyBytes.length !== 32) throw new Error("The private route key is incomplete.");
  const key = await crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, ["decrypt"]);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromBase64Url(envelope.iv) }, key, fromBase64Url(envelope.ciphertext));
  const payload = JSON.parse(new TextDecoder().decode(plaintext));
  if (payload?.kind !== "installation-route" || payload.v !== 1 || !Array.isArray(payload.stops)) throw new Error("This installation route is incomplete.");
  return payload;
}

async function fetchRoute() {
  const endpoint = new URL(GATEWAY);
  endpoint.searchParams.set("id", routeId);
  const response = await fetch(endpoint, { headers: { Accept: "application/json" }, cache: "no-store" });
  if (!response.ok) throw new Error(response.status === 404 ? "This route has expired or was replaced." : "The route service is unavailable.");
  return decryptEnvelope(await response.json(), keyFromHash());
}

function loadState() {
  try {
    completed = new Set(JSON.parse(localStorage.getItem(storageKey("completed")) || "[]"));
  } catch {
    completed = new Set();
  }
}

function saveState() {
  localStorage.setItem(storageKey("completed"), JSON.stringify([...completed]));
}

function queue() {
  try {
    return JSON.parse(localStorage.getItem(storageKey("queue")) || "[]");
  } catch {
    return [];
  }
}

function saveQueue(value) {
  localStorage.setItem(storageKey("queue"), JSON.stringify(value));
}

function installationCard(stop, nextSegment) {
  const isDone = completed.has(stop.segmentId);
  const isNext = stop.segmentId === nextSegment;
  return `<article class="next-card ${isDone ? "is-done" : ""}" data-carousel-stop="${escapeHtml(stop.segmentId)}">
    <div class="next-kicker"><span>${isDone ? "COMPLETED" : isNext ? "NEXT JOB" : "COMING UP"}</span><span>${escapeHtml(stop.order)} OF ${route.stops.length}</span></div>
    <div class="next-time"><span>PLANNED ARRIVAL</span><strong>${escapeHtml(stop.arrival)}</strong></div>
    <h1>${escapeHtml(stop.name)}</h1>
    <p class="next-location">${escapeHtml(stopAddress(stop))}</p>
    <div class="next-facts"><span>${escapeHtml(stop.workType || "Installation")}</span><span>${minutes(stop.durationMinutes)} work</span><span>${minutes(stop.driveMinutes)} drive</span>${Number(stop.distanceKm) ? `<span>${escapeHtml(stop.distanceKm)} km</span>` : ""}</div>
    ${stop.notes ? `<p class="next-notes"><strong>Job notes</strong>${escapeHtml(stop.notes)}</p>` : ""}
    ${routeAction(stop, { prominent: true })}
    <button class="next-done-button" type="button" data-done="${escapeHtml(stop.segmentId)}" ${isDone ? "disabled" : ""}>${isDone ? "Completed ✓" : "Mark done"}</button>
  </article>`;
}

function installationCarousel() {
  if (route.stops.every((stop) => completed.has(stop.segmentId))) {
    return `<section class="next-card complete-card">
      <span class="eyebrow">ROUTE COMPLETE</span>
      <div class="complete-tick" aria-hidden="true">✓</div>
      <h1>That’s the day done.</h1>
      <p>Every job on this crew route is marked complete.</p>
    </section>`;
  }
  const nextSegment = route.stops.find((stop) => !completed.has(stop.segmentId))?.segmentId || "";
  return `<section class="next-deck" aria-label="Installation job cards">
    <div class="next-track" id="nextTrack">${route.stops.map((stop) => installationCard(stop, nextSegment)).join("")}</div>
    <div class="carousel-controls">
      <button type="button" id="previousJob" aria-label="Previous job">←</button>
      <span id="carouselStatus" aria-live="polite">Swipe to browse</span>
      <button type="button" id="nextJob" aria-label="Next job">→</button>
    </div>
  </section>`;
}

function stopCard(stop) {
  const isDone = completed.has(stop.segmentId);
  const navigationUrl = googleDestinationUrl(stop.eircode);
  return `<article class="timeline-item job ${isDone ? "is-done" : ""}" id="stop-${escapeHtml(stop.order)}">
    <div class="rail"><time>${escapeHtml(stop.arrival)}</time><span class="rail-dot">${escapeHtml(stop.order)}</span></div>
    <div class="stop-card">
      <header><div><span class="stop-type">${escapeHtml(stop.workType || `JOB ${stop.order}`)}</span><h2>${escapeHtml(stop.name)}</h2></div>${isDone ? '<span class="completed-badge">Completed ✓</span>' : `<button class="done-button" type="button" data-done="${escapeHtml(stop.segmentId)}">Mark done</button>`}</header>
      ${navigationUrl ? `<a class="location-link" href="${escapeHtml(navigationUrl)}" target="_blank" rel="noopener">${escapeHtml(stopAddress(stop))} <span aria-hidden="true">↗</span></a>` : `<p class="location-text">${escapeHtml(stopAddress(stop))}</p>`}
      <div class="appointment-band"><strong>${escapeHtml(stop.arrival)}</strong><span>Work ${escapeHtml(stop.start || stop.arrival)}–${escapeHtml(stop.end)}<br>${minutes(stop.durationMinutes)} planned on site</span></div>
      <dl class="stop-facts"><div><dt>From previous</dt><dd>${minutes(stop.driveMinutes)} · ${escapeHtml(stop.distanceKm || 0)} km</dd></div><div><dt>Work type</dt><dd>${escapeHtml(stop.workType || "Installation")}</dd></div>${stop.phone ? `<div><dt>Phone</dt><dd><a href="${escapeHtml(phoneHref(stop.phone))}">${escapeHtml(stop.phone)}</a></dd></div>` : ""}<div><dt>Eircode</dt><dd>${escapeHtml(extractEircode(stop.eircode) || "Missing")}</dd></div></dl>
      ${stop.notes ? `<div class="survey-note"><span>JOB NOTES</span><p>${escapeHtml(stop.notes)}</p></div>` : ""}
      ${routeAction(stop)}
    </div>
  </article>`;
}

function breakCard(item) {
  return `<article class="timeline-item block">
    <div class="rail"><time>${escapeHtml(item.start)}</time><span class="rail-dot">×</span></div>
    <div class="block-card"><span>BREAK</span><strong>${escapeHtml(item.label)}</strong><p>${escapeHtml(item.start)}–${escapeHtml(item.end)}</p></div>
  </article>`;
}

function timeline() {
  const events = [
    ...route.stops.map((stop) => ({ type: "stop", time: stop.arrival, value: stop })),
    ...(route.breaks || []).map((item) => ({ type: "break", time: item.start, value: item }))
  ].sort((left, right) => left.time.localeCompare(right.time) || (left.type === "break" ? -1 : 1));
  const startUrl = googleDestinationUrl(route.start.location);
  const finishUrl = route.finish ? googleDestinationUrl(route.finish.location) : "";
  return `<section class="day-section" aria-labelledby="dayPlanTitle">
    <div class="section-heading"><div><span class="eyebrow">INSTALLATION ROUTE</span><h2 id="dayPlanTitle">Schedule</h2></div><span>${route.stops.length} jobs · ${escapeHtml(route.totals.distanceKm)} km</span></div>
    <div class="timeline">
      <article class="timeline-item start-item">
        <div class="rail"><time>${escapeHtml(route.start.departure)}</time><span class="rail-dot">S</span></div>
        <div class="start-card"><span>DEPART</span><strong>${escapeHtml(route.start.label)}</strong><p>${escapeHtml(route.start.location)} · crew ready and loaded</p>${startUrl ? `<a href="${escapeHtml(startUrl)}" target="_blank" rel="noopener">Open start point ↗</a>` : ""}</div>
      </article>
      ${events.map((event) => event.type === "stop" ? stopCard(event.value) : breakCard(event.value)).join("")}
      ${route.finish ? `<article class="timeline-item finish-item"><div class="rail"><time>${escapeHtml(route.finish.eta)}</time><span class="rail-dot">F</span></div><div class="finish-card"><span>FINISH</span><strong>${escapeHtml(route.finish.label)}</strong><p>${escapeHtml(route.finish.location)} · estimated return</p>${finishUrl ? `<a href="${escapeHtml(finishUrl)}" target="_blank" rel="noopener">Navigate ↗</a>` : ""}</div></article>` : ""}
    </div>
  </section>`;
}

function render() {
  const doneCount = route.stops.filter((stop) => completed.has(stop.segmentId)).length;
  const progress = route.stops.length ? Math.round(doneCount / route.stops.length * 100) : 100;
  const fullRouteUrl = fullRouteLink();
  const lead = route.crew.lead?.name || "Lead not set";
  document.title = `${route.crew.name} · ${dateLabel(route.date)}`;
  main.innerHTML = `<section class="reader-app">
    <section class="route-masthead">
      <div><span class="eyebrow">${escapeHtml(route.crew.name)}</span><h1>${escapeHtml(dateLabel(route.date))}</h1><p>${escapeHtml(lead)} responsible · depart ${escapeHtml(route.start.departure)} · finish around ${escapeHtml(route.totals.finishTime || "—")}</p></div>
      ${fullRouteUrl ? `<a class="full-route-link" href="${escapeHtml(fullRouteUrl)}" target="_blank" rel="noopener">Open full route <span aria-hidden="true">↗</span></a>` : '<span class="route-link-unavailable">Full route needs Eircodes</span>'}
    </section>
    <section class="progress-card" aria-label="Route progress"><div><strong>${doneCount} / ${route.stops.length}</strong><span>jobs completed</span></div><div class="progress-track" aria-hidden="true"><i style="width:${progress}%"></i></div></section>
    ${navigator.onLine ? "" : '<div class="offline-note">Offline mode · completions will sync when signal returns.</div>'}
    ${installationCarousel()}
    ${timeline()}
    <footer class="route-footer"><span>Expert Windows · Field operations</span><p>${route.generatedAt ? `Route generated ${escapeHtml(generatedLabel(route.generatedAt))}` : "Saved route"}</p></footer>
  </section>`;

  main.querySelectorAll("[data-done]").forEach((button) => button.addEventListener("click", () => openDone(button.dataset.done)));
  setupCarousel();
}

function setupCarousel() {
  const track = document.getElementById("nextTrack");
  if (!track) return;
  const cards = [...track.querySelectorAll("[data-carousel-stop]")];
  const nextIncomplete = route.stops.find((stop) => !completed.has(stop.segmentId))?.segmentId;
  let activeIndex = Math.max(0, cards.findIndex((card) => card.dataset.carouselStop === (carouselSegment || nextIncomplete)));
  const updateControls = () => {
    carouselSegment = cards[activeIndex]?.dataset.carouselStop || "";
    const status = document.getElementById("carouselStatus");
    if (status) status.textContent = `Swipe to browse · ${activeIndex + 1} of ${cards.length}`;
    const previous = document.getElementById("previousJob");
    const next = document.getElementById("nextJob");
    if (previous) previous.disabled = activeIndex === 0;
    if (next) next.disabled = activeIndex === cards.length - 1;
  };
  const moveTo = (index, behavior = "smooth") => {
    activeIndex = Math.max(0, Math.min(cards.length - 1, index));
    track.scrollTo({ left: cards[activeIndex].offsetLeft - track.offsetLeft, behavior });
    updateControls();
  };
  let scrollTimer;
  track.addEventListener("scroll", () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      activeIndex = cards.reduce((closest, card, index) => Math.abs(card.offsetLeft - track.scrollLeft) < Math.abs(cards[closest].offsetLeft - track.scrollLeft) ? index : closest, 0);
      updateControls();
    }, 80);
  }, { passive: true });
  document.getElementById("previousJob")?.addEventListener("click", () => moveTo(activeIndex - 1));
  document.getElementById("nextJob")?.addEventListener("click", () => moveTo(activeIndex + 1));
  requestAnimationFrame(() => moveTo(activeIndex, "auto"));
}

function openDone(segmentId) {
  const stop = route.stops.find((item) => item.segmentId === segmentId);
  if (!stop || completed.has(segmentId)) return;
  pendingSegment = segmentId;
  document.getElementById("doneJobName").textContent = `${stop.name} · ${stopAddress(stop)}`;
  doneDialog.showModal();
}

async function confirmDone() {
  if (!pendingSegment) return;
  completed.add(pendingSegment);
  saveState();
  const events = queue();
  events.push({ action: "complete", id: routeId, capability: route.completionCapability, segmentId: pendingSegment, eventId: crypto.randomUUID(), completedAt: new Date().toISOString() });
  saveQueue(events);
  carouselSegment = route.stops.find((stop) => !completed.has(stop.segmentId))?.segmentId || "";
  pendingSegment = "";
  doneDialog.close();
  render();
  await flushQueue();
}

async function flushQueue() {
  const events = queue();
  if (!events.length) {
    setSync("Up to date", true);
    return;
  }
  if (!navigator.onLine) {
    setSync(`${events.length} update queued`, false);
    return;
  }
  const remaining = [];
  for (const event of events) {
    try {
      const response = await fetch(GATEWAY, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(event) });
      if (!response.ok) throw new Error("Completion sync failed.");
    } catch {
      remaining.push(event);
    }
  }
  saveQueue(remaining);
  setSync(remaining.length ? `${remaining.length} update queued` : "Up to date", !remaining.length);
}

function setSync(value, online) {
  syncState.textContent = value;
  syncState.classList.toggle("online", online);
}

function showError(message) {
  main.innerHTML = `<section class="empty-route"><span class="broken-route" aria-hidden="true">S—×</span><span class="eyebrow">ROUTE READER</span><h1>This route won’t open</h1><p>${escapeHtml(message)}</p><small>Ask dispatch to publish the crew route again.</small></section>`;
  setSync("Unavailable", false);
}

async function initialise() {
  routeId = idFromPath();
  if (!routeId || !keyFromHash()) return showError("Open the complete private link sent by dispatch.");
  loadState();
  try {
    route = await fetchRoute();
    localStorage.setItem(storageKey("payload"), JSON.stringify(route));
    setSync("Up to date", true);
  } catch (error) {
    try {
      route = JSON.parse(localStorage.getItem(storageKey("payload")) || "null");
      if (!route) throw error;
      setSync("Offline copy", false);
    } catch {
      return showError(error.message);
    }
  }
  render();
  flushQueue();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("./service-worker.js").catch(() => {});
}

document.getElementById("confirmDone").addEventListener("click", confirmDone);
window.addEventListener("online", () => { render(); flushQueue(); });
window.addEventListener("offline", render);
initialise();
