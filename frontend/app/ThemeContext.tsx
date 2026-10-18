import React, { createContext, useContext, useState } from "react";

type Theme = "light" | "dark";

interface ThemeColors {
  bg: string; bgSecondary: string; card: string; border: string;
  textPrimary: string; textSecondary: string; textMuted: string;
  iconBtn: string; divider: string; badgeBg: string; badgeText: string;
  sectionLabel: string; statusBar: "dark-content" | "light-content";
}

const lightColors: ThemeColors = {
  bg: "#F7F8FA", bgSecondary: "#F1EFE8", card: "#ffffff", border: "#e8e8e8",
  textPrimary: "#1a1a1a", textSecondary: "#777777", textMuted: "#aaaaaa",
  iconBtn: "#ffffff", divider: "#e4e4e4", badgeBg: "#F1EFE8",
  badgeText: "#5F5E5A", sectionLabel: "#aaaaaa", statusBar: "dark-content",
};

const darkColors: ThemeColors = {
  bg: "#0F1117", bgSecondary: "#1A1F2E", card: "#1E2436", border: "#2A3147",
  textPrimary: "#F0F2F8", textSecondary: "#9AA3BF", textMuted: "#5A6380",
  iconBtn: "#1E2436", divider: "#2A3147", badgeBg: "#252D44",
  badgeText: "#8A94B0", sectionLabel: "#5A6380", statusBar: "light-content",
};

interface ThemeContextType {
  theme: Theme;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light", colors: lightColors, toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));
  return (
    <ThemeContext.Provider value={{ theme, colors: theme === "light" ? lightColors : darkColors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);