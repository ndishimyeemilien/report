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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import type { Course } from "@/types";
import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

const courseFormSchema = z.object({
  name: z.string().min(3, { message: "Course name must be at least 3 characters." }).max(100),
  code: z.string().min(2, { message: "Course code must be at least 2 characters." }).max(20)
    .regex(/^[A-Z0-9\s-]+$/, "Course code can only contain uppercase letters, numbers, spaces, and hyphens."),
  description: z.string().max(500).optional(),
});

type CourseFormValues = z.infer<typeof courseFormSchema>;

interface CourseFormProps {
  initialData?: Course | null;
  onClose?: () => void; // Callback to close a modal, for example
}

export function CourseForm({ initialData, onClose }: CourseFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      code: initialData.code,
      description: initialData.description || "",
    } : {
      name: "",
      code: "",
      description: "",
    },
  });

  const onSubmit = async (values: CourseFormValues) => {
    setIsLoading(true);
    try {
      if (initialData) {
        // Update existing course
        const courseRef = doc(db, "courses", initialData.id);
        await updateDoc(courseRef, {
          ...values,
          updatedAt: serverTimestamp(),
        });
        toast({ title: "Course Updated", description: `Course "${values.name}" has been successfully updated.` });
      } else {
        // Add new course
        await addDoc(collection(db, "courses"), {
          ...values,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        toast({ title: "Course Added", description: `Course "${values.name}" has been successfully added.` });
      }
      router.refresh(); // Refresh page to show updated list
      if (onClose) onClose(); // Close modal if applicable
    } catch (error: any) {
      console.error("Course form error:", error);
      toast({
        title: initialData ? "Update Failed" : "Add Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      if (!initialData) form.reset(); // Reset form only for new entries
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Course Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Introduction to Programming" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Course Code</FormLabel>
              <FormControl>
                <Input placeholder="e.g., CS101" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Briefly describe the course content and objectives."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
          {onClose && (
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading} className="bg-accent hover:bg-accent/90">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Update Course" : "Add Course"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
