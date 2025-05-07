
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, BookOpen, ClipboardList, Users, FileText, Settings, UserPlus } from "lucide-react"; // Added UserPlus for potential user management

export interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  disabled?: boolean;
}

// Admin specific navigation
export const adminNavItems: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/dashboard/courses", label: "Courses", icon: BookOpen },
  { href: "/admin/dashboard/grades", label: "Grades", icon: ClipboardList },
  { href: "/admin/dashboard/reports", label: "Reports", icon: FileText },
  // Example: User Management (could be a future feature)
  // { href: "/admin/users", label: "User Management", icon: UserPlus, disabled: true },
  { href: "/admin/settings", label: "Settings", icon: Settings }, // Adjusted path for admin settings
];

interface AdminSidebarNavProps {
  isMobile?: boolean;
}

export default function AdminSidebarNav({ isMobile = false }: AdminSidebarNavProps) {
  const pathname = usePathname();

  // Use adminNavItems for the admin sidebar
  const navItems = adminNavItems;

  return (
    <nav className={cn("flex flex-col gap-2 px-2 py-4", isMobile ? "" : "md:px-4")}>
      {navItems.map((item) => (
        <Button
          key={item.href}
          asChild
          variant={pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/admin/dashboard" && item.href !== "/admin/settings") || (item.href === "/admin/settings" && pathname.startsWith("/admin/settings"))) ? "default" : "ghost"}
          className={cn(
            "justify-start w-full",
            (pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/admin/dashboard" && item.href !== "/admin/settings") || (item.href === "/admin/settings" && pathname.startsWith("/admin/settings")))
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
