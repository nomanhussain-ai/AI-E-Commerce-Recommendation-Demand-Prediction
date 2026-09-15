import { type ButtonHTMLAttributes } from "react";

import { cn } from "@/utils/cn";

export function IconButton({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-full text-body",
        "transition-colors hover:bg-surface-muted hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}
