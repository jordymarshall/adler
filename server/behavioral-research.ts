import { readFileSync, readdirSync } from "node:fs";
import type { ResearchSource } from "../shared/planning.ts";

const root = new URL("../docs/research/", import.meta.url);
export const behavioralResearch = {
  provenance: { commit: "472e979", date: "2026-09-02", path: "docs/research/behavioural-science-synthesis.md" },
  synthesis: readFileSync(new URL("behavioural-science-synthesis.md", root), "utf8"),
};
const principles = behavioralResearch.synthesis.split(/\n\s*\n/).flatMap(block => {
  const match = block.match(/^\*\*(P\d+)\. (.*?)\*\*/);
  return match ? [{ id: match[1], title: match[2], text: block }] : [];
});
export const principleIds = new Set(principles.map(p => p.id));
export function synthesisSources(): ResearchSource[] {
  return principles.map(p => ({ id: `adler:${p.id}`, title: `${p.id} · ${p.title}`, authors: "Adler behavioural research synthesis", year: "2026",
    url: "https://github.com/jordymarshall/adler/blob/472e979/docs/research/behavioural-science-synthesis.md",
    summary: p.text.replace(/\*\*/g, "").replace(/`/g, ""), kind: "Research synthesis; evidence grade and transfer limits are in the excerpt", access: "method summary", retrievedAt: new Date().toISOString() }));
}
const documentPaths = ["coaching-framework.md", "goal-discovery-frameworks.md", "atomic-habits-and-training-science.md", "accreditation-frameworks.md",
  ...readdirSync(new URL("deep/", root)).filter(name => name.endsWith(".md")).map(name => `deep/${name}`)];
const documents = new Map(documentPaths.map(id => {
  const content = readFileSync(new URL(id, root), "utf8");
  return [id, { id, title: content.split("\n")[0].replace(/^# /, ""), content }];
}));
export const researchLibrary = [...documents.values()].map(({ id, title }) => ({ id, title }));
export function readBehavioralResearch(ids: string[]) {
  return [...new Set(ids)].map(id => {
    const document = documents.get(id);
    if (!document) throw new Error("Choose methodologyRequests only from the supplied researchLibrary IDs.");
    return document;
  });
}
