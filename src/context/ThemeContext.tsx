"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "futuristic";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  privacyMode: boolean;
  togglePrivacyMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark"); // Default to dark for modern feel
  const [privacyMode, setPrivacyMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    }
    const savedPrivacy = localStorage.getItem("privacyMode");
    if (savedPrivacy) {
      setPrivacyMode(savedPrivacy === "true");
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === "dark" || theme === "futuristic") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const togglePrivacyMode = () => {
    setPrivacyMode((prev) => {
      const newValue = !prev;
      localStorage.setItem("privacyMode", String(newValue));
      return newValue;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, privacyMode, togglePrivacyMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
