'use client'
import React from 'react';
import ProtectedLayout from '../../components/ProtectedLayout';
import { LMPatronProvider } from '../context/LmPatronsContext';

export default function MyPatrons({ children }: { children: React.ReactNode }) {
  return (
  <ProtectedLayout>
    <LMPatronProvider>
       {children}
    </LMPatronProvider>
   </ProtectedLayout>
);
}
