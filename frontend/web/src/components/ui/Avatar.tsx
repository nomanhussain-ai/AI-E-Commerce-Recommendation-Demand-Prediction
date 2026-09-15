import { cn } from "@/utils/cn";

const PALETTE = [
  "bg-primary-soft text-primary-hover",
  "bg-success-soft text-success",
  "bg-warning-soft text-warning",
  "bg-info-soft text-info",
  "bg-danger-soft text-danger",
];

function toneFor(seed: string) {
  const code = seed.charCodeAt(0) || 0;
  return PALETTE[code % PALETTE.length];
}

export function Avatar({
  name,
  imageUrl,
  size = 36,
  status,
  className,
}: {
  name: string;
  imageUrl?: string | null;
  size?: number;
  /** Small status dot in the bottom-right corner, e.g. "online". */
  status?: "online" | "offline";
  className?: string;
}) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      <span
        className={cn(
          "inline-flex h-full w-full items-center justify-center rounded-full font-semibold",
          toneFor(name),
          className,
        )}
        style={{ fontSize: size * 0.4 }}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- user-provided S3 image URL
          <img src={imageUrl} alt="" className="h-full w-full rounded-full object-cover" />
        ) : (
          initials
        )}
      </span>
      {status && (
        <span
          className={cn(
            "absolute rounded-full ring-2 ring-surface",
            status === "online" ? "bg-success" : "bg-muted",
          )}
          style={{
            width: Math.max(size * 0.28, 8),
            height: Math.max(size * 0.28, 8),
            right: -1,
            bottom: -1,
          }}
        />
      )}
    </span>
  );
}
