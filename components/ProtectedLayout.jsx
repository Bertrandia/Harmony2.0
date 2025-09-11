"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../app/context/AuthContext';
import { Sidebar } from './sidebar';
 

export default function ProtectedLayout({ children }) {
 
const { currentUser, authLoading } = useAuth();
  const router = useRouter();
 
  useEffect(() => {
    if (!authLoading && !currentUser) {
     
     
          router.replace('/');
      
    }
  }, [currentUser, authLoading]);
 
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
     
        <div className="w-16 h-16 rounded-full bg-gray-300 dark:bg-gray-700 animate-pulse" />
      </div>
    );
  }
 
  if (!currentUser) return null;
 
  return <Sidebar>{children}</Sidebar>;
}