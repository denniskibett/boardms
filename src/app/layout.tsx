// app/layout.tsx
import { Outfit } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import SyncUserData from '@/components/SyncUserData';
import React from 'react';
import { useSystemSettingsRedux } from '@/hooks/useSystemSettingsRedux';

const outfit = Outfit({
  subsets: ["latin"],
  display: 'swap',
});

export const metadata = {
  title: {
    default: 'BoardMS - Government Meeting Management',
    template: '%s | BoardMS'
  },
  description: 'Government Meeting Management Platform for E-Cabinet System',
  keywords: ['government', 'meeting', 'management', 'cabinet', 'kenya'],
  authors: [{ name: 'Government Digital Services' }],
  creator: 'Government Digital Services',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.className} antialiased`}>
        <Providers>
          <SyncUserData />
          {children}
        </Providers>
      </body>
    </html>
  );
}