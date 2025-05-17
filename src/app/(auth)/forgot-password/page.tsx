import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Forgot Password</CardTitle>
        <CardDescription>
          Enter your email address and we&apos;ll send you a link to reset your
          password.
        </CardDescription>
      </CardHeader>
      <ForgotPasswordForm />
      <p className="mt-4 px-8 text-center text-sm text-muted-foreground">
        Remember your password?{" "}
        <Link
          href="/login"
          className="underline underline-offset-4 hover:text-primary"
        >
          Login here
        </Link>
      </p>
    </>
  );
}
