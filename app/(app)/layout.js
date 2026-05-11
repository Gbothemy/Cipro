'use client';
import Layout from '../../components/Layout';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useStore from '../store/useStore';
import { db } from '../../lib/apiClient';

export default function AppLayout({ children }) {
  const { isAuthenticated, user, updateUser } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  // Validate streak on every app load
  useEffect(() => {
    if (!isAuthenticated || !user?.userId) return;

    const validate = async () => {
      try {
        const result = await db.validateStreak(user.userId);
        if (result.reset) {
          // Streak was broken - update local state
          updateUser({ dayStreak: 0 });
        } else if (result.dayStreak !== user.dayStreak) {
          // Sync streak from DB in case it's out of sync
          updateUser({ dayStreak: result.dayStreak });
        }
      } catch (e) {
        // Silent fail - streak validation is non-critical
      }
    };

    validate();
  }, [isAuthenticated, user?.userId]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <Layout>{children}</Layout>;
}
