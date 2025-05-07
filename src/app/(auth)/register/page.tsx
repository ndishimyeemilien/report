import { RegisterForm } from "@/components/auth/RegisterForm";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function RegisterPage() {
  return (
    <>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Admin Registration</CardTitle>
        <CardDescription>
          Create a new admin account with the secret code.
        </CardDescription>
      </CardHeader>
      <RegisterForm />
    </>
  );
}
