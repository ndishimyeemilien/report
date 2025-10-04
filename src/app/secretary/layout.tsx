"use client";
import SecretaryHeader from "@/components/layout/SecretaryHeader"; 
import SecretarySidebar from "@/components/layout/SecretarySidebar"; 
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { AIChatWidget } from "@/components/shared/AIChatWidget";

export default function SecretaryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!currentUser) {
        router.push("/login");
      } else if (userProfile && !(userProfile.role === 'Secretary' || userProfile.role === 'Admin' || userProfile.role === 'Teacher')) { 
        // Allow Secretary, Admin, or Teacher (acting as Admin)
        router.push("/login?error=unauthorized_secretary"); 
      }
    }
  }, [currentUser, userProfile, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser || !userProfile || !(userProfile.role === 'Secretary' || userProfile.role === 'Admin' || userProfile.role === 'Teacher')) {
    return null; 
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <SecretarySidebar />
      <div className="flex flex-col sm:gap-4 sm:py-4 md:pl-64"> {/* Adjusted padding for sidebar */}
        <SecretaryHeader />
        <main className="flex-1 gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          {children}
        </main>
      </div>
      <AIChatWidget />
    </div>
  );
}
