import { getChatHistory, getInsights } from "@/app/actions";
import { DashboardClient } from "@/components/dashboard-client";

export default async function DashboardPage() {
  // Fetch real data from your server actions
  const chatHistory = await getChatHistory();
  const insights = await getInsights();

  return (
    <DashboardClient initialHistory={chatHistory} initialInsights={insights} />
  );
}