import { Metadata } from "next";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export const metadata: Metadata = {
  title: "Report Cleaning Issue - PorchLite",
  description: "Report a cleaning issue for your property",
};

export default function CleaningIssuesCreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
