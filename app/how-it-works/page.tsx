// In app/how-it-works/page.tsx

import { TheMethodPage } from "@/components/TheMethodPage";
import { PublicHeader } from "@/components/public-header";

export default function HowItWorks() {
  return (
    <div>
      <PublicHeader />
      <TheMethodPage />
    </div>
  );
}