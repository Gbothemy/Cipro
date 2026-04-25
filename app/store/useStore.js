'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const defaultUser = {
  username: 'Player123',
  userId: 'USR-98765',
  avatar: '👤',
  email: '',
  isAdmin: false,
  balance: { sol: 0, eth: 0, usdt: 0, usdc: 0 },
  points: 0,
  vipLevel: 1,
  exp: 0,
  maxExp: 1000,
  giftPoints: 0,
  completedTasks: 0,
  dayStreak: 0,
  lastClaim: null,
  totalEarnings: { sol: 0, eth: 0, usdt: 0, usdc: 0 },
};

const useStore = create(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: defaultUser,
      notifications: [],

      login: (userData) => set({
        isAuthenticated: true,
        user: { ...defaultUser, ...userData },
      }),

      logout: () => set({
        isAuthenticated: false,
        user: defaultUser,
        notifications: [],
      }),

      updateUser: (updates) => set((state) => ({
        user: { ...state.user, ...updates },
      })),

      addPoints: (points) => set((state) => ({
        user: { ...state.user, points: (state.user.points || 0) + points },
      })),

      addNotification: (notification) => set((state) => ({
        notifications: [
          { id: Date.now(), ...notification, timestamp: new Date().toISOString() },
          ...state.notifications,
        ].slice(0, 50),
      })),

      markNotificationRead: (id) => set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
      })),

      clearNotifications: () => set({ notifications: [] }),
    }),
    {
      name: 'cipro-auth',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    }
  )
);

export default useStore;
