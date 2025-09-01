'use client'
import React from 'react';
import ProtectedLayout from '../../components/ProtectedLayout';


export default function AddExpenseShotFormLayout({ children }: { children: React.ReactNode }) {
  return (
  <ProtectedLayout>
   
       {children}
   
   </ProtectedLayout>
);
}
