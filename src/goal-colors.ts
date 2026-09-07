// Stable across filters, sorting, and calendar views.
export function goalColor(id: string) {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return `hsl(${hash % 360} 28% 35%)`;
}
