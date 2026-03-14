'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import AdminLayout from './AdminLayout';

interface AdminShellWrapperProps {
  children: ReactNode;
}

export default function AdminShellWrapper({ children }: AdminShellWrapperProps) {
  const pathname = usePathname();

  if (pathname === '/login') {
    return <>{children}</>;
  }

  return <AdminLayout>{children}</AdminLayout>;
}
