
"use client"; 

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, LockKeyhole, BookCopy, Loader2 } from "lucide-react";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { useAuth } from "@/context/AuthContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import type { SystemSettings } from "@/types";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

const systemSettingsSchema = z.object({
  defaultAcademicYear: z.string().max(50, "Academic year too long").optional(),
  defaultTerm: z.string().max(50, "Term name too long").optional(),
});

type SystemSettingsFormValues = z.infer<typeof systemSettingsSchema>;

export default function AdminSettingsPage() {
  const { userProfile, currentUser } = useAuth();
  const { toast } = useToast();
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const settingsForm = useForm<SystemSettingsFormValues>({
    resolver: zodResolver(systemSettingsSchema),
    defaultValues: {
      defaultAcademicYear: "",
      defaultTerm: "",
    },
  });

  useEffect(() => {
    const fetchSystemSettings = async () => {
      setIsLoadingSettings(true);
      try {
        const settingsRef = doc(db, "systemSettings", "generalConfig");
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists()) {
          const data = settingsSnap.data() as SystemSettings;
          settingsForm.reset({
            defaultAcademicYear: data.defaultAcademicYear || "",
            defaultTerm: data.defaultTerm || "",
          });
        }
      } catch (error) {
        console.error("Error fetching system settings:", error);
        toast({ title: "Error", description: "Could not load system settings.", variant: "destructive" });
      } finally {
        setIsLoadingSettings(false);
      }
    };
    fetchSystemSettings();
  }, [settingsForm, toast]);

  const onSaveSystemSettings = async (values: SystemSettingsFormValues) => {
    setIsSavingSettings(true);
    if (!currentUser || !userProfile) {
      toast({ title: "Error", description: "Authentication required.", variant: "destructive" });
      setIsSavingSettings(false);
      return;
    }

    if (!(userProfile.role === 'Admin' || userProfile.role === 'Teacher')) {
      toast({ title: "Unauthorized", description: "You do not have permission to change system settings.", variant: "destructive" });
      setIsSavingSettings(false);
      return;
    }

    try {
      const settingsRef = doc(db, "systemSettings", "generalConfig");
      const dataToSave: SystemSettings = {
        defaultAcademicYear: values.defaultAcademicYear || "",
        defaultTerm: values.defaultTerm || "",
        updatedAt: serverTimestamp() as unknown as Date, 
        updatedBy: currentUser.uid,
      };
      await setDoc(settingsRef, dataToSave, { merge: true });
      toast({ title: "Settings Saved", description: "System defaults have been updated." });
    } catch (error: any) {
      console.error("Error saving system settings:", error);
      toast({ title: "Save Failed", description: error.message || "Could not save system settings.", variant: "destructive" });
    } finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-8 text-3xl font-bold tracking-tight text-foreground">Admin Settings</h1>
      
      <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>User Profile</CardTitle>
            <CardDescription>Manage your account details.</CardDescription>
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
            {/* <Button disabled className="w-full">Update Profile (Disabled)</Button> */}
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
            <CardTitle className="flex items-center gap-2">
              <BookCopy className="h-5 w-5 text-primary" /> 
              System Defaults
            </CardTitle>
            <CardDescription>Set system-wide default values.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingSettings ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2 text-muted-foreground">Loading settings...</p>
              </div>
            ) : (
              <Form {...settingsForm}>
                <form onSubmit={settingsForm.handleSubmit(onSaveSystemSettings)} className="space-y-6">
                  <FormField
                    control={settingsForm.control}
                    name="defaultAcademicYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Academic Year</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 2024-2025" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={settingsForm.control}
                    name="defaultTerm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Term</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Term 1, Semester 1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full sm:w-auto bg-accent hover:bg-accent/90" disabled={isSavingSettings}>
                    {isSavingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save System Defaults
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Application Configuration</CardTitle>
            <CardDescription>View application-wide preferences.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="space-y-1">
                 <Label htmlFor="pass-mark">Default Pass Mark</Label>
                 <Input id="pass-mark" type="number" defaultValue="50" readOnly />
                 <p className="text-xs text-muted-foreground">This value (50) is used system-wide for determining Pass/Fail status in grades and reports.</p>
             </div>
             <Separator />
             <div>
                <h3 className="text-md font-semibold mb-2">Theme</h3>
                <p className="text-sm text-muted-foreground">
                  Dark mode can be toggled using the sun/moon icon in the application header.
                </p>
             </div>
             <div>
                <h3 className="text-md font-semibold mb-2">Notifications</h3>
                <p className="text-sm text-muted-foreground">
                  Email notifications for system events are planned for a future version and are not currently available.
                </p>
             </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8 bg-amber-50 border-amber-200 dark:bg-yellow-900/30 dark:border-yellow-700/50 lg:col-span-3">
        <CardHeader className="flex flex-row items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-yellow-500" data-ai-hint="alert warning" />
            <CardTitle className="text-amber-700 dark:text-yellow-400">Advanced Features & Future Enhancements</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-amber-600 dark:text-yellow-300">
                Advanced features like data export to PDF/Excel for all report types, detailed report configurations,
                and communication system settings (e.g., SMS/email notifications) are planned for future versions of Report-Manager.
                The current "Export as CSV" options provide basic data extraction.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}

