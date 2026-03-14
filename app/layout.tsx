import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import ThemeProvider from '../src/providers/ThemeProvider';
import QueryProvider from '../src/providers/QueryProvider';
import AdminShellWrapper from '../src/components/admin/AdminShellWrapper';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Gradska Liga',
  description: 'Gradska fudbalska liga',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          <QueryProvider>
            <AdminShellWrapper>{children}</AdminShellWrapper>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
