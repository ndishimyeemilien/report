
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
<<<<<<< HEAD
import { LayoutDashboard, BookOpen, ClipboardList, FileText, Settings, Users, UserCog, Users2, Archive } from "lucide-react";
=======
import { LayoutDashboard, BookOpen, ClipboardList, FileText, Settings, Users, UserCog, Users2, Archive, CalendarClock, Group, MessageSquare } from "lucide-react"; // Added MessageSquare
>>>>>>> 5dbc128 (mjhh)

export interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  disabled?: boolean;
}

// Admin specific navigation
export const adminNavItems: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/dashboard/courses", label: "Subjects", icon: BookOpen }, 
  { href: "/admin/dashboard/classes", label: "Classes", icon: Archive },
<<<<<<< HEAD
  { href: "/admin/dashboard/grades", label: "Grades", icon: ClipboardList },
  { href: "/admin/dashboard/reports", label: "Reports", icon: FileText },
  { href: "/secretary/students", label: "Students", icon: Users }, // Link to secretary's student page
=======
  { href: "/admin/dashboard/terms", label: "Academic Terms", icon: CalendarClock },
  { href: "/admin/dashboard/groups", label: "Teacher Groups", icon: Group }, 
  { href: "/admin/dashboard/grades", label: "Grades", icon: ClipboardList },
  { href: "/admin/dashboard/reports", label: "Reports", icon: FileText },
  { href: "/admin/dashboard/feedback", label: "Feedback", icon: MessageSquare }, // New Feedback Link
  { href: "/secretary/students", label: "Students", icon: Users }, 
>>>>>>> 5dbc128 (mjhh)
  { href: "/admin/dashboard/teachers", label: "Teachers", icon: UserCog, disabled: false }, 
  { href: "/admin/dashboard/users", label: "Manage Users", icon: Users2 },
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
          (pathname.startsWith(item.href) && 
           item.href !== "/admin/dashboard" && 
           item.href !== "/admin/settings" && 
           item.href !== "/secretary/students" && 
           item.href !== "/admin/dashboard/teachers" &&
           item.href !== "/admin/dashboard/users" &&
<<<<<<< HEAD
           item.href !== "/admin/dashboard/classes" // Ensure classes isn't always active
          ) ||
          (item.href === "/admin/dashboard" && pathname === "/admin/dashboard") || // Strict match for dashboard
=======
           item.href !== "/admin/dashboard/terms" && 
           item.href !== "/admin/dashboard/groups" && 
           item.href !== "/admin/dashboard/feedback" && // New check
           item.href !== "/admin/dashboard/classes" 
          ) ||
          (item.href === "/admin/dashboard" && pathname === "/admin/dashboard") || 
>>>>>>> 5dbc128 (mjhh)
          (item.href === "/admin/settings" && pathname.startsWith("/admin/settings")) ||
          (item.href === "/secretary/students" && pathname.startsWith("/secretary/students")) ||
          (item.href === "/admin/dashboard/teachers" && pathname.startsWith("/admin/dashboard/teachers")) ||
          (item.href === "/admin/dashboard/users" && pathname.startsWith("/admin/dashboard/users")) ||
<<<<<<< HEAD
=======
          (item.href === "/admin/dashboard/terms" && pathname.startsWith("/admin/dashboard/terms")) || 
          (item.href === "/admin/dashboard/groups" && pathname.startsWith("/admin/dashboard/groups")) || 
          (item.href === "/admin/dashboard/feedback" && pathname.startsWith("/admin/dashboard/feedback")) || // New check
>>>>>>> 5dbc128 (mjhh)
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
    </nav>
  );
}
