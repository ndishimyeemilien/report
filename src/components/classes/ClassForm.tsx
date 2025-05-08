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
import { addDoc, collection, doc, serverTimestamp, updateDoc, type FieldValue } from "firebase/firestore";
// import { useRouter } from "next/navigation"; // Not strictly needed if parent handles refresh
import { useState } from "react";
import { Loader2 } from "lucide-react";

const classFormSchema = z.object({
  name: z.string().min(2, { message: "Class name must be at least 2 characters." }).max(100),
  description: z.string().max(500).optional(),
});

type ClassFormValues = z.infer<typeof classFormSchema>;

interface ClassFormProps {
  initialData?: Class | null;
  onClose?: () => void;
}

export function ClassForm({ initialData, onClose }: ClassFormProps) {
  const { toast } = useToast();
  // const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classFormSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      description: initialData.description || "",
    } : {
      name: "",
      description: "",
    },
  });

  const onSubmit = async (values: ClassFormValues) => {
    setIsLoading(true);
    
    const dataToSave: {
        name: string;
        description?: string | null; // Allow null for Firestore
        updatedAt: FieldValue;
        createdAt?: FieldValue;
    } = {
        name: values.name,
        updatedAt: serverTimestamp(),
    };

    if (values.description && values.description.trim() !== "") {
        dataToSave.description = values.description;
    } else {
        // If description is empty or only whitespace, store it as null or omit it.
        // Storing as null explicitly sets it, omitting it leaves it undefined if not previously set.
        // For updates, if you want to remove a description, you'd use deleteField().
        // Here, we'll set to null if it's empty, for consistency.
        dataToSave.description = null; 
    }


    try {
      if (initialData) { 
        const classRef = doc(db, "classes", initialData.id);
        // Ensure createdAt is not in update payload if it was part of dataToSave initially (it's not in this structure)
        await updateDoc(classRef, dataToSave); // dataToSave already excludes createdAt for updates
        toast({ title: "Class Updated", description: `Class "${values.name}" has been successfully updated.` });
      } else { 
        dataToSave.createdAt = serverTimestamp();
        await addDoc(collection(db, "classes"), dataToSave);
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

