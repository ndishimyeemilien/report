
"use client"; // Required for form interaction and hooks

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, LockKeyhole } from "lucide-react";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { useAuth } from "@/context/AuthContext";

export default function AdminSettingsPage() {
  const { userProfile } = useAuth();

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-8 text-3xl font-bold tracking-tight text-foreground">Admin Settings</h1>
      
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>User Profile</CardTitle>
            <CardDescription>Manage your account details. (Read-only for Lite version)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" defaultValue={userProfile?.email || "admin@example.com"} readOnly />
            </div>
            <div className="space-y-1">
              <Label htmlFor="role">Role</Label>
              <Input id="role" defaultValue={userProfile?.role || "Admin"} readOnly />
            </div>
            <Button disabled className="w-full">Update Profile (Disabled)</Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LockKeyhole className="h-5 w-5 text-primary" />
              Security Settings
            </CardTitle>
            <CardDescription>Change your account password.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Application Settings</CardTitle>
            <CardDescription>Configure application-wide preferences.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="dark-mode" className="text-base">Dark Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Toggle dark mode for the application. (Handled by Header Theme Toggle)
                </p>
              </div>
              <Switch id="dark-mode" disabled aria-readonly/>
            </div>
             <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="notifications" className="text-base">Email Notifications</Label>
                 <p className="text-sm text-muted-foreground">
                  Receive email notifications for important events. (Feature not available)
                </p>
              </div>
              <Switch id="notifications" disabled aria-readonly/>
            </div>
             <Separator />
             <div>
                 <h3 className="text-md font-semibold mb-2">Grading System</h3>
                 <div className="space-y-2">
                     <Label htmlFor="pass-mark">Default Pass Mark</Label>
                     <Input id="pass-mark" type="number" defaultValue="50" readOnly />
                     <p className="text-xs text-muted-foreground">Pass mark is currently fixed at 50 for calculations in reports and grade status.</p>
                 </div>
             </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8 bg-amber-50 border-amber-200 dark:bg-yellow-900/30 dark:border-yellow-700/50 lg:col-span-3">
        <CardHeader className="flex flex-row items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-yellow-500" data-ai-hint="alert warning" />
            <CardTitle className="text-amber-700 dark:text-yellow-400">Advanced Settings</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-amber-600 dark:text-yellow-300">
                Advanced settings like data export formats (PDF/Excel), detailed report configurations,
                and communication system settings are planned for future versions and are not available in Report-Manager Lite.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
