'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { LoginForm } from '@/components/login-form';

export default function LoginPage() {
  const { currentUser, authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && currentUser) {
      // User is already logged in — redirect them
      router.replace('/dashboard'); // or whatever page you want
    }
  }, [authLoading, currentUser]);

  if (authLoading) return null;

  return <LoginForm />;
}
