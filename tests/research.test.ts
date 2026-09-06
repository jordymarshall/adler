import test from "node:test";
import assert from "node:assert/strict";
import { searchLiterature } from "../server/research.ts";
import { reviewSchedule, zonedTime } from "../shared/journey.ts";
import { initialData } from "../shared/workspace.ts";

test("literature retrieval exposes actual abstracts and identities, and distinguishes failed searches from no matches", async () => {
  const result = await searchLiterature(
    ["monitoring", "unavailable", "no matches"],
    async (input) => {
      const url = new URL(String(input));
      assert(
        ["https://www.ebi.ac.uk", "https://api.crossref.org"].includes(
          url.origin,
        ),
      );
      const query =
        url.searchParams.get("query") ??
        url.searchParams.get("query.bibliographic")!;
      if (query.includes("unavailable"))
        return new Response("", { status: 503 });
      if (url.origin === "https://api.crossref.org")
        return Response.json({ message: { items: [] } });
      return Response.json({
        resultList: {
          result: query.includes("no matches")
            ? []
            : [
                {
                  id: "26479070",
                  source: "MED",
                  title: "Progress monitoring",
                  pubYear: "2016",
                  abstractText:
                    "<h4>Results</h4>Mixed effects across populations.",
                  pubTypeList: { pubType: ["Meta-Analysis"] },
                },
              ],
        },
      });
    },
  );
  assert.equal(result.sources.length, 1);
  assert.equal(result.sources[0].id, "epmc:MED:26479070");
  assert.equal(
    result.sources[0].summary,
    "Results Mixed effects across populations.",
  );
  assert.equal(result.sources[0].access, "abstract");
  assert.deepEqual(result.unavailable, [
    "Europe PMC: unavailable",
    "Crossref: unavailable",
  ]);
  assert.equal(result.queries.length, 3);
});

test("weekly reviews recur after completion and preserve the reviewed period in the user's timezone", () => {
  const data = initialData();
  data.timeZone = "America/Toronto";
  data.review = {
    step: 3,
    note: "A useful week",
    decision: "Keep",
    completedAt: "2026-09-06T21:00:00.000Z",
    periodStart: "2026-08-31",
    periodEnd: "2026-09-06",
  };
  data.reviews = [data.review];
  assert.equal(
    reviewSchedule(data, new Date("2026-09-06T22:00:00Z")).nextDate,
    "2026-09-13",
  );
  const next = reviewSchedule(data, new Date("2026-09-13T13:00:00Z"));
  assert.equal(next.completed, undefined);
  assert.equal(next.current.note, "");
  assert.equal(next.periodStart, "2026-09-07");
  assert.equal(next.due, true);
});

test("calendar wall times use the account timezone and handle skipped and repeated daylight-saving hours", () => {
  assert.equal(
    zonedTime("2026-09-07", "09:00", "America/Toronto")?.toISOString(),
    "2026-09-07T13:00:00.000Z",
  );
  assert.equal(zonedTime("2026-03-08", "02:30", "America/Toronto"), null);
  assert.equal(
    zonedTime("2026-11-01", "01:30", "America/Toronto")?.toISOString(),
    "2026-11-01T05:30:00.000Z",
  );
});
