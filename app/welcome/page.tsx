// In app/welcome/page.tsx

import { createChatSession } from "@/app/actions";
import { redirect } from "next/navigation";
import { v4 as uuidv4 } from 'uuid';
import { Loader2 } from "lucide-react";

// This is a Server Component that runs on the server after the user is logged in.
export default async function WelcomePage() {
  console.log("[WelcomePage LOG] Welcome page rendering, starting chat creation.");

  const newChatId = uuidv4();

  // By the time this code runs, the user's session is established.
  const result = await createChatSession(newChatId);

  if (result.success) {
    // If chat is created successfully, redirect to the new chat page.
    console.log("[WelcomePage LOG] Chat created successfully, redirecting to /c/", newChatId);
    redirect(`/c/${newChatId}`);
  } else {
    // If it fails for some reason, redirect to the homepage with an error.
    // This is a safety net.
    console.error("[WelcomePage LOG] Failed to create chat session:", result.error);
    redirect(`/?error=session_setup_failed`);
  }

  // This part will only be visible for a brief moment, or if the redirect is slow.
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-gray-950 text-white">
      <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      <p className="mt-4 text-lg">Preparing your session...</p>
    </div>
  );
}