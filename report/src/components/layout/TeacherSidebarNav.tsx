
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, BookOpen, Edit, CheckSquare } from "lucide-react"; 
import { useTranslation } from "react-i18next";

export interface NavItem {
  href: string;
  labelKey: string; // Changed from label to labelKey
  icon: React.ElementType;
  disabled?: boolean;
}

export const teacherNavItemsData: NavItem[] = [
  { href: "/teacher/dashboard", labelKey: "navTeacherDashboard", icon: LayoutDashboard },
  { href: "/teacher/courses", labelKey: "navTeacherMyCourses", icon: BookOpen }, 
  { href: "/teacher/grades", labelKey: "navTeacherEnterGrades", icon: Edit },
  { href: "/teacher/attendance", labelKey: "navTeacherAttendance", icon: CheckSquare },
];

interface TeacherSidebarNavProps {
  isMobile?: boolean;
}

export default function TeacherSidebarNav({ isMobile = false }: TeacherSidebarNavProps) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const navItems = teacherNavItemsData;

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
            key={item.labelKey} // Use labelKey for key
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
