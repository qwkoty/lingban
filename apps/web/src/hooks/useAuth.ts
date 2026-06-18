import { useState, useEffect, useCallback } from 'react';
import { api, getDeviceId, setAuth, clearAuth, getToken } from '../api/client';
import type { User } from '../types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    const userId = localStorage.getItem('lingban:userId');
    const deviceId = getDeviceId();
    if (token && userId) {
      setUser({ id: Number(userId), deviceId, token });
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    setLoading(false);
  }, []);

  const ensureUser = useCallback(async (): Promise<User> => {
    if (user) return user;
    const deviceId = getDeviceId();
    const res = await api.post('/api/users/anonymous', { deviceId });
    const u: User = res.data.user;
    setAuth(u.token, u.id);
    setUser(u);
    return u;
  }, [user]);

  const logout = useCallback(async () => {
    clearAuth();
    setUser(null);
  }, []);

  return { user, loading, ensureUser, logout };
}
