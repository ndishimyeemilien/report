
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, BookOpen, UsersRound, Archive, Link2 } from "lucide-react"; 
import type { NavItem as AdminNavItemType } from "./AdminSidebarNav"; // Reuse NavItem type, but rename to avoid conflict if needed
// SidebarLanguageSwitcher is removed as LanguageSwitcher is now in headers

// Assuming NavItem is defined as:
interface NavItem {
  href: string;
  label: string; // Or labelKey if using i18n
  icon: React.ElementType;
  disabled?: boolean;
}


export const secretaryNavItems: NavItem[] = [
  { href: "/secretary/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/secretary/students", label: "Students", icon: Users },
  { href: "/secretary/classes", label: "Classes", icon: Archive }, 
  { href: "/secretary/courses", label: "Courses", icon: BookOpen },
  { href: "/secretary/class-assignments", label: "Class Assignments", icon: Link2 }, 
  { href: "/secretary/enrollments", label: "Student Enrollments", icon: UsersRound }, 
];

interface SecretarySidebarNavProps {
  isMobile?: boolean;
}

export default function SecretarySidebarNav({ isMobile = false }: SecretarySidebarNavProps) {
  const pathname = usePathname();
  const navItems = secretaryNavItems;

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
            key={item.label}
            asChild
            variant={buttonVariant}
            className={buttonClassName}
            disabled={item.disabled}
          >
            <Link href={item.disabled ? "#" : item.href}>
              <item.icon className="mr-3 h-5 w-5" />
              {item.label}
            </Link>
          </Button>
        );
      })}
      {/* SidebarLanguageSwitcher removed from here */}
    </nav>
  );
}
