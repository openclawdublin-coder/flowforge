import './globals.css';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/shared/providers';
import { CommandPalette } from '@/components/shared/command-palette';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className={inter.className}><Providers><CommandPalette />{children}</Providers></body>
    </html>
  );
}
