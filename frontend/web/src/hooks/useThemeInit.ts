"use client";

import { useLayoutEffect } from "react";

/**
 * Applies a previously-chosen theme to `<html>` as early in the client
 * lifecycle as React allows (`useLayoutEffect` fires before the browser
 * paints the current commit). No script tag, no injected raw JS — the
 * `@media (prefers-color-scheme)` rule in globals.css already covers visitors
 * with no explicit choice with zero JS, so this only matters for the case
 * where an explicit choice diverges from the OS preference.
 */
export function useThemeInit() {
  useLayoutEffect(() => {
    try {
      const stored = localStorage.getItem("theme");
      if (stored === "dark" || stored === "light") {
        document.documentElement.setAttribute("data-theme", stored);
      }
    } catch {
      // private browsing / storage blocked — theme just won't persist
    }
  }, []);
}
