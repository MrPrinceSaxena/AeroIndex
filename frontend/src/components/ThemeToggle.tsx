import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-apix-border bg-apix-surface text-apix-text-soft shadow-sm hover:bg-apix-surface-alt hover:text-apix-text transition-colors"
      aria-label="Toggle theme"
    >
      <Moon className="h-[1.125rem] w-[1.125rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Sun className="absolute h-[1.125rem] w-[1.125rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
