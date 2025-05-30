
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, BookOpen, UsersRound, Archive, Link2 } from "lucide-react"; 
import { useTranslation } from "react-i18next";

interface NavItem {
  href: string;
  labelKey: string; 
  icon: React.ElementType;
  disabled?: boolean;
}

export const secretaryNavItemsData: NavItem[] = [
  { href: "/secretary/dashboard", labelKey: "navSecretaryDashboard", icon: LayoutDashboard },
  { href: "/secretary/students", labelKey: "navSecretaryStudents", icon: Users },
  { href: "/secretary/classes", labelKey: "navSecretaryClasses", icon: Archive }, 
  { href: "/secretary/courses", labelKey: "navSecretaryCourses", icon: BookOpen },
  { href: "/secretary/class-assignments", labelKey: "navSecretaryClassAssignments", icon: Link2 }, 
  { href: "/secretary/enrollments", labelKey: "navSecretaryStudentEnrollments", icon: UsersRound }, 
];

interface SecretarySidebarNavProps {
  isMobile?: boolean;
}

export default function SecretarySidebarNav({ isMobile = false }: SecretarySidebarNavProps) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const navItems = secretaryNavItemsData;

  return (
    <nav className={cn("flex flex-col gap-1 px-2 py-4", isMobile ? "" : "md:px-4")}>
      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (pathname.startsWith(item.href) && item.href !== "/secretary/dashboard");

        const buttonVariant = isActive ? "default" : "ghost";
        
        const buttonClassName = cn(
          "justify-start w-full",
          isActive
            ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          item.disabled && "cursor-not-allowed opacity-50"
        );

        return (
          <Button
            key={item.labelKey} 
            asChild
            variant={buttonVariant}
            className={buttonClassName}
            disabled={item.disabled}
          >
            <Link href={item.disabled ? "#" : item.href}>
              <item.icon className="mr-3 h-5 w-5" />
              {t(item.labelKey)}
            </Link>
          </Button>
        );
      })}
    </nav>
  );
}
