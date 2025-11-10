import { PublicHeader } from "@/components/public-header";

export default function UnauthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Wrap the auth pages with the public header for consistent navigation
  return (
    <>
      <PublicHeader />
      <main>{children}</main>
    </>
  );
}