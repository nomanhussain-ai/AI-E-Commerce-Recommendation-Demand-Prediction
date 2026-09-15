"use client";

import { useThemeInit } from "@/hooks/useThemeInit";

/** Renders nothing — just runs `useThemeInit()` from within the (server) root layout. */
export function ThemeInit() {
  useThemeInit();
  return null;
}
