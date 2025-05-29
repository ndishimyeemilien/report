
"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2, LogIn, Info, FileText, Users, CheckCircle, ShieldCheck, MessageSquare, BarChart2, Send, Camera, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Logo from "@/components/shared/Logo";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  const { currentUser, userProfile, loading } = useAuth();
  const router = useRouter();
  const { t, i18n } = useTranslation();

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
          router.replace("/login"); 
        }
      }
    }
  }, [currentUser, userProfile, loading, router]);

  const keyFeatures = [
    { key: 'featureGradeManagement', icon: CheckCircle },
    { key: 'featureReportCards', icon: FileText },
    { key: 'featureSmsEmail', icon: Send },
    { key: 'featureAttendanceBehavior', icon: ShieldCheck },
    { key: 'featureTeacherStudentReports', icon: BarChart2 },
    { key: 'featureAssignments', icon: Briefcase },
    { key: 'featurePhotosDocuments', icon: Camera },
    { key: 'featureCommunication', icon: MessageSquare },
  ];

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-4 text-xl text-muted-foreground">{t('loadingApp', 'Loading Report-Manager Lite...')}</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex min-h-screen flex-col items-center bg-gradient-to-br from-secondary to-background text-foreground">
        <header className="w-full p-4 shadow-md bg-card sticky top-0 z-50">
          <div className="container mx-auto flex justify-between items-center">
            <Logo />
            <nav className="flex items-center gap-2">
              <LanguageSwitcher />
              <Button asChild variant="outline">
                <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4" /> {t('loginButton', 'Login')}
                </Link>
              </Button>
            </nav>
          </div>
        </header>

        <main className="flex flex-1 flex-col items-center p-6 text-center mt-10 mb-8 container mx-auto">
          <FileText className="h-20 w-20 text-primary mb-6" data-ai-hint="document report"/>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-primary">
            {t('homePageTitle', 'Report-Manager Lite')}
          </h1>
          
          <Card className="w-full max-w-3xl my-8 text-left shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl text-accent">{t('platformGoalTitle', 'Platform Goal')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-foreground leading-relaxed">
                {i18n.language === 'rw' ? t('platformGoalRW') : (i18n.language === 'fr' ? t('platformGoalFR') : t('platformGoalEN'))}
              </p>
            </CardContent>
          </Card>

          <h2 className="text-3xl font-semibold mt-10 mb-6 text-primary">{t('keyFeaturesTitle', 'Key Features')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 max-w-5xl w-full">
            {keyFeatures.map((feature) => (
              <Card key={feature.key} className="bg-card p-6 rounded-lg shadow-md text-left hover:shadow-lg transition-shadow">
                <CardHeader className="p-0 mb-3">
                  <feature.icon className="h-10 w-10 text-accent mx-auto md:mx-0 mb-2" />
                  <CardTitle className="text-xl font-semibold text-primary">{t(feature.key)}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <p className="text-sm text-muted-foreground">{t(`${feature.key}Desc`)}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex gap-4 mt-8">
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

        <footer className="w-full p-4 text-center text-sm text-muted-foreground mt-auto">
          &copy; {new Date().getFullYear()} Report-Manager Lite. {t('allRightsReserved', 'All rights reserved.')}
        </footer>
      </div>
    );
  }

  // This part should ideally not be reached if redirection logic is correct
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
      <p className="ml-4 text-xl text-muted-foreground">{t('redirecting', 'Redirecting...')}</p>
    </div>
  );
}
