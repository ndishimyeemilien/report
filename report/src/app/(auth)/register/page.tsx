
"use client";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

export default function RegisterPage() {
  const { t } = useTranslation();
  return (
    <>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t('registerTitle')}</CardTitle>
        <CardDescription>
          {t('registerDescription')}
        </CardDescription>
      </CardHeader>
      <RegisterForm />
    </>
  );
}
