import { Link } from "react-router-dom";
import type { Data, Message } from "../shared/workspace";
import { referencedText } from "../shared/record-links";

export function CoachMessage({
  data,
  message,
}: {
  data: Data;
  message: Message;
}) {
  const inline = (text: string) =>
    referencedText(data, text, message.references).map((part, index) =>
      part.href ? (
        <Link key={index} to={part.href}>
          {part.text}
        </Link>
      ) : (
        part.text
      ),
    );
  if (message.role === "user") return <p>{inline(message.text)}</p>;
  const blocks: { kind: "paragraph" | "list" | "heading"; lines: string[] }[] =
    [];
  for (const line of message.text.split("\n")) {
    if (!line.trim()) {
      blocks.push({ kind: "paragraph", lines: [] });
      continue;
    }
    const item = line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.+)/);
    const heading = line.match(/^#{1,4}\s+(.+)/);
    const kind = item ? "list" : heading ? "heading" : "paragraph";
    const previous = blocks.at(-1);
    const value = item?.[1] ?? heading?.[1] ?? line;
    if (previous?.kind === kind && kind !== "heading")
      previous.lines.push(value);
    else blocks.push({ kind, lines: [value] });
  }
  return (
    <div className="coach-message-body">
      {blocks
        .filter((block) => block.lines.length)
        .map((block, index) =>
          block.kind === "list" ? (
            <ul key={index}>
              {block.lines.map((line, item) => (
                <li key={item}>{inline(line)}</li>
              ))}
            </ul>
          ) : block.kind === "heading" ? (
            <h4 key={index}>{inline(block.lines[0])}</h4>
          ) : (
            <p key={index}>{inline(block.lines.join("\n"))}</p>
          ),
        )}
    </div>
  );
}
