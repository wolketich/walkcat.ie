const TOKEN_VERSION = "v1";
const PAYLOAD_KIND = "survey-route";
const MAX_TOKEN_LENGTH = 100_000;

function text(value) {
  return String(value ?? "");
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Creates the public snapshot. Internal IDs, Monday metadata and planner state
 * are deliberately not part of this object.
 */
export function createRoutePayload({ plan, result, generatedAt = new Date().toISOString() }) {
  if (!plan || result?.status !== "feasible" || !Array.isArray(result.schedule)) {
    throw new Error("A feasible calculated route is required.");
  }

  const payload = {
    v: 1,
    kind: PAYLOAD_KIND,
    date: text(plan.date),
    surveyor: "Sasha",
    generatedAt: text(generatedAt),
    start: {
      label: text(plan.startLabel || "Starting point"),
      location: text(plan.startLocation),
      departure: text(plan.dayStart)
    },
    stops: result.schedule.map((stop, index) => ({
      order: index + 1,
      name: text(stop.name || `Survey ${index + 1}`),
      location: text(stop.eircode),
      phone: text(stop.phone),
      availability: text(stop.availability),
      eta: text(stop.eta),
      window: text(stop.window),
      windowStart: text(stop.windowStart),
      windowEnd: text(stop.windowEnd),
      appointmentType: stop.appointmentType === "exact" ? "exact" : "window",
      exactTime: text(stop.exactTime),
      surveyEnd: text(stop.surveyEnd),
      durationMinutes: number(stop.durationMinutes),
      driveMinutes: number(stop.legMinutes),
      driveKm: number(stop.legKm),
      notes: text(stop.notes)
    })),
    unavailable: [...(plan.unavailability || [])]
      .sort((left, right) => text(left.start).localeCompare(text(right.start)))
      .map((block) => ({ label: text(block.label || "Unavailable"), start: text(block.start), end: text(block.end) })),
    finish: plan.finishMode === "last_survey" ? null : {
      label: text(plan.finishLabel || "Required finish"),
      location: text(plan.finishLocation),
      eta: text(result.finishTime),
      requiredBy: plan.finishMode === "commitment" ? text(plan.finishBy) : ""
    },
    totals: {
      surveys: result.schedule.length,
      drivingMinutes: number(result.travelMinutes),
      distanceKm: number(result.distanceKm),
      finishTime: text(result.finishTime)
    }
  };

  return validateRoutePayload(payload);
}

export async function encodeRoutePayload(payload) {
  const normalized = validateRoutePayload(payload);
  const bytes = new TextEncoder().encode(JSON.stringify(normalized));
  if (typeof CompressionStream === "function") {
    const compressed = await transformBytes(bytes, new CompressionStream("gzip"));
    return `${TOKEN_VERSION}.g.${toBase64Url(compressed)}`;
  }
  return `${TOKEN_VERSION}.j.${toBase64Url(bytes)}`;
}

export async function decodeRoutePayload(token) {
  const value = text(token).trim();
  if (!value || value.length > MAX_TOKEN_LENGTH) throw new Error("This route link is incomplete.");
  const [version, format, encoded, ...extra] = value.split(".");
  if (version !== TOKEN_VERSION || !encoded || extra.length) throw new Error("This route link is not supported.");

  let bytes = fromBase64Url(encoded);
  if (format === "g") {
    if (typeof DecompressionStream !== "function") throw new Error("This device cannot open compressed route links.");
    try {
      bytes = await transformBytes(bytes, new DecompressionStream("gzip"));
    } catch {
      throw new Error("This route link is incomplete.");
    }
  } else if (format !== "j") {
    throw new Error("This route link is not supported.");
  }

  try {
    return validateRoutePayload(JSON.parse(new TextDecoder().decode(bytes)));
  } catch (error) {
    if (/route link|route format/i.test(error.message)) throw error;
    throw new Error("This route link is incomplete.");
  }
}

export function validateRoutePayload(payload) {
  if (!payload || typeof payload !== "object" || payload.kind !== PAYLOAD_KIND || payload.v !== 1) {
    throw new Error("This route format is not supported.");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text(payload.date)) || !payload.start || !Array.isArray(payload.stops)) {
    throw new Error("This route link is incomplete.");
  }
  if (payload.stops.length > 20 || !payload.stops.every((stop) => stop && typeof stop === "object" && text(stop.name) && text(stop.eta))) {
    throw new Error("This route link is incomplete.");
  }
  payload.unavailable ||= [];
  payload.totals ||= { surveys: payload.stops.length, drivingMinutes: 0, distanceKm: 0, finishTime: "" };
  return payload;
}

async function transformBytes(bytes, transform) {
  const stream = new Blob([bytes]).stream().pipeThrough(transform);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function toBase64Url(bytes) {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

function fromBase64Url(value) {
  if (!/^[A-Za-z0-9_-]+$/u.test(value)) throw new Error("This route link is incomplete.");
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  try {
    const binary = atob(base64);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    throw new Error("This route link is incomplete.");
  }
}
