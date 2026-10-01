import type { Metadata } from 'next';
import { AppProvider } from '@/lib/store/AppContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'SceneWeave — Spatial scene agent prototype',
  description: 'Upload a room image, inspect a demo reconstruction, and direct an AI agent that edits an interactive 3D scene.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#f7f3ed',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className="font-sans antialiased"
        style={{ 
          overscrollBehavior: 'none',
          touchAction: 'manipulation',
        }}
      >
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}