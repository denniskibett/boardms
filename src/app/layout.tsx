// app/layout.tsx
import { Outfit } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import SyncUserData from '@/components/SyncUserData';
import React from 'react';
import { getSystemSettingsServer } from '@/lib/server/systemSettings';

const outfit = Outfit({
  subsets: ["latin"],
  display: 'swap',
});

// This makes the layout dynamic because we're fetching data
export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  try {
    // Fetch system settings on the server
    const settings = await getSystemSettingsServer();
    
    return {
      title: {
        default: settings.name,
        template: `${settings.name} | %s`
      },
      description: settings.description || `${settings.name}`,
      keywords: ['government', 'meeting', 'management', 'cabinet', 'kenya'],
      authors: [{ name: 'Government Digital Services' }],
      creator: 'Government Digital Services',
      metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
      icons: {
        icon: settings.favicon || '/favicon.ico',
        shortcut: settings.favicon || '/favicon.ico',
        apple: settings.favicon || '/apple-touch-icon.png',
      },
    };
  } catch (error) {
    console.error('Failed to generate metadata:', error);
    
    // Fallback metadata
    return {
      title: {
        default: 'BoardMS - Government Meeting Management',
        template: '%s | BoardMS'
      },
      description: 'Government Meeting Management System',
      keywords: ['government', 'meeting', 'management', 'cabinet', 'kenya'],
      authors: [{ name: 'Government Digital Services' }],
      creator: 'Government Digital Services',
      metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
    };
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch system settings on the server
  let settings;
  try {
    settings = await getSystemSettingsServer();
  } catch (error) {
    console.error('Failed to fetch system settings:', error);
    // Use fallback settings
    settings = {
      name: 'BoardMS',
      description: 'Government Meeting Management Platform',
      favicon: '/favicon.ico',
      primary_color: '#3b82f6',
      secondary_color: '#1e40af',
      timezone: 'Africa/Nairobi',
      date_format: 'DD/MM/YYYY'
    };
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Dynamic CSS variables based on system settings */}
        <style>{`
          :root {
            --primary-color: ${settings.primary_color};
            --secondary-color: ${settings.secondary_color};
            --brand-50: ${hexToRgba(settings.primary_color, 0.05)};
            --brand-100: ${hexToRgba(settings.primary_color, 0.1)};
            --brand-200: ${hexToRgba(settings.primary_color, 0.2)};
            --brand-300: ${hexToRgba(settings.primary_color, 0.3)};
            --brand-400: ${hexToRgba(settings.primary_color, 0.4)};
            --brand-500: ${settings.primary_color};
            --brand-600: ${darkenColor(settings.primary_color, 0.1)};
            --brand-700: ${darkenColor(settings.primary_color, 0.2)};
            --brand-800: ${darkenColor(settings.primary_color, 0.3)};
            --brand-900: ${darkenColor(settings.primary_color, 0.4)};
            --brand-950: ${darkenColor(settings.primary_color, 0.5)};
          }
        `}</style>
      </head>
      <body className={`${outfit.className} antialiased`}>
        <Providers>
          {/* Pass initial settings to client */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                window.__INITIAL_SYSTEM_SETTINGS__ = ${JSON.stringify(settings)};
              `,
            }}
          />
          {children}
        </Providers>
      </body>
    </html>
  );
}

// Helper functions for color manipulation
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function darkenColor(hex: string, amount: number): string {
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);

  r = Math.max(0, Math.min(255, Math.floor(r * (1 - amount))));
  g = Math.max(0, Math.min(255, Math.floor(g * (1 - amount))));
  b = Math.max(0, Math.min(255, Math.floor(b * (1 - amount))));

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}