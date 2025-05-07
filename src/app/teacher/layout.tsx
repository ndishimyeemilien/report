
"use client";
import TeacherHeader from "@/components/layout/TeacherHeader"; 
import TeacherSidebar from "@/components/layout/TeacherSidebar"; 
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function TeacherLayout({
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
      } else if (userProfile && userProfile.role !== 'Teacher' && userProfile.role !== 'Admin') { 
        // Allow Admins to access teacher routes for oversight, or restrict if needed
        router.push("/login?error=unauthorized_teacher"); 
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

  if (!currentUser || !userProfile || (userProfile.role !== 'Teacher' && userProfile.role !== 'Admin')) {
    return null; 
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <TeacherSidebar />
      <div className="flex flex-col sm:gap-4 sm:py-4 md:pl-64">
        <TeacherHeader />
        <main className="flex-1 gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          {children}
        </main>
      </div>
    </div>
  );
}
