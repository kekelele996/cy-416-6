import { create } from 'zustand';
import { PAGE_MESSAGES } from '@/constants/messages';
import { getCurrentUser, getUsers, loginAsUser, updateUserProfile } from '@/api/userApi';
import type { User, UserProfilePatch } from '@/models/user';
import { UserRole } from '@/models/user';
import { roomflowMessage } from '@/utils/message';

interface AuthState {
  users: User[];
  currentUser?: User;
  loading: boolean;
  initialized: boolean;
  initialize: () => Promise<void>;
  login: (userId: string) => Promise<void>;
  updateProfile: (patch: UserProfilePatch) => Promise<void>;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  users: [],
  loading: false,
  initialized: false,
  async initialize() {
    set({ loading: true });
    try {
      const [users, currentUser] = await Promise.all([getUsers(), getCurrentUser()]);
      set({ users, currentUser, initialized: true });
    } catch (error) {
      roomflowMessage.error(error instanceof Error ? error.message : PAGE_MESSAGES.adminOnly);
    } finally {
      set({ loading: false });
    }
  },
  async login(userId) {
    set({ loading: true });
    try {
      const currentUser = await loginAsUser(userId);
      set({ currentUser });
      roomflowMessage.success(`已切换为 ${currentUser.name}`);
    } finally {
      set({ loading: false });
    }
  },
  async updateProfile(patch) {
    const currentUser = get().currentUser;
    if (!currentUser) {
      return;
    }
    const nextUser = await updateUserProfile(currentUser.id, patch);
    set((state) => ({
      currentUser: nextUser,
      users: state.users.map((user) => (user.id === nextUser.id ? nextUser : user)),
    }));
    roomflowMessage.success('用户资料已更新');
  },
  isAdmin() {
    return get().currentUser?.role === UserRole.ADMIN;
  },
}));
