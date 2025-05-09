"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, BookOpen, ClipboardList, FileText, Settings } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  disabled?: boolean;
}

// Admin specific navigation
export const adminNavItems: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/dashboard/courses", label: "Subjects", icon: BookOpen }, // Changed from Courses to Subjects
  { href: "/admin/dashboard/grades", label: "Grades", icon: ClipboardList },
  { href: "/admin/dashboard/reports", label: "Reports", icon: FileText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

interface AdminSidebarNavProps {
  isMobile?: boolean;
}

export default function AdminSidebarNav({ isMobile = false }: AdminSidebarNavProps) {
  const pathname = usePathname();
  const navItems = adminNavItems;

  return (
    <nav className={cn("flex flex-col gap-2 px-2 py-4", isMobile ? "" : "md:px-4")}>
      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (pathname.startsWith(item.href) && item.href !== "/admin/dashboard" && item.href !== "/admin/settings") ||
          (item.href === "/admin/settings" && pathname.startsWith("/admin/settings"));

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
            key={item.href}
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
    </nav>
  );
}
