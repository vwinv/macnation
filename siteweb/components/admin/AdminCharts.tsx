function barHeight(value: number, max: number) {
  if (value <= 0) return 0;
  return Math.max(8, Math.round((value / max) * 100));
}

export function VerticalBars({
  items,
  formatTip,
}: {
  items: { label: string; value: number }[];
  formatTip?: (n: number) => string;
}) {
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <div className="flex h-48 items-end gap-1.5">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
          title={formatTip ? formatTip(item.value) : String(item.value)}
        >
          <div className="flex h-36 w-full items-end justify-center">
            <div
              className="w-full max-w-9 rounded-t-md bg-black"
              style={{ height: `${barHeight(item.value, max)}%`, opacity: item.value ? 1 : 0.08 }}
            />
          </div>
          <span className="truncate text-[10px] text-gray-500">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export function GroupedBars({
  items,
  formatTip,
}: {
  items: { label: string; a: number; b: number }[];
  formatTip?: (n: number, kind: "a" | "b") => string;
}) {
  const max = Math.max(1, ...items.flatMap((item) => [item.a, item.b]));
  return (
    <div className="flex h-48 items-end gap-2">
      {items.map((item) => (
        <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
          <div className="flex h-36 w-full items-end justify-center gap-0.5">
            <div
              className="w-1/2 max-w-4 rounded-t-md bg-black"
              style={{ height: `${barHeight(item.a, max)}%`, opacity: item.a ? 1 : 0.08 }}
              title={formatTip ? formatTip(item.a, "a") : String(item.a)}
            />
            <div
              className="w-1/2 max-w-4 rounded-t-md bg-[#e0b12c]"
              style={{ height: `${barHeight(item.b, max)}%`, opacity: item.b ? 1 : 0.25 }}
              title={formatTip ? formatTip(item.b, "b") : String(item.b)}
            />
          </div>
          <span className="truncate text-[10px] text-gray-500">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export function HorizontalBars({
  items,
  formatValue,
}: {
  items: { label: string; value: number }[];
  formatValue?: (n: number) => string;
}) {
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.label}>
          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
            <span className="text-gray-500">{item.label}</span>
            <span className="text-black">{formatValue ? formatValue(item.value) : item.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-black/5">
            <div className="h-full rounded-full bg-black" style={{ width: `${Math.round((item.value / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
