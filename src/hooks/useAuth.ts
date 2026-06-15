import { useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';

export function useAuth() {
  const users = useAuthStore((state) => state.users);
  const currentUser = useAuthStore((state) => state.currentUser);
  const loading = useAuthStore((state) => state.loading);
  const login = useAuthStore((state) => state.login);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const isAdmin = useAuthStore((state) => state.isAdmin);

  return useMemo(
    () => ({
      users,
      currentUser,
      loading,
      login,
      updateProfile,
      isAdmin: isAdmin(),
    }),
    [users, currentUser, loading, login, updateProfile, isAdmin],
  );
}
