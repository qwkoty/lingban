import { useState, useCallback } from 'react';
import { api, getDeviceId, setAuth, clearAuth, getToken } from '../api/client';
import type { User } from '../types';

function getInitialUser(): User | null {
  const token = getToken();
  const userId = localStorage.getItem('lingban:userId');
  const deviceId = getDeviceId();
  if (token && userId) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    return { id: Number(userId), deviceId, token };
  }
  return null;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(getInitialUser);
  const [loading, setLoading] = useState(false);

  const ensureUser = useCallback(async (): Promise<User> => {
    if (user) return user;
    setLoading(true);
    try {
      const deviceId = getDeviceId();
      const res = await api.post('/api/users/anonymous', { deviceId });
      const u: User = res.data.user;
      setAuth(u.token, u.id);
      setUser(u);
      return u;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const logout = useCallback(async () => {
    clearAuth();
    setUser(null);
  }, []);

  return { user, loading, ensureUser, logout };
}
