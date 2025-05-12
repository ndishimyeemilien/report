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
import type { Class } from "@/types";
import { addDoc, collection, doc, serverTimestamp, updateDoc, type FieldValue, deleteField } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { Loader2 } from "lucide-react";

const classFormSchema = z.object({
  name: z.string().min(2, { message: "Class name must be at least 2 characters." }).max(100),
  description: z.string().max(500).optional(),
  academicYear: z.string().max(50).optional().describe("e.g., 2023-2024"),
});

type ClassFormValues = z.infer<typeof classFormSchema>;

interface ClassFormProps {
  initialData?: Class | null;
  onClose?: () => void;
}

export function ClassForm({ initialData, onClose }: ClassFormProps) {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classFormSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      description: initialData.description || "",
      academicYear: initialData.academicYear || "",
    } : {
      name: "",
      description: "",
      academicYear: "",
    },
  });

  const onSubmit = async (values: ClassFormValues) => {
    setIsLoading(true);
    if (!userProfile) {
        toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive"});
        setIsLoading(false);
        return;
    }
    
    const dataToSave: Partial<Omit<Class, 'id' | 'createdAt' | 'updatedAt'>> & { updatedAt: FieldValue, secretaryId?: string | FieldValue, secretaryName?: string | FieldValue, description?: string | FieldValue | null, academicYear?: string | FieldValue } = {
        name: values.name,
        updatedAt: serverTimestamp(),
        secretaryId: userProfile.uid,
        secretaryName: userProfile.email || "Unknown Secretary",
    };

    if (values.description && values.description.trim() !== "") {
        dataToSave.description = values.description;
    } else {
        dataToSave.description = initialData?.id ? deleteField() : null; 
    }

    if (values.academicYear && values.academicYear.trim() !== "") {
        dataToSave.academicYear = values.academicYear;
    } else {
        dataToSave.academicYear = initialData?.id ? deleteField() : undefined;
    }


    try {
      if (initialData) { 
        const classRef = doc(db, "classes", initialData.id);
        await updateDoc(classRef, dataToSave); 
        toast({ title: "Class Updated", description: `Class "${values.name}" has been successfully updated.` });
      } else { 
        await addDoc(collection(db, "classes"), {
            ...dataToSave,
            createdAt: serverTimestamp()
        });
        toast({ title: "Class Added", description: `Class "${values.name}" has been successfully added.` });
      }
      if (onClose) onClose(); 
    } catch (error: any) {
      console.error("Class form error:", error);
      toast({
        title: initialData ? "Update Failed" : "Add Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      if (!initialData) form.reset(); 
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
              <FormLabel>Class Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Grade 10A, Afternoon Batch" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="academicYear"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Academic Year (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 2023-2024, Sept 2024 Intake" {...field} />
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
                  placeholder="Briefly describe the class."
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
            {initialData ? "Update Class" : "Add Class"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
