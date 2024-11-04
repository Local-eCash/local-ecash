'use client';

import { SessionProvider } from 'next-auth/react';

export function TelegramAuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
