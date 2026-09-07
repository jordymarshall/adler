import test from "node:test";
import assert from "node:assert/strict";
import { validateBehavioralReasoning } from "../server/behavioral-methodology.ts";
import { behavioralResearch, principleIds, readBehavioralResearch, synthesisSources } from "../server/behavioral-research.ts";
import { METHODS } from "../src/methods.ts";
import { adaptiveFixture } from "./adaptive-fixture.ts";

const evidence = () => ({ enabledMethods: METHODS.map(m => m.id), reportedSourceIds: new Set(["report"]), researchSourceIds: new Set(["method:implementation", ...synthesisSources().map(s => s.id)]) });
test("the full recovered synthesis and supporting inference research are available without arbitrary file access", () => {
  assert.equal(principleIds.size, 36);
  assert.equal(behavioralResearch.provenance.commit, "472e979");
  assert.match(behavioralResearch.synthesis, /No per-user model before/);
  const [reading] = readBehavioralResearch(["deep/idiographic-inference.md"]);
  assert.match(reading.content, /weekly one-change n-of-1/);
  assert.throws(() => readBehavioralResearch(["../../.env"]), /researchLibrary/);
});

test("a recommendation must trace a real synthesis principle and framework to a sourced or explicitly unknown barrier", () => {
  const reasoning = adaptiveFixture().reasoning!;
  assert.doesNotThrow(() => validateBehavioralReasoning(reasoning, evidence()));
  assert.throws(() => validateBehavioralReasoning(undefined, evidence()), /needs reasoning/);
  assert.throws(() => validateBehavioralReasoning({ ...reasoning, principleIds: ["P99"] }, evidence()), /actual synthesis/);
  assert.throws(() => validateBehavioralReasoning({ ...reasoning, researchSourceIds: ["method:implementation"] }, evidence()), /adler:P/);
  assert.throws(() => validateBehavioralReasoning({ ...reasoning, methodId: "random-scientific-method" }, evidence()), /real, enabled method/);
  assert.throws(() => validateBehavioralReasoning({ ...reasoning, barrier: { ...reasoning.barrier, status: "reported", sourceIds: ["calendar-booking"] } }, evidence()), /user reports/);
  assert.throws(() => validateBehavioralReasoning(reasoning, { ...evidence(), enabledMethods: ["monitoring"] }), /enabled method/);
  assert.throws(() => validateBehavioralReasoning({ ...reasoning, barrier: { ...reasoning.barrier, domain: "motivation" } }, { ...evidence(), enabledMethods: ["implementation"] }), /COM-B is disabled/);
});
