const EIRCODE_PATTERN = /\b(?:[A-Z]\d{2}|D6W)\s?[A-Z0-9]{4}\b/iu;

export function extractEircode(value) {
  const match = String(value || "").toUpperCase().match(EIRCODE_PATTERN);
  if (!match) return "";
  const compact = match[0].replace(/\s/gu, "");
  return `${compact.slice(0, 3)} ${compact.slice(3)}`;
}

export function googleDestinationUrl(value) {
  const eircode = extractEircode(value);
  if (!eircode) return "";
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("destination", eircode);
  url.searchParams.set("travelmode", "driving");
  return url.toString();
}

export function googleRouteUrl({ origin, stops = [], destination = "" }) {
  const values = [origin, ...stops, ...(destination ? [destination] : [])];
  const points = values.map(extractEircode);
  if (points.length < 2 || points.some((point) => !point)) return "";
  const routeOrigin = points.shift();
  const routeDestination = points.pop();
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("origin", routeOrigin);
  url.searchParams.set("destination", routeDestination);
  url.searchParams.set("travelmode", "driving");
  if (points.length) url.searchParams.set("waypoints", points.join("|"));
  return url.toString();
}
