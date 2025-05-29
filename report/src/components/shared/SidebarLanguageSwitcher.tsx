"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, BookOpen, Edit, CheckSquare } from "lucide-react"; 
// SidebarLanguageSwitcher is removed as LanguageSwitcher is now in headers

export interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  disabled?: boolean;
}

export const teacherNavItems: NavItem[] = [
  { href: "/teacher/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/teacher/courses", label: "My Courses", icon: BookOpen }, 
  { href: "/teacher/grades", label: "Enter Grades", icon: Edit },
  { href: "/teacher/attendance", label: "Attendance", icon: CheckSquare },
];

interface TeacherSidebarNavProps {
  isMobile?: boolean;
}

export default function TeacherSidebarNav({ isMobile = false }: TeacherSidebarNavProps) {
  const pathname = usePathname();
  const navItems = teacherNavItems;

  return (
    <nav className={cn("flex flex-col gap-1 px-2 py-4", isMobile ? "" : "md:px-4")}>
      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (pathname.startsWith(item.href) && item.href !== "/teacher/dashboard");

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