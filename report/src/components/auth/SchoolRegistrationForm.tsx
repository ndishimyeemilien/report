
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp, collection, addDoc, type FieldValue } from "firebase/firestore";
import type { UserProfile, UserRole, School, SchoolType } from "@/types";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Loader2, SchoolIcon } from "lucide-react"; // Added SchoolIcon
import { useTranslation } from "react-i18next";

const schoolRegistrationFormSchema = z.object({
  schoolName: z.string().min(3, { message: "School name must be at least 3 characters." }).max(100),
  schoolType: z.enum(['REB', 'TVET', 'Other'], { required_error: "Please select a school type." }),
  adminEmail: z.string().email({ message: "Invalid email address for admin." }),
  adminPassword: z.string().min(6, { message: "Admin password must be at least 6 characters." }),
  confirmAdminPassword: z.string(),
}).refine(data => data.adminPassword === data.confirmAdminPassword, {
  message: "Admin passwords don't match",
  path: ["confirmAdminPassword"],
});

type SchoolRegistrationFormValues = z.infer<typeof schoolRegistrationFormSchema>;

export function SchoolRegistrationForm() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<SchoolRegistrationFormValues>({
    resolver: zodResolver(schoolRegistrationFormSchema),
    defaultValues: {
      schoolName: "",
      schoolType: undefined,
      adminEmail: "",
      adminPassword: "",
      confirmAdminPassword: "",
    },
  });

  async function onSubmit(values: SchoolRegistrationFormValues) {
    setIsLoading(true);
    
    try {
      // 1. Create the admin user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, values.adminEmail, values.adminPassword);
      const adminUser = userCredential.user;

      // 2. Create the school document in Firestore
      const schoolRef = await addDoc(collection(db, "schools"), {
        name: values.schoolName,
        type: values.schoolType as SchoolType,
        adminUids: [adminUser.uid], // Add the new admin's UID
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      const schoolId = schoolRef.id;

      // 3. Create the admin user's profile in the 'users' collection
      const userProfileData: Omit<UserProfile, 'uid'> & { createdAt: FieldValue; updatedAt: FieldValue; schoolId: string; } = {
        email: adminUser.email,
        role: 'Admin' as UserRole, // This user is the admin of the newly registered school
        schoolId: schoolId,       // Link user to the school
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(db, "users", adminUser.uid), userProfileData);

      toast({
        title: t('schoolRegistrationSuccessTitle'),
        description: t('schoolRegistrationSuccessDesc', { schoolName: values.schoolName }),
      });
      // Redirect to login or a confirmation page
      router.push("/login"); 

    } catch (error: any) {
      console.error("School registration error:", error);
      let errorMessage = t('errorUnexpected');
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = t('errorEmailInUse');
      } else if (error.code === 'auth/weak-password') {
        errorMessage = t('errorWeakPassword');
      }
      toast({
        title: t('schoolRegistrationFailedTitle'),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="schoolName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('schoolNameLabel')}</FormLabel>
              <FormControl>
                <Input placeholder={t('schoolNamePlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="schoolType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('schoolTypeLabel')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectSchoolTypePlaceholder')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="REB">{t('schoolTypeREB')}</SelectItem>
                  <SelectItem value="TVET">{t('schoolTypeTVET')}</SelectItem>
                  <SelectItem value="Other">{t('schoolTypeOther')}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <hr className="my-4"/>
        <h3 className="text-lg font-medium text-foreground">{t('adminAccountDetailsTitle')}</h3>
        <FormField
          control={form.control}
          name="adminEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('adminEmailLabel')}</FormLabel>
              <FormControl>
                <Input type="email" placeholder={t('adminEmailPlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="adminPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('adminPasswordLabel')}</FormLabel>
              <FormControl>
                 <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••" 
                    {...field} 
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmAdminPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('confirmAdminPasswordLabel')}</FormLabel>
              <FormControl>
                <div className="relative">
                    <Input 
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••" 
                      {...field} 
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </Button>
                  </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <SchoolIcon className="mr-2 h-4 w-4" />
          {t('registerSchoolButton')}
        </Button>
      </form>
    </Form>
  );
}
