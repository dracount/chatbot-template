'use client';

import { TelescopeInterface } from '@/components/TelescopeInterface';
import { useParams } from 'next/navigation';

export default function ChatPage() {
  // Use the useParams hook to get the route parameters on the client-side
  const params = useParams();
  
  // The chatId from useParams can be a string or string[], so we handle it.
  const chatId = Array.isArray(params.chatId) ? params.chatId[0] : params.chatId;

  // Render a loading state until the chatId is available
  if (!chatId) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        {/* You can use your Loader2 component here if you like */}
        <p className="text-gray-400">Loading Observation...</p>
      </div>
    );
  }

  // Render your actual TelescopeInterface component
  return <TelescopeInterface chatId={chatId} />;
}