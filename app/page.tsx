// In app/page.tsx

import { Homepage } from "@/components/homepage";
import { PublicHeader } from "@/components/public-header";

export default function Home() {
  return (
    <div>
      <PublicHeader />
      <Homepage />
    </div>
  );
}