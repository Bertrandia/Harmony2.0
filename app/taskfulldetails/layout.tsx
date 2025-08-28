'use client'
import React from 'react';
import ProtectedLayout from '@/components/ProtectedLayout';


export default function TaskfullDetailsLayout({ children }: { children: React.ReactNode }) {
  return (
  <ProtectedLayout>
    
       {children}
    
   </ProtectedLayout>
);
}