"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Dark is the design's ground; light is opt-in and remembered. The html
 * element ships with `dark`, and an inline script in the layout has already
 * removed it before paint if the stored choice is light — so this component
 * only mirrors the class that is actually there.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [dark, setDark] = React.useState(() =>
    typeof document !== "undefined"
      ? document.documentElement.classList.contains("dark")
      : true
  );

  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("jc-theme", next ? "dark" : "light");
    } catch {
      // Private browsing keeps the choice for the session only.
    }
    setDark(next);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className={className}
    >
      {dark ? <Sun aria-hidden /> : <Moon aria-hidden />}
    </Button>
  );
}
