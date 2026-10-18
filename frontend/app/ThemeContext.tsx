import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemePreference = "light" | "dark" | "system";
export type Theme = "light" | "dark";

export interface ThemeColors {
  bg: string; bgSecondary: string; card: string; border: string;
  textPrimary: string; textSecondary: string; textMuted: string;
  iconBtn: string; divider: string; badgeBg: string; badgeText: string;
  sectionLabel: string; statusBar: "dark-content" | "light-content";
}

export const lightColors: ThemeColors = {
  bg: "#F7F8FA", bgSecondary: "#F1EFE8", card: "#ffffff", border: "#e8e8e8",
  textPrimary: "#1a1a1a", textSecondary: "#777777", textMuted: "#aaaaaa",
  iconBtn: "#ffffff", divider: "#e4e4e4", badgeBg: "#F1EFE8",
  badgeText: "#5F5E5A", sectionLabel: "#aaaaaa", statusBar: "dark-content",
};

export const darkColors: ThemeColors = {
  bg: "#0F1117", bgSecondary: "#1A1F2E", card: "#1E2436", border: "#2A3147",
  textPrimary: "#F0F2F8", textSecondary: "#9AA3BF", textMuted: "#5A6380",
  iconBtn: "#1E2436", divider: "#2A3147", badgeBg: "#252D44",
  badgeText: "#8A94B0", sectionLabel: "#5A6380", statusBar: "light-content",
};

const THEME_STORAGE_KEY = "@smartev_theme_preference";

interface ThemeContextType {
  theme: Theme;
  themePreference: ThemePreference;
  colors: ThemeColors;
  toggleTheme: () => void;
  setThemePreference: (pref: ThemePreference) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  themePreference: "system",
  colors: lightColors,
  toggleTheme: () => {},
  setThemePreference: async () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const deviceColorScheme = useColorScheme();
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>("system");

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved === "light" || saved === "dark" || saved === "system") {
          setThemePreferenceState(saved);
        }
      } catch (e) {
        console.warn("Failed to load theme preference", e);
      }
    })();
  }, []);

  const setThemePreference = async (pref: ThemePreference) => {
    setThemePreferenceState(pref);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, pref);
    } catch (e) {
      console.warn("Failed to save theme preference", e);
    }
  };

  const effectiveTheme: Theme =
    themePreference === "system"
      ? deviceColorScheme === "dark"
        ? "dark"
        : "light"
      : themePreference;

  const toggleTheme = () => {
    const nextTheme: ThemePreference = effectiveTheme === "light" ? "dark" : "light";
    setThemePreference(nextTheme);
  };

  const colors = effectiveTheme === "light" ? lightColors : darkColors;

  return (
    <ThemeContext.Provider
      value={{
        theme: effectiveTheme,
        themePreference,
        colors,
        toggleTheme,
        setThemePreference,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);