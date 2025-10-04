
import type { Metadata } from 'next';
import { Geist_Mono as GeistMono, Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from "@/components/ui/toaster";
import i18n from '@/lib/i18n';
import { Background } from '@/components/shared/Background'; // Import Background

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

const geistMono = GeistMono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Report-Manager Lite',
  description: 'Manage academic reports efficiently.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <Background /> {/* Add Background component */}
          <main className="relative z-10">{children}</main> {/* Ensure main content is above background */}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
