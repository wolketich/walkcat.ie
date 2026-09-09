import test from "node:test";
import assert from "node:assert/strict";
import { createRoutePayload, decodeRoutePayload, encodeRoutePayload } from "../route-codec.mjs";

function fixture() {
  return {
    plan: {
      id: 99,
      revision: 8,
      date: "2026-09-10",
      startLabel: "Showroom",
      startLocation: "D12 FR82",
      dayStart: "07:00",
      finishMode: "last_survey",
      unavailability: [{ id: "private-id", label: "Lunch", start: "12:30", end: "13:00" }],
      jobs: [{ clientId: "not-public", mondayItemId: "123" }]
    },
    result: {
      status: "feasible",
      finishTime: "09:00",
      travelMinutes: 30,
      distanceKm: 18.4,
      schedule: [{
        jobId: "not-public",
        name: "Mary Joyce",
        eircode: "D12 AB34",
        phone: "087 123 4567",
        availability: "08:00-12:00",
        eta: "08:07",
        window: "08:00–09:00",
        windowStart: "08:00",
        windowEnd: "09:00",
        appointmentType: "window",
        exactTime: "",
        surveyEnd: "08:37",
        durationMinutes: 30,
        legMinutes: 30,
        legKm: 18.4,
        notes: "Ring the bell marked O’Brien"
      }]
    }
  };
}

test("creates a shareable route without planner or Monday IDs", () => {
  const payload = createRoutePayload({ ...fixture(), generatedAt: "2026-09-09T10:00:00.000Z" });
  assert.equal(payload.stops[0].phone, "087 123 4567");
  assert.equal(payload.stops[0].availability, "08:00-12:00");
  assert.equal(payload.stops[0].window, "08:00–09:00");
  assert.equal(payload.unavailable[0].label, "Lunch");
  const serialized = JSON.stringify(payload);
  assert.doesNotMatch(serialized, /mondayItemId|clientId|not-public|private-id/);
});

test("Base64URL route token round-trips unicode customer details", async () => {
  const payload = createRoutePayload({ ...fixture(), generatedAt: "2026-09-09T10:00:00.000Z" });
  const token = await encodeRoutePayload(payload);
  assert.match(token, /^v1\.[gj]\.[A-Za-z0-9_-]+$/);
  assert.ok(token.length < JSON.stringify(payload).length * 2);
  assert.deepEqual(await decodeRoutePayload(token), payload);
});

test("incomplete route token returns a useful reader error", async () => {
  await assert.rejects(() => decodeRoutePayload("v1.g.not-a-complete-payload"), /incomplete/i);
});
