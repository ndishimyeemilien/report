import { LoginForm } from "@/components/auth/LoginForm";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";

export default function LoginPage() {
  return (
    <>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Admin Login</CardTitle>
        <CardDescription>
          Enter your credentials to access the admin panel.
        </CardDescription>
      </CardHeader>
      <LoginForm />
      <p className="mt-4 px-8 text-center text-sm text-muted-foreground">
        <Link
          href="/forgot-password"
          className="underline underline-offset-4 hover:text-primary"
        >
          Forgot password?
        </Link>
      </p>
    </>
  );
}
