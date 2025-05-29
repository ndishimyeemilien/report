
import Logo from "@/components/shared/Logo";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="mb-8 mt-16 text-center">
        <Logo className="text-3xl text-primary" />
      </div>
      <div className="w-full max-w-md rounded-lg bg-card p-8 shadow-xl">
        {children}
      </div>
    </div>
  );
}
