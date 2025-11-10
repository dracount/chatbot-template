'use client';

import { TelescopeInterface } from '@/components/TelescopeInterface';

// This is a standard client component that accepts a 'chatId' prop.
export default function ChatClientWrapper({ chatId }: { chatId: string }) {
  return (
    <div className="h-full w-full">
      <TelescopeInterface chatId={chatId} />
    </div>
  );
}