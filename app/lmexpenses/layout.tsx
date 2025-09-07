'use client'
import React from 'react';
import ProtectedLayout from '@/components/ProtectedLayout';


export default function LmExpenesesLayout({ children }: { children: React.ReactNode }) {
  return (
  <ProtectedLayout>
    
       {children}
 
   </ProtectedLayout>
);
}
