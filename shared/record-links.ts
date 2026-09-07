import type { Data } from "./workspace.ts";

export function recordLink(data: Data, id: string): string | undefined {
  const anchor = `#record-${encodeURIComponent(id)}`;
  if (data.memories.some((m) => m.id === id))
    return `/app/coach/about-you${anchor}`;
  const message = data.messages.find((m) => m.id === id);
  if (message)
    return `/app/coach?${message.conversationId ? `chat=${encodeURIComponent(message.conversationId)}` : `goal=${encodeURIComponent(message.goalId)}`}${anchor}`;
  const action = data.actions.find((a) => a.id === id);
  if (action)
    return `/app/goals/${encodeURIComponent(action.goalId)}/progress${anchor}`;
  const block = data.workBlocks.find((b) => b.id === id);
  if (block) return `/app/calendar?goal=${encodeURIComponent(block.goalId)}`;
  for (const goal of data.goals) {
    if (goal.id === id) return `/app/goals/${encodeURIComponent(id)}`;
    if (
      goal.results.some((r) => r.id === id) ||
      goal.milestones.some((m) => m.id === id) ||
      goal.checkpoints?.some((c) => c.id === id)
    )
      return `/app/goals/${encodeURIComponent(goal.id)}/progress${anchor}`;
  }
  if (data.programs.some((p) => `program-v${p.version}` === id))
    return "/app/settings/coaching";
}

export function referencedText(
  data: Data,
  text: string,
  references: { text: string; recordId: string }[] = [],
) {
  const candidates = [
    ...references,
    ...data.goals.map((g) => ({ text: g.title, recordId: g.id })),
  ]
    .map((r) => ({ ...r, href: recordLink(data, r.recordId) }))
    .filter((r) => r.href && r.text.trim())
    .sort((a, b) => b.text.length - a.text.length);
  const parts: { text: string; href?: string }[] = [];
  let position = 0;
  while (position < text.length) {
    const next = candidates
      .map((r) => ({ ...r, at: text.indexOf(r.text, position) }))
      .filter((r) => r.at >= position)
      .sort((a, b) => a.at - b.at || b.text.length - a.text.length)[0];
    if (!next) {
      parts.push({ text: text.slice(position) });
      break;
    }
    if (next.at > position) parts.push({ text: text.slice(position, next.at) });
    parts.push({ text: next.text, href: next.href });
    position = next.at + next.text.length;
  }
  return parts;
}
