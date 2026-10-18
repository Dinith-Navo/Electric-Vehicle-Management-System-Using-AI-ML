import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// In-memory session cache for fast synchronous access
let _cachedAccessToken: string | null = null;
let _cachedRefreshToken: string | null = null;
let _cachedUser: any = null;

const ACCESS_TOKEN_KEY = "smartev_access_token";
const REFRESH_TOKEN_KEY = "smartev_refresh_token";
const USER_KEY = "smartev_user_profile";

/**
 * Cross-platform secure token storage.
 * Works seamlessly across Web (localStorage), iOS/Android (AsyncStorage), and in-memory cache.
 */
export const tokenStorage = {
  async saveTokens(accessToken: string, refreshToken?: string, user?: any): Promise<void> {
    _cachedAccessToken = accessToken;
    if (refreshToken) _cachedRefreshToken = refreshToken;
    if (user) _cachedUser = user;

    try {
      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      if (refreshToken) await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      if (user) await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (e) {
      // AsyncStorage write fallback
    }

    if (Platform.OS === "web" && typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        if (refreshToken) window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        if (user) window.localStorage.setItem(USER_KEY, JSON.stringify(user));
      } catch (e) {
        // web storage note
      }
    }
  },

  async saveUser(user: any): Promise<void> {
    _cachedUser = user;
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (e) {
      // AsyncStorage write fallback
    }
    if (Platform.OS === "web" && typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.setItem(USER_KEY, JSON.stringify(user));
      } catch (e) {}
    }
  },

  async getAccessToken(): Promise<string | null> {
    if (_cachedAccessToken) return _cachedAccessToken;

    try {
      const stored = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      if (stored) {
        _cachedAccessToken = stored;
        return stored;
      }
    } catch (e) {
      // AsyncStorage read fallback
    }

    if (Platform.OS === "web" && typeof window !== "undefined" && window.localStorage) {
      try {
        const stored = window.localStorage.getItem(ACCESS_TOKEN_KEY);
        if (stored) {
          _cachedAccessToken = stored;
          return stored;
        }
      } catch (e) {
        // web storage read fallback
      }
    }
    return null;
  },

  async getRefreshToken(): Promise<string | null> {
    if (_cachedRefreshToken) return _cachedRefreshToken;

    try {
      const stored = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      if (stored) {
        _cachedRefreshToken = stored;
        return stored;
      }
    } catch (e) {
      // AsyncStorage read fallback
    }

    if (Platform.OS === "web" && typeof window !== "undefined" && window.localStorage) {
      try {
        const stored = window.localStorage.getItem(REFRESH_TOKEN_KEY);
        if (stored) {
          _cachedRefreshToken = stored;
          return stored;
        }
      } catch (e) {
        // web storage read fallback
      }
    }
    return null;
  },

  async getUser(): Promise<any | null> {
    if (_cachedUser) return _cachedUser;

    try {
      const stored = await AsyncStorage.getItem(USER_KEY);
      if (stored) {
        _cachedUser = JSON.parse(stored);
        return _cachedUser;
      }
    } catch (e) {
      // AsyncStorage read fallback
    }

    if (Platform.OS === "web" && typeof window !== "undefined" && window.localStorage) {
      try {
        const stored = window.localStorage.getItem(USER_KEY);
        if (stored) {
          _cachedUser = JSON.parse(stored);
          return _cachedUser;
        }
      } catch (e) {
        // web storage read fallback
      }
    }
    return null;
  },

  async clearTokens(): Promise<void> {
    _cachedAccessToken = null;
    _cachedRefreshToken = null;
    _cachedUser = null;

    try {
      await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
      await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
    } catch (e) {
      // AsyncStorage clear fallback
    }

    if (Platform.OS === "web" && typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.removeItem(ACCESS_TOKEN_KEY);
        window.localStorage.removeItem(REFRESH_TOKEN_KEY);
        window.localStorage.removeItem(USER_KEY);
      } catch (e) {
        // web storage clear fallback
      }
    }
  },

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAccessToken();
    return !!token;
  },
};

export default tokenStorage;
