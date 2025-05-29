
"use client";
import { LoginForm } from "@/components/auth/LoginForm";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { useTranslation } from "react-i18next";

export default function LoginPage() {
  const { t } = useTranslation();
  return (
    <>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t('loginTitle')}</CardTitle>
        <CardDescription>
          {t('loginDescription')}
        </CardDescription>
      </CardHeader>
      <LoginForm />
      <p className="mt-4 px-8 text-center text-sm text-muted-foreground">
        <Link
          href="/forgot-password"
          className="underline underline-offset-4 hover:text-primary"
        >
          {t('forgotPasswordLink')}
        </Link>
      </p>
    </>
  );
}
