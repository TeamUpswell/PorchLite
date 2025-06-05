import ProtectedPageWrapper from "@/components/layout/ProtectedPageWrapper";
import PageContainer from "@/components/layout/PageContainer";

export default function UsersPage() {
  return (
    <ProtectedPageWrapper requiredRole="manager">
      <PageContainer className="space-y-6">
        {/* Remove header section and start with content */}
        {/* Your existing users content */}
      </PageContainer>
    </ProtectedPageWrapper>
  );
}