import React from 'react';
import { TopNav } from './TopNav';

interface PageLayoutProps {
  children: React.ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <TopNav />
      <div style={{ flex: 1, height: 0, overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  );
}
