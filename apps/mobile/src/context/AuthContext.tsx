import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';

const DEVICE_ID_KEY = '@lingban:deviceId';
const TOKEN_KEY = '@lingban:token';
const USER_ID_KEY = '@lingban:userId';
const API_BASE_KEY = '@lingban:apiBase';

export interface User {
  id: number;
  deviceId: string;
  token: string;
}

interface AuthContextValue {
  user: User | null;
  apiBase: string;
  loading: boolean;
  api: ReturnType<typeof makeClient>;
  setApiBase: (base: string) => Promise<void>;
  ensureUser: () => Promise<User>;
  logout: () => Promise<void>;
}

const defaultApiBase =
  process.env.EXPO_PUBLIC_API_BASE || Constants.expoConfig?.extra?.apiBase || 'http://localhost:3001';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function makeClient(baseURL: string) {
  return axios.create({
    baseURL,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [apiBase, setApiBaseState] = useState(defaultApiBase);
  const [loading, setLoading] = useState(true);
  const client = makeClient(apiBase);

  useEffect(() => {
    (async () => {
      const storedBase = await AsyncStorage.getItem(API_BASE_KEY);
      if (storedBase) setApiBaseState(storedBase);

      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const userId = await AsyncStorage.getItem(USER_ID_KEY);
      const deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);

      if (token && userId && deviceId) {
        setUser({ id: Number(userId), deviceId, token });
        client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      setLoading(false);
    })();
  }, []);

  const setApiBase = async (base: string) => {
    setApiBaseState(base);
    await AsyncStorage.setItem(API_BASE_KEY, base);
    client.defaults.baseURL = base;
  };

  const generateDeviceId = () => {
    return `lb_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  };

  const ensureUser = async (): Promise<User> => {
    if (user) return user;

    let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = generateDeviceId();
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    }

    const res = await client.post('/api/users/anonymous', { deviceId });
    const u: User = res.data.user;

    await AsyncStorage.setItem(TOKEN_KEY, u.token);
    await AsyncStorage.setItem(USER_ID_KEY, String(u.id));
    await AsyncStorage.setItem(DEVICE_ID_KEY, u.deviceId);

    client.defaults.headers.common['Authorization'] = `Bearer ${u.token}`;
    setUser(u);
    return u;
  };

  const logout = async () => {
    await Promise.all([
      AsyncStorage.removeItem(TOKEN_KEY),
      AsyncStorage.removeItem(USER_ID_KEY),
      AsyncStorage.removeItem(DEVICE_ID_KEY),
    ]);
    delete client.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, apiBase, loading, api: client, setApiBase, ensureUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export { API_BASE_KEY };
