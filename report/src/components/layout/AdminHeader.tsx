
"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
<<<<<<< HEAD
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, LogOut, Settings, Sun, Moon } from "lucide-react"; // Removed UserCircle as Avatar is used
=======
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, LogOut, Settings, Sun, Moon } from "lucide-react";
>>>>>>> 5dbc128 (mjhh)
import Link from "next/link";
import Logo from "../shared/Logo";
import AdminSidebarNav from "./AdminSidebarNav"; 
import { useState, useEffect } from "react";

// Simple theme toggle (no persistence for Lite version)
const ThemeToggle = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
<<<<<<< HEAD
    // Check for saved theme preference or system preference
=======
>>>>>>> 5dbc128 (mjhh)
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    } else {
      setIsDarkMode(prefersDark);
    }
  }, []);
  
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      if (typeof window !== 'undefined') localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      if (typeof window !== 'undefined') localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  return (
    <Button variant="ghost" size="icon" onClick={() => setIsDarkMode(!isDarkMode)}>
      {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};


export default function AdminHeader() {
  const { currentUser, userProfile, logout } = useAuth();

  const getInitials = (email: string | null | undefined) => {
    if (!email) return "AD";
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 shadow-sm">
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col p-0 pt-4 bg-sidebar text-sidebar-foreground">
<<<<<<< HEAD
             <div className="px-4 mb-4">
=======
            <SheetHeader className="border-b border-sidebar-border px-4 pb-4">
              <SheetTitle>Menu</SheetTitle> 
            </SheetHeader>
             <div className="px-4 mb-4 mt-2"> 
>>>>>>> 5dbc128 (mjhh)
                <Logo className="text-sidebar-foreground"/>
             </div>
            <AdminSidebarNav isMobile={true} />
          </SheetContent>
        </Sheet>
      </div>

      <div className="hidden md:block">
        {/* Placeholder for breadcrumbs or page title if needed */}
      </div>
      
<<<<<<< HEAD
      <div className="flex w-full items-center justify-end gap-4 md:ml-auto">
=======
      <div className="flex w-full items-center justify-end gap-2 md:ml-auto"> 
>>>>>>> 5dbc128 (mjhh)
        <ThemeToggle />
        {currentUser && userProfile ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={currentUser.photoURL || ""} alt={userProfile.email || "Admin"} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(userProfile.email)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {userProfile.email}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {userProfile.role}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
<<<<<<< HEAD
                <Link href="/admin/settings"> {/* Updated Link */}
=======
                <Link href="/admin/settings">
>>>>>>> 5dbc128 (mjhh)
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
           <Button variant="outline" asChild>
             <Link href="/login">Login</Link>
           </Button>
        )}
      </div>
    </header>
  );
}
