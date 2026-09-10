import { decodeRoutePayload } from "./route-codec.mjs";

const loadingState = document.getElementById("loadingState");
const readerApp = document.getElementById("readerApp");
let route = null;
let routeToken = "";
let completionKey = "";
let completed = new Set();
let carouselOrder = null;
let pendingCompletionOrder = null;

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

function stopDestination(stop) {
  const houseNumber = String(stop?.houseNumber || "").trim();
  let address = String(stop?.address || "").trim();
  if (houseNumber && !address.toLocaleLowerCase("en-IE").startsWith(houseNumber.toLocaleLowerCase("en-IE"))) {
    address = `${houseNumber} ${address}`.trim();
  }
  const eircode = String(stop?.location || "").trim();
  const compactAddress = address.replace(/\s/g, "").toLocaleLowerCase("en-IE");
  const compactEircode = eircode.replace(/\s/g, "").toLocaleLowerCase("en-IE");
  return [address, compactEircode && !compactAddress.includes(compactEircode) ? eircode : ""].filter(Boolean).join(", ") || eircode;
}

function googleFullRoute() {
  const points = [route.start.location, ...route.stops.map(stopDestination)];
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
    <a class="action navigate" href="${escapeHtml(googleDestination(stopDestination(stop)))}" target="_blank" rel="noopener"><span aria-hidden="true">↗</span> Navigate</a>
    ${stop.phone ? `<a class="action call" href="${escapeHtml(phoneHref(stop.phone))}"><span aria-hidden="true">☎</span> Call</a>` : ""}
  </div>`;
}

function surveyCarouselCard(stop) {
  const isDone = completed.has(Number(stop.order));
  return `<article class="next-card ${isDone ? "is-done" : ""}" data-carousel-stop="${escapeHtml(stop.order)}">
    <div class="next-kicker"><span>${isDone ? "COMPLETED" : "NEXT SURVEY"}</span><span>${escapeHtml(stop.order)} OF ${route.stops.length}</span></div>
    <div class="next-time"><span>ETA</span><strong>${escapeHtml(stop.eta)}</strong></div>
    <h1>${escapeHtml(stop.name)}</h1>
    <p class="next-location">${escapeHtml(stopDestination(stop))}</p>
    <div class="next-facts"><span>${escapeHtml(windowLabel(stop))}</span><span>${escapeHtml(stop.durationMinutes)} min survey</span><span>${escapeHtml(stop.driveMinutes)} min drive</span></div>
    ${stop.notes ? `<p class="next-notes"><strong>Survey note</strong>${escapeHtml(stop.notes)}</p>` : ""}
    ${actionLinks(stop, { prominent: true })}
    <button class="next-done-button" type="button" data-complete-stop="${escapeHtml(stop.order)}">${isDone ? "Completed ✓" : "Mark done"}</button>
  </article>`;
}

function surveyCarousel() {
  if (route.stops.every((stop) => completed.has(Number(stop.order)))) {
    return `<section class="next-card complete-card">
      <span class="eyebrow">ROUTE COMPLETE</span>
      <div class="complete-tick" aria-hidden="true">✓</div>
      <h1>That’s the day done.</h1>
      <p>Every survey on this route is marked complete.</p>
    </section>`;
  }
  return `<section class="next-deck" aria-label="Survey cards">
    <div class="next-track" id="nextTrack">${route.stops.map(surveyCarouselCard).join("")}</div>
    <div class="carousel-controls">
      <button type="button" id="previousSurvey" aria-label="Previous survey">←</button>
      <span id="carouselStatus" aria-live="polite">Swipe to browse</span>
      <button type="button" id="nextSurvey" aria-label="Next survey">→</button>
    </div>
  </section>`;
}

function stopCard(stop) {
  const isDone = completed.has(Number(stop.order));
  return `<article class="timeline-item survey ${isDone ? "is-done" : ""}" id="stop-${escapeHtml(stop.order)}">
    <div class="rail"><time>${escapeHtml(stop.eta)}</time><span class="rail-dot">${escapeHtml(stop.order)}</span></div>
    <div class="stop-card">
      <header><div><span class="stop-type">SURVEY ${escapeHtml(stop.order)}</span><h2>${escapeHtml(stop.name)}</h2></div><button class="done-button" type="button" data-complete-stop="${escapeHtml(stop.order)}" aria-pressed="${isDone}">${isDone ? "Completed ✓" : "Mark done"}</button></header>
      <a class="location-link" href="${escapeHtml(googleDestination(stopDestination(stop)))}" target="_blank" rel="noopener">${escapeHtml(stopDestination(stop))} <span aria-hidden="true">↗</span></a>
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

  return `<section class="day-section" aria-label="Survey schedule">
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
    ${surveyCarousel()}
    ${timeline()}
    <footer class="route-footer"><span>Expert Windows · Field operations</span><p>${route.generatedAt ? `Route generated ${escapeHtml(generatedLabel(route.generatedAt))}` : "Saved route"}</p>${completedCount ? '<button id="resetProgress" type="button">Reset completed surveys</button>' : ""}</footer>
    <dialog class="completion-dialog" id="completionDialog" aria-labelledby="completionTitle">
      <form method="dialog">
        <span class="confirmation-mark" aria-hidden="true">✓</span>
        <span class="eyebrow">PLEASE CONFIRM</span>
        <h2 id="completionTitle"></h2>
        <p id="completionMessage"></p>
        <div class="confirmation-actions"><button value="cancel">Cancel</button><button class="confirm-completion" id="confirmCompletion" type="button"></button></div>
      </form>
    </dialog>`;

  readerApp.querySelectorAll("[data-complete-stop]").forEach((button) => button.addEventListener("click", () => openCompletionDialog(Number(button.dataset.completeStop))));
  document.getElementById("confirmCompletion")?.addEventListener("click", confirmCompletion);
  document.getElementById("resetProgress")?.addEventListener("click", () => {
    completed.clear();
    saveCompleted();
    render();
    scrollTo({ top: 0, behavior: "smooth" });
  });
  setupCarousel();
}

