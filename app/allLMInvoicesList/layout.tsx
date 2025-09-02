'use client'
import React from 'react';
import ProtectedLayout from '@/components/ProtectedLayout';


export default function AllLMInvoicesLayout({ children }: { children: React.ReactNode }) {
  return (
  <ProtectedLayout>
   
       {children}
   
   </ProtectedLayout>
);
}
