
"use client";
import AdminHeader from "@/components/layout/AdminHeader";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

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
      } else if (userProfile && userProfile.role !== 'Admin') {
        // If logged in but not an Admin, redirect to login or an unauthorized page
        // For simplicity, redirecting to login. A dedicated /unauthorized page would be better.
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

  // Ensure user is an Admin before rendering the layout
  if (!currentUser || !userProfile || userProfile.role !== 'Admin') {
    // This fallback might be hit if useEffect hasn't redirected yet or for edge cases.
    // Returning null prevents rendering the admin layout for non-admins.
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
    </div>
  );
}
