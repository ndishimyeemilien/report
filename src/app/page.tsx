
"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const { currentUser, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (currentUser && userProfile) {
        if (userProfile.role === 'Admin') {
          router.replace("/admin/dashboard");
        } else if (userProfile.role === 'Teacher') {
          router.replace("/teacher/dashboard");
        } else {
          // Fallback or unhandled role
          router.replace("/login");
        }
      } else {
        router.replace("/login");
      }
    }
  }, [currentUser, userProfile, loading, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
      <p className="ml-4 text-xl text-muted-foreground">Loading Report-Manager Lite...</p>
    </div>
  );
}
