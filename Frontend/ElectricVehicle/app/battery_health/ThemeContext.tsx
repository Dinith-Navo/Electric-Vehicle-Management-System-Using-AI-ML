import React, { createContext, useContext, useState } from "react";

type Theme = "dark" | "light";
type StatusBarStyle = "light-content" | "dark-content";

interface ColorScheme {
  bg: string;
  card: string;
  cardBorder: string;
  iconBox: string;
  toggleBg: string;
  title: string;
  subtitle: string;
  featureTitle: string;
  featureDesc: string;
  label: string;
  inputText: string;
  placeholder: string;
  backArrow: string;
  statusBar: StatusBarStyle;
}

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  colors: ColorScheme;
}

const darkColors = {
  bg: "#0a0a1a",
  card: "#16162a",
  cardBorder: "#2a2a4a",
  iconBox: "#1a1a3e",
  toggleBg: "#1a1a2e",
  title: "#ffffff",
  subtitle: "#a0a0c0",
  featureTitle: "#ffffff",
  featureDesc: "#8080a0",
  label: "#d0d0f0",
  inputText: "#ffffff",
  placeholder: "#555570",
  backArrow: "#ffffff",
  statusBar: "light-content" as const,
};

const lightColors = {
  bg: "#f0f2ff",
  card: "#ffffff",
  cardBorder: "#dde0ff",
  iconBox: "#e8e6ff",
  toggleBg: "#e0e0f0",
  title: "#1a1a3e",
  subtitle: "#555577",
  featureTitle: "#1a1a3e",
  featureDesc: "#666688",
  label: "#333355",
  inputText: "#1a1a3e",
  placeholder: "#aaaacc",
  backArrow: "#1a1a3e",
  statusBar: "dark-content" as const,
};

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggleTheme: () => {},
  colors: darkColors,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<Theme>("dark");

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const colors = theme === "dark" ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);