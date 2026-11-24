import test from "node:test";
import assert from "node:assert/strict";
import { capMatches, interleaveByService } from "../src/services/others/searchCap";
import { SEARCH } from "../src/config/plans";

type Row = { id: number; service: number };
const rows = (service: number, count: number, start = 0): Row[] => Array.from({ length: count }, (_, i) => ({ id: start + i, service }));
const cap = (matches: Row[], perService: number = SEARCH.maxPerService) => capMatches(matches, (row) => row.service, perService);

test("search limits are 10 vendors per service, 10 a page", () => {
  assert.equal(SEARCH.maxPerService, 10);
  assert.equal(SEARCH.pageSize, 10);
});

test("small searches are left alone", () => {
  const matches = [...rows(1, 5), ...rows(2, 3, 100)];
  assert.deepEqual(cap(matches), matches);
});

test("each service is cut to its best 10, in order", () => {
  const kept = cap([...rows(1, 50), ...rows(2, 2, 100), ...rows(3, 12, 200)]);
  const ids = (service: number) => kept.filter((row) => row.service === service).map((row) => row.id);
  assert.deepEqual(ids(1), rows(1, 10).map((row) => row.id));
  assert.deepEqual(ids(2), [100, 101]);
  assert.deepEqual(ids(3), rows(3, 10, 200).map((row) => row.id));
  assert.equal(kept.length, 22);
});

test("works when services are interleaved, keeping the original order", () => {
  const matches = Array.from({ length: 30 }, (_, i) => ({ id: i, service: (i % 2) + 1 }));
  const kept = cap(matches);
  assert.equal(kept.length, 20);
  assert.deepEqual(kept.map((row) => row.id), Array.from({ length: 20 }, (_, i) => i));
});

test("the 6 services can never exceed 60 vendors", () => {
  const matches = Array.from({ length: 6 }, (_, service) => rows(service + 1, 40, service * 100)).flat();
  assert.equal(cap(matches).length, 60);
});

test("all-services results are mixed, each service keeping its own ranking", () => {
  const matches = [...rows(6, 4), ...rows(4, 2, 100), ...rows(5, 3, 200)];
  const mixed = interleaveByService(matches, (row) => row.service);
  assert.deepEqual(mixed.map((row) => row.id), [0, 100, 200, 1, 101, 201, 2, 202, 3]);
  assert.deepEqual(interleaveByService([], (row: Row) => row.service), []);
});
