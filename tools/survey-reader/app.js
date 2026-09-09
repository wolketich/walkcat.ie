import { decodeRoutePayload } from "./route-codec.mjs";

const loadingState = document.getElementById("loadingState");
const readerApp = document.getElementById("readerApp");
let route = null;
let routeToken = "";
let completionKey = "";
let completed = new Set();

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function routeFromHash() {
  return new URLSearchParams(location.hash.slice(1)).get("route") || "";
}

function dateLabel(value) {
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat("en-IE", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(date);
}

function generatedLabel(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-IE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
}

function googleDestination(locationValue) {
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("destination", locationValue);
  url.searchParams.set("travelmode", "driving");
  return url.toString();
}

function googleFullRoute() {
  const points = [route.start.location, ...route.stops.map((stop) => stop.location)];
  if (route.finish?.location) points.push(route.finish.location);
  const origin = points.shift();
  const destination = points.pop() || origin;
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("origin", origin);
  url.searchParams.set("destination", destination);
  url.searchParams.set("travelmode", "driving");
  if (points.length) url.searchParams.set("waypoints", points.join("|"));
  return url.toString();
}

function phoneHref(phone) {
  return `tel:${String(phone || "").replace(/[^+\d]/gu, "")}`;
}

function windowLabel(stop) {
  return stop.appointmentType === "exact" ? `Exact appointment · ${stop.exactTime || stop.eta}` : `Arrival window · ${stop.window}`;
}

function completedStorageKey(token) {
  let hash = 2166136261;
  for (let index = 0; index < token.length; index += 1) {
    hash ^= token.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `ew-survey-route:${(hash >>> 0).toString(36)}`;
}

function loadCompleted() {
  try {
    const saved = JSON.parse(localStorage.getItem(completionKey) || "[]");
    completed = new Set(Array.isArray(saved) ? saved.map(Number) : []);
  } catch {
    completed = new Set();
  }
}

function saveCompleted() {
  localStorage.setItem(completionKey, JSON.stringify([...completed]));
}

function actionLinks(stop, { prominent = false } = {}) {
  return `<div class="stop-links ${prominent ? "prominent" : ""}">
    <a class="action navigate" href="${escapeHtml(googleDestination(stop.location))}" target="_blank" rel="noopener"><span aria-hidden="true">↗</span> Navigate</a>
    ${stop.phone ? `<a class="action call" href="${escapeHtml(phoneHref(stop.phone))}"><span aria-hidden="true">☎</span> Call</a>` : ""}
  </div>`;
}

function nextStopCard() {
  const next = route.stops.find((stop) => !completed.has(Number(stop.order)));
  if (!next) {
    return `<section class="next-card complete-card">
      <span class="eyebrow">ROUTE COMPLETE</span>
      <div class="complete-tick" aria-hidden="true">✓</div>
      <h1>That’s the day done.</h1>
      <p>Every survey on this route is marked complete.</p>
    </section>`;
  }
  return `<section class="next-card">
    <div class="next-kicker"><span>NEXT SURVEY</span><span>${escapeHtml(next.order)} OF ${route.stops.length}</span></div>
    <div class="next-time"><span>ETA</span><strong>${escapeHtml(next.eta)}</strong></div>
    <h1>${escapeHtml(next.name)}</h1>
    <p class="next-location">${escapeHtml(next.location)}</p>
    <div class="next-facts"><span>${escapeHtml(windowLabel(next))}</span><span>${escapeHtml(next.durationMinutes)} min survey</span><span>${escapeHtml(next.driveMinutes)} min drive</span></div>
    ${next.notes ? `<p class="next-notes"><strong>Survey note</strong>${escapeHtml(next.notes)}</p>` : ""}
    ${actionLinks(next, { prominent: true })}
  </section>`;
}

function stopCard(stop) {
  const isDone = completed.has(Number(stop.order));
  return `<article class="timeline-item survey ${isDone ? "is-done" : ""}" id="stop-${escapeHtml(stop.order)}">
    <div class="rail"><time>${escapeHtml(stop.eta)}</time><span class="rail-dot">${escapeHtml(stop.order)}</span></div>
    <div class="stop-card">
      <header><div><span class="stop-type">SURVEY ${escapeHtml(stop.order)}</span><h2>${escapeHtml(stop.name)}</h2></div><button class="done-button" type="button" data-complete-stop="${escapeHtml(stop.order)}" aria-pressed="${isDone}">${isDone ? "Completed ✓" : "Mark done"}</button></header>
      <a class="location-link" href="${escapeHtml(googleDestination(stop.location))}" target="_blank" rel="noopener">${escapeHtml(stop.location)} <span aria-hidden="true">↗</span></a>
      <div class="appointment-band"><strong>${escapeHtml(stop.eta)}</strong><span>${escapeHtml(windowLabel(stop))}<br>Finish around ${escapeHtml(stop.surveyEnd)}</span></div>
      <dl class="stop-facts"><div><dt>From previous</dt><dd>${escapeHtml(stop.driveMinutes)} min · ${escapeHtml(stop.driveKm)} km</dd></div><div><dt>Survey time</dt><dd>${escapeHtml(stop.durationMinutes)} minutes</dd></div>${stop.phone ? `<div><dt>Phone</dt><dd><a href="${escapeHtml(phoneHref(stop.phone))}">${escapeHtml(stop.phone)}</a></dd></div>` : ""}${stop.availability ? `<div><dt>Customer availability</dt><dd>${escapeHtml(stop.availability)}</dd></div>` : ""}</dl>
      ${stop.notes ? `<div class="survey-note"><span>NOTES</span><p>${escapeHtml(stop.notes)}</p></div>` : ""}
      ${actionLinks(stop)}
    </div>
  </article>`;
}

function blockCard(block) {
  return `<article class="timeline-item block">
    <div class="rail"><time>${escapeHtml(block.start)}</time><span class="rail-dot">×</span></div>
    <div class="block-card"><span>UNAVAILABLE</span><strong>${escapeHtml(block.label)}</strong><p>${escapeHtml(block.start)}–${escapeHtml(block.end)} · no driving or surveys</p></div>
  </article>`;
}

function timeline() {
  const events = [
    ...route.stops.map((stop) => ({ type: "stop", time: stop.eta, value: stop })),
    ...(route.unavailable || []).map((block) => ({ type: "block", time: block.start, value: block }))
  ].sort((left, right) => left.time.localeCompare(right.time) || (left.type === "block" ? -1 : 1));

  return `<section class="day-section" aria-labelledby="dayPlanTitle">
    <div class="section-heading"><div><span class="eyebrow">FULL ITINERARY</span><h2 id="dayPlanTitle">The day, in order</h2></div><span>${route.stops.length} surveys</span></div>
    <div class="timeline">
      <article class="timeline-item start-item">
        <div class="rail"><time>${escapeHtml(route.start.departure)}</time><span class="rail-dot">S</span></div>
        <div class="start-card"><span>START HERE</span><strong>${escapeHtml(route.start.label)}</strong><p>${escapeHtml(route.start.location)} · earliest departure</p><a href="${escapeHtml(googleDestination(route.start.location))}" target="_blank" rel="noopener">Open start point ↗</a></div>
      </article>
      ${events.map((event) => event.type === "stop" ? stopCard(event.value) : blockCard(event.value)).join("")}
      ${route.finish ? `<article class="timeline-item finish-item"><div class="rail"><time>${escapeHtml(route.finish.eta)}</time><span class="rail-dot">F</span></div><div class="finish-card"><span>FINISH</span><strong>${escapeHtml(route.finish.label)}</strong><p>${escapeHtml(route.finish.location)}${route.finish.requiredBy ? ` · required by ${escapeHtml(route.finish.requiredBy)}` : ""}</p><a href="${escapeHtml(googleDestination(route.finish.location))}" target="_blank" rel="noopener">Navigate ↗</a></div></article>` : ""}
    </div>
  </section>`;
}

function render() {
  const completedCount = route.stops.filter((stop) => completed.has(Number(stop.order))).length;
  const progress = route.stops.length ? Math.round(completedCount / route.stops.length * 100) : 100;
  readerApp.innerHTML = `
    <section class="route-masthead">
      <div><span class="eyebrow">SASHA’S ROUTE</span><h1>${escapeHtml(dateLabel(route.date))}</h1><p>Start ${escapeHtml(route.start.departure)} · finish around ${escapeHtml(route.totals.finishTime || "—")}</p></div>
      <a class="full-route-link" href="${escapeHtml(googleFullRoute())}" target="_blank" rel="noopener">Open full route <span aria-hidden="true">↗</span></a>
    </section>
    <section class="progress-card" aria-label="Route progress"><div><strong>${completedCount} / ${route.stops.length}</strong><span>surveys completed</span></div><div class="progress-track" aria-hidden="true"><i style="width:${progress}%"></i></div></section>
    ${nextStopCard()}
    ${timeline()}
    <footer class="route-footer"><span>EW · FIELD OPERATIONS</span><p>${route.generatedAt ? `Route generated ${escapeHtml(generatedLabel(route.generatedAt))}` : "Saved route"}</p>${completedCount ? '<button id="resetProgress" type="button">Reset completed surveys</button>' : ""}</footer>`;

  readerApp.querySelectorAll("[data-complete-stop]").forEach((button) => button.addEventListener("click", () => {
    const order = Number(button.dataset.completeStop);
    if (completed.has(order)) completed.delete(order);
    else completed.add(order);
    saveCompleted();
    render();
    document.getElementById(`stop-${order}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }));
  document.getElementById("resetProgress")?.addEventListener("click", () => {
    completed.clear();
    saveCompleted();
    render();
    scrollTo({ top: 0, behavior: "smooth" });
  });
}

function showError(title, message) {
  loadingState.hidden = true;
  readerApp.hidden = false;
  readerApp.innerHTML = `<section class="empty-route"><span class="broken-route" aria-hidden="true">S—×</span><span class="eyebrow">ROUTE READER</span><h1>${escapeHtml(title)}</h1><p>${escapeHtml(message)}</p><small>Ask the office to calculate the route again and send a new link.</small></section>`;
}

async function initialise() {
  routeToken = routeFromHash();
  if (!routeToken) return showError("No route in this link", "Open the complete link sent by the office.");
  try {
    route = await decodeRoutePayload(routeToken);
    completionKey = completedStorageKey(routeToken);
    loadCompleted();
    loadingState.hidden = true;
    readerApp.hidden = false;
    document.title = `${dateLabel(route.date)} · Sasha’s route`;
    render();
  } catch (error) {
    showError("This route won’t open", error.message);
  }
}

window.addEventListener("hashchange", () => location.reload());
initialise();
