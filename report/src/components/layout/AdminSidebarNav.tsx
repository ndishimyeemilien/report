
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, BookOpen, ClipboardList, FileText, Settings, Users, UserCog, Users2, Archive, CalendarClock, Group, MessageSquare } from "lucide-react";
import { useTranslation } from "react-i18next";

export interface NavItem {
  href: string;
  labelKey: string; 
  icon: React.ElementType;
  disabled?: boolean;
}

export const adminNavItemsData: NavItem[] = [
  { href: "/admin/dashboard", labelKey: "navAdminDashboard", icon: LayoutDashboard },
  { href: "/admin/dashboard/courses", labelKey: "navAdminSubjects", icon: BookOpen }, 
  { href: "/admin/dashboard/classes", labelKey: "navAdminClasses", icon: Archive },
  { href: "/admin/dashboard/terms", labelKey: "navAdminTerms", icon: CalendarClock },
  { href: "/admin/dashboard/groups", labelKey: "navAdminGroups", icon: Group }, 
  { href: "/admin/dashboard/grades", labelKey: "navAdminGrades", icon: ClipboardList },
  { href: "/admin/dashboard/reports", labelKey: "navAdminReports", icon: FileText },
  { href: "/admin/dashboard/feedback", labelKey: "navAdminFeedback", icon: MessageSquare },
  { href: "/secretary/students", labelKey: "navAdminStudents", icon: Users }, 
  { href: "/admin/dashboard/teachers", labelKey: "navAdminTeachers", icon: UserCog, disabled: false }, 
  { href: "/admin/dashboard/users", labelKey: "navAdminUsers", icon: Users2 },
  { href: "/admin/settings", labelKey: "navAdminSettings", icon: Settings },
];

interface AdminSidebarNavProps {
  isMobile?: boolean;
}

export default function AdminSidebarNav({ isMobile = false }: AdminSidebarNavProps) {
  const pathname = usePathname();
  const { t } = useTranslation(); 

  const navItems = adminNavItemsData;

  return (
    <nav className={cn("flex flex-col gap-1 px-2 py-4", isMobile ? "" : "md:px-4")}>
      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (pathname.startsWith(item.href) && 
           item.href !== "/admin/dashboard" && 
           item.href !== "/admin/settings" && 
           item.href !== "/secretary/students" && 
           item.href !== "/admin/dashboard/teachers" &&
           item.href !== "/admin/dashboard/users" &&
           item.href !== "/admin/dashboard/terms" && 
           item.href !== "/admin/dashboard/groups" && 
           item.href !== "/admin/dashboard/feedback" &&
           item.href !== "/admin/dashboard/classes" 
          ) ||
          (item.href === "/admin/dashboard" && pathname === "/admin/dashboard") || 
          (item.href === "/admin/settings" && pathname.startsWith("/admin/settings")) ||
          (item.href === "/secretary/students" && pathname.startsWith("/secretary/students")) ||
          (item.href === "/admin/dashboard/teachers" && pathname.startsWith("/admin/dashboard/teachers")) ||
          (item.href === "/admin/dashboard/users" && pathname.startsWith("/admin/dashboard/users")) ||
          (item.href === "/admin/dashboard/terms" && pathname.startsWith("/admin/dashboard/terms")) || 
          (item.href === "/admin/dashboard/groups" && pathname.startsWith("/admin/dashboard/groups")) || 
          (item.href === "/admin/dashboard/feedback" && pathname.startsWith("/admin/dashboard/feedback")) ||
          (item.href === "/admin/dashboard/classes" && pathname.startsWith("/admin/dashboard/classes"));


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
