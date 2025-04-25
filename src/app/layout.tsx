import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css'; 
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Particle Detection Dashboard',
  description: 'Monitor and analyze particle detection in real-time',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}