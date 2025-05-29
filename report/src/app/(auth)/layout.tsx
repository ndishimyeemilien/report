
import Logo from "@/components/shared/Logo";
// LanguageSwitcher is removed from here

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary p-4">
      {/* LanguageSwitcher removed from here */}
      <div className="mb-8 mt-16 text-center"> {/* Added mt-16 for spacing if LanguageSwitcher was at top */}
        <Logo className="text-3xl text-primary" />
      </div>
      <div className="w-full max-w-md rounded-lg bg-card p-8 shadow-xl">
        {children}
      </div>
    </div>
  );
}
