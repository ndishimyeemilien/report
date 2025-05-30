
"use client";
import { SchoolRegistrationForm } from "@/components/auth/SchoolRegistrationForm";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { School } from "lucide-react"; // Import an appropriate icon

export default function RegisterSchoolPage() {
  const { t } = useTranslation();
  return (
    <>
      <CardHeader className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
            <School className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">{t('registerSchoolPageTitle')}</CardTitle>
        <CardDescription>
          {t('registerSchoolPageDescription')}
        </CardDescription>
      </CardHeader>
      <SchoolRegistrationForm />
    </>
  );
}
