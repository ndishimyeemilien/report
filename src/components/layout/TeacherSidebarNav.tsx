
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, BookOpen, ClipboardList, Edit } from "lucide-react"; // Edit for grade entry

export interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  disabled?: boolean;
}

// Teacher specific navigation
export const teacherNavItems: NavItem[] = [
  { href: "/teacher/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/teacher/courses", label: "My Courses", icon: BookOpen }, // To view their assigned courses
  { href: "/teacher/grades", label: "Enter Grades", icon: Edit },
  // Teachers likely won't see full reports or settings like admins
];

interface TeacherSidebarNavProps {
  isMobile?: boolean;
}

export default function TeacherSidebarNav({ isMobile = false }: TeacherSidebarNavProps) {
  const pathname = usePathname();
  const navItems = teacherNavItems;

  return (
    <nav className={cn("flex flex-col gap-2 px-2 py-4", isMobile ? "" : "md:px-4")}>
      {navItems.map((item) => (
        <Button
          key={item.href}
          asChild
          variant={pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/teacher/dashboard") ? "default" : "ghost"}
          className={cn(
            "justify-start w-full",
            (pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/teacher/dashboard"))
              ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            item.disabled && "cursor-not-allowed opacity-50"
          )}
          disabled={item.disabled}
        >
          <Link href={item.disabled ? "#" : item.href}>
            <item.icon className="mr-3 h-5 w-5" />
            {item.label}
          </Link>
        </Button>
      ))}
    </nav>
  );
}
