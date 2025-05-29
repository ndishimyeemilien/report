
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
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import type { AcademicTerm } from "@/types";
import { addDoc, collection, doc, serverTimestamp, updateDoc, type FieldValue } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";

const termFormSchema = z.object({
  name: z.string().min(2, { message: "Term name must be at least 2 characters." }).max(100),
  academicYear: z.string().min(4, { message: "Academic year must be at least 4 characters (e.g., 2024 or 2024-2025)."}).max(50),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {message: "Start date is required."}),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {message: "End date is required."}),
  isCurrent: z.boolean().optional(),
}).refine(data => {
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) >= new Date(data.startDate);
  }
  return true;
}, {
  message: "End date cannot be before start date.",
  path: ["endDate"],
});

type TermFormValues = z.infer<typeof termFormSchema>;

interface TermFormProps {
  initialData?: AcademicTerm | null;
  onClose?: () => void;
}

export function TermForm({ initialData, onClose }: TermFormProps) {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<TermFormValues>({
    resolver: zodResolver(termFormSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      academicYear: initialData.academicYear,
      startDate: initialData.startDate ? format(parseISO(initialData.startDate), "yyyy-MM-dd") : "",
      endDate: initialData.endDate ? format(parseISO(initialData.endDate), "yyyy-MM-dd") : "",
      isCurrent: initialData.isCurrent || false,
    } : {
      name: "",
      academicYear: "",
      startDate: "",
      endDate: "",
      isCurrent: false,
    },
  });

  const onSubmit = async (values: TermFormValues) => {
    setIsLoading(true);
    if (!currentUser) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const dataToSave: Partial<Omit<AcademicTerm, 'id' | 'createdAt' | 'updatedAt'>> & { updatedAt: FieldValue, createdBy?: string } = {
      name: values.name,
      academicYear: values.academicYear,
      startDate: values.startDate, // Already in YYYY-MM-DD string format
      endDate: values.endDate,     // Already in YYYY-MM-DD string format
      isCurrent: values.isCurrent || false,
      updatedAt: serverTimestamp(),
    };

    try {
      if (initialData?.id) {
        const termRef = doc(db, "academicTerms", initialData.id);
        await updateDoc(termRef, dataToSave);
        toast({ title: "Academic Term Updated", description: `Term "${values.name}" has been updated.` });
      } else {
        dataToSave.createdBy = currentUser.uid;
        dataToSave.createdAt = serverTimestamp() as unknown as Date; // Firestore handles this
        await addDoc(collection(db, "academicTerms"), dataToSave);
        toast({ title: "Academic Term Added", description: `Term "${values.name}" has been added.` });
      }
      if (onClose) onClose();
    } catch (error: any) {
      console.error("Academic term form error:", error);
      toast({
        title: initialData?.id ? "Update Failed" : "Add Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      if (!initialData?.id) form.reset();
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
              <FormLabel>Term Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Term 1, First Semester" {...field} />
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
              <FormLabel>Academic Year</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 2024-2025" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
                <Popover>
                    <PopoverTrigger asChild>
                    <FormControl>
                        <Button
                        variant={"outline"}
                        className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                        )}
                        >
                        {field.value ? (
                            format(parseISO(field.value), "PPP")
                        ) : (
                            <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                    </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={field.value ? parseISO(field.value) : undefined}
                        onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                        initialFocus
                    />
                    </PopoverContent>
                </Popover>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                <FormLabel>End Date</FormLabel>
                 <Popover>
                    <PopoverTrigger asChild>
                    <FormControl>
                        <Button
                        variant={"outline"}
                        className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                        )}
                        >
                        {field.value ? (
                            format(parseISO(field.value), "PPP")
                        ) : (
                            <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                    </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={field.value ? parseISO(field.value) : undefined}
                        onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                        initialFocus
                    />
                    </PopoverContent>
                </Popover>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
         <FormField
          control={form.control}
          name="isCurrent"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Set as Current Term</FormLabel>
                <FormMessage />
              </div>
              <FormControl>
                <Input 
                    type="checkbox" 
                    checked={field.value} 
                    onChange={field.onChange}
                    className="h-5 w-5"
                />
              </FormControl>
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
            {initialData?.id ? "Update Term" : "Add Term"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