function openCompletionDialog(order) {
  const stop = route.stops.find((item) => Number(item.order) === order);
  const dialog = document.getElementById("completionDialog");
  if (!stop || !dialog) return;
  pendingCompletionOrder = order;
  const isDone = completed.has(order);
  document.getElementById("completionTitle").textContent = isDone ? "Reopen this survey?" : "Mark this survey done?";
  document.getElementById("completionMessage").textContent = `${stop.name} · ${stopDestination(stop)}`;
  document.getElementById("confirmCompletion").textContent = isDone ? "Mark not done" : "Yes, mark done";
  dialog.showModal();
}

function confirmCompletion() {
  const order = pendingCompletionOrder;
  if (!Number.isFinite(order)) return;
  if (completed.has(order)) {
    completed.delete(order);
    carouselOrder = order;
  } else {
    completed.add(order);
    carouselOrder = route.stops.find((stop) => !completed.has(Number(stop.order)))?.order || null;
  }
  pendingCompletionOrder = null;
  saveCompleted();
  document.getElementById("completionDialog")?.close();
  render();
}

function setupCarousel() {
  const track = document.getElementById("nextTrack");
  if (!track) return;
  const cards = [...track.querySelectorAll("[data-carousel-stop]")];
  let activeIndex = Math.max(0, cards.findIndex((card) => Number(card.dataset.carouselStop) === Number(carouselOrder || route.stops.find((stop) => !completed.has(Number(stop.order)))?.order)));
  const updateControls = () => {
    carouselOrder = Number(cards[activeIndex]?.dataset.carouselStop || 0) || null;
    const status = document.getElementById("carouselStatus");
    if (status) status.textContent = `Swipe to browse · ${activeIndex + 1} of ${cards.length}`;
    const previous = document.getElementById("previousSurvey");
    const next = document.getElementById("nextSurvey");
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
  document.getElementById("previousSurvey")?.addEventListener("click", () => moveTo(activeIndex - 1));
  document.getElementById("nextSurvey")?.addEventListener("click", () => moveTo(activeIndex + 1));
  requestAnimationFrame(() => moveTo(activeIndex, "auto"));
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
