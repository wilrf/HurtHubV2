import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useSelector, useDispatch } from "react-redux";

import { uiActions, type RootState } from "@/store";

import type { Theme } from "@/types";

interface ThemeContextValue {
  theme: Theme;
  effectiveTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isDarkMode: boolean;
  isMidnightMode: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const dispatch = useDispatch();
  const theme = useSelector((state: RootState) => state.ui.theme);

  // Determine effective theme based on system preference
  const getEffectiveTheme = (): "light" | "dark" => {
    if (theme === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return theme === "dark" ? "dark" : "light";
  };

  const effectiveTheme = getEffectiveTheme();
  const isDarkMode = effectiveTheme === "dark";
  const isMidnightMode = isDarkMode; // In our case, dark mode IS midnight mode

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;

    // Remove previous theme classes
    root.classList.remove("light", "dark");
    root.removeAttribute("data-theme");

    // Apply new theme
    root.classList.add(effectiveTheme);
    root.setAttribute("data-theme", effectiveTheme);

    // Update meta theme color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        "content",
        effectiveTheme === "dark" ? "#000000" : "#ffffff",
      );
    }
  }, [effectiveTheme]);

  // Listen for system theme changes when using 'system' theme
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      // Force re-render by updating a dummy state if needed
      // The useEffect above will handle the actual theme application
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    dispatch(uiActions.setTheme(newTheme));
  };

  const toggleTheme = () => {
    dispatch(uiActions.toggleTheme());
  };

  const value: ThemeContextValue = {
    theme,
    effectiveTheme,
    setTheme,
    toggleTheme,
    isDarkMode,
    isMidnightMode,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// Hook to use theme context
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}

// Hook for theme-aware styles
export function useThemeStyles() {
  const { effectiveTheme, isDarkMode, isMidnightMode } = useTheme();

  return {
    effectiveTheme,
    isDarkMode,
    isMidnightMode,

    // Predefined style objects for common use cases
    cardStyle: isDarkMode ? "midnight" : "default",
    buttonStyle: isDarkMode ? "glass" : "default",
    inputStyle: isDarkMode ? "midnight" : "default",

    // CSS classes
    backgroundClass: isDarkMode
      ? "bg-midnight-950 text-white"
      : "bg-white text-midnight-950",
    cardClass: isDarkMode
      ? "bg-midnight-900 border-midnight-700"
      : "bg-white border-gray-200",
    textClass: isDarkMode ? "text-white" : "text-midnight-950",
    mutedTextClass: isDarkMode ? "text-midnight-400" : "text-gray-600",
  };
}

// Hook for theme transitions
export function useThemeTransition() {
  const { setTheme } = useTheme();

  const transitionToTheme = (newTheme: Theme) => {
    // Add transition class to body
    document.body.classList.add("theme-transition");

    // Set new theme
    setTheme(newTheme);

    // Remove transition class after animation
    setTimeout(() => {
      document.body.classList.remove("theme-transition");
    }, 300);
  };

  return { transitionToTheme };
}
