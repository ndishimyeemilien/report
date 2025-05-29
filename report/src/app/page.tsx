
"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2, LogIn, Info, FileText, Users, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Logo from "@/components/shared/Logo";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import { useTranslation } from "react-i18next";

export default function HomePage() {
  const { currentUser, userProfile, loading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    if (!loading) {
      if (currentUser && userProfile) {
        if (userProfile.role === 'Admin') {
          router.replace("/admin/dashboard");
        } else if (userProfile.role === 'Teacher') {
          router.replace("/teacher/dashboard");
        } else if (userProfile.role === 'Secretary') {
          router.replace("/secretary/dashboard");
        } else {
          // Fallback or unhandled role
          router.replace("/login"); 
        }
      }
      // If not loading and not authenticated, the public homepage content will be rendered below.
    }
  }, [currentUser, userProfile, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-4 text-xl text-muted-foreground">{t('loadingApp', 'Loading Report-Manager Lite...')}</p>
      </div>
    );
  }

  // Only render public homepage if not loading and not authenticated
  if (!currentUser) {
    return (
      <div className="flex min-h-screen flex-col items-center bg-gradient-to-br from-secondary to-background text-foreground">
        <header className="w-full p-4 shadow-md bg-card sticky top-0 z-50">
          <div className="container mx-auto flex justify-between items-center">
            <Logo />
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <Button asChild variant="outline">
                <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4" /> {t('loginButton', 'Login')}
                </Link>
              </Button>
            </div>
          </div>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center p-6 text-center mt-16 mb-8"> {/* Added margin top/bottom */}
          <FileText className="h-20 w-20 text-primary mb-6" data-ai-hint="document report"/>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-primary">
            {t('homePageTitle', 'Report-Manager Lite')}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-8">
            {t('homePagePurpose', 'Efficiently manage student grades, generate reports, and streamline school administration.')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl w-full">
            <div className="bg-card p-6 rounded-lg shadow-md">
              <Users className="h-10 w-10 text-accent mx-auto mb-3" data-ai-hint="users group" />
              <h3 className="text-xl font-semibold mb-2">{t('homePageFeature1Title', 'User Roles')}</h3>
              <p className="text-sm text-muted-foreground">{t('homePageFeature1Desc', 'Dedicated dashboards for Admins, Teachers, and Secretaries.')}</p>
            </div>
            <div className="bg-card p-6 rounded-lg shadow-md">
              <CheckCircle className="h-10 w-10 text-accent mx-auto mb-3" data-ai-hint="checkmark success" />
              <h3 className="text-xl font-semibold mb-2">{t('homePageFeature2Title', 'Grade Management')}</h3>
              <p className="text-sm text-muted-foreground">{t('homePageFeature2Desc', 'Easy grade entry, automated calculations, and detailed report cards.')}</p>
            </div>
            <div className="bg-card p-6 rounded-lg shadow-md">
              <FileText className="h-10 w-10 text-accent mx-auto mb-3" data-ai-hint="document list" />
              <h3 className="text-xl font-semibold mb-2">{t('homePageFeature3Title', 'Comprehensive Reporting')}</h3>
              <p className="text-sm text-muted-foreground">{t('homePageFeature3Desc', 'Generate student, class, and subject performance reports.')}</p>
            </div>
          </div>

          <div className="flex gap-4">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/login">
                <LogIn className="mr-2 h-5 w-5" /> {t('getStartedButton', 'Get Started / Login')}
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/feedback">
                <Info className="mr-2 h-5 w-5" /> {t('learnMoreButton', 'Learn More / Feedback')}
              </Link>
            </Button>
          </div>
        </main>

        <footer className="w-full p-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Report-Manager Lite. {t('allRightsReserved', 'All rights reserved.')}
        </footer>
      </div>
    );
  }

  // If loading is false, and currentUser is true, redirect is handled by useEffect.
  // This return is a fallback for the brief moment before redirection or if something unexpected happens.
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
      <p className="ml-4 text-xl text-muted-foreground">{t('redirecting', 'Redirecting...')}</p>
    </div>
  );
}
