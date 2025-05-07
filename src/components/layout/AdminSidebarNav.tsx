"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, BookOpen, ClipboardList, Users, FileText, Settings } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  disabled?: boolean;
}

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/courses", label: "Courses", icon: BookOpen },
  { href: "/dashboard/grades", label: "Grades", icon: ClipboardList },
  // Add more items as features are built, e.g.:
  // { href: "/dashboard/students", label: "Students", icon: Users, disabled: true },
  // { href: "/dashboard/reports", label: "Reports", icon: FileText, disabled: true },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface AdminSidebarNavProps {
  isMobile?: boolean;
}


export default function AdminSidebarNav({ isMobile = false }: AdminSidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex flex-col gap-2 px-2 py-4", isMobile ? "" : "md:px-4")}>
      {navItems.map((item) => (
        <Button
          key={item.href}
          asChild
          variant={pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/dashboard"  && item.href !== "/settings") || (item.href === "/settings" && pathname.startsWith("/settings")) ? "default" : "ghost"}
          className={cn(
            "justify-start w-full",
            (pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/dashboard" && item.href !== "/settings") || (item.href === "/settings" && pathname.startsWith("/settings")))
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
