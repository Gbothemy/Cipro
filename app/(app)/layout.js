'use client';
import Layout from '../../components/Layout';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useStore from '../store/useStore';

export default function AppLayout({ children }) {
  const { isAuthenticated } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <Layout>{children}</Layout>;
}
