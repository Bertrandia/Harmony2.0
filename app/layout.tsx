import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from './context/AuthContext';
import { LMPatronProvider } from './context/LmPatronsContext';
import {TaskProvider} from './context/TaskContext'

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Harmony',
  description: 'Modern LM Mangement system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <LMPatronProvider>
            <TaskProvider>
                   {children}
            </TaskProvider>
               
          </LMPatronProvider>
        
        
        </AuthProvider>
      </body>
    </html>
  );
}