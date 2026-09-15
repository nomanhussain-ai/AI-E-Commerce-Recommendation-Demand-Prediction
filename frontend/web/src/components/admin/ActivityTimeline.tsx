import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/utils/cn";

export function ActivityTimeline({
  items,
}: {
  items: { title: string; detail: string; time: string; tone: "primary" | "success" | "danger" | "info" }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity timeline</CardTitle>
      </CardHeader>

      <ol className="flex flex-col gap-0 p-5 pt-4">
        {items.map((item, i) => (
          <li key={item.title} className="relative flex gap-3 pb-5 last:pb-0">
            {i < items.length - 1 && (
              <span className="absolute left-[5px] top-3 h-full w-px bg-border" aria-hidden />
            )}
            <span
              className={cn(
                "relative mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-surface",
                item.tone === "primary" && "bg-primary",
                item.tone === "success" && "bg-success",
                item.tone === "danger" && "bg-danger",
                item.tone === "info" && "bg-info",
              )}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="text-sm font-semibold text-foreground">{item.title}</span>
                <span className="text-xs text-muted">{item.time}</span>
              </div>
              <p className="mt-0.5 text-sm text-body">{item.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
