import { LoginForm } from "@/components/auth/LoginForm";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

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
    </>
  );
}
