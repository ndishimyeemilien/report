
"use client";
import AdminHeader from "@/components/layout/AdminHeader";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { AIChatWidget } from "@/components/shared/AIChatWidget"; // Import the AI Chat Widget

export default function AdminLayout({
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
      } else if (userProfile && !(userProfile.role === 'Admin' || userProfile.role === 'Teacher')) {
        // If logged in but not an Admin or Teacher, redirect
        router.push("/login?error=unauthorized"); 
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

  // Ensure user is an Admin or Teacher before rendering the layout
  if (!currentUser || !userProfile || !(userProfile.role === 'Admin' || userProfile.role === 'Teacher')) {
    return null; 
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <AdminSidebar />
      <div className="flex flex-col sm:gap-4 sm:py-4 md:pl-64"> {/* Adjusted padding for sidebar */}
        <AdminHeader />
        <main className="flex-1 gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          {children}
        </main>
      </div>
      <AIChatWidget /> {/* Add the AI Chat Widget here */}
    </div>
  );
}
