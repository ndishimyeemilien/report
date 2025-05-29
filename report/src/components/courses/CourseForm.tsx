
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import type { Course, UserProfile } from "@/types";
import { addDoc, collection, doc, serverTimestamp, updateDoc, getDocs, query, where, deleteField, type FieldValue } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

const courseFormSchema = z.object({
  name: z.string().min(2, { message: "Subject name must be at least 2 characters." }).max(100), // Changed from Course name to Subject name
  code: z.string().min(2, { message: "Subject code must be at least 2 characters." }).max(20)
    .regex(/^[A-Z0-9\s-]+$/, "Subject code can only contain uppercase letters, numbers, spaces, and hyphens."),
  description: z.string().max(500).optional(),
  teacherId: z.string().optional(),
  // Category and Combination will be passed via initialData or props, not directly editable in this form
  // but are required for saving.
  category: z.string().min(1, "Category is required."),
  combination: z.string().min(1, "Combination is required."),
});

type CourseFormValues = z.infer<typeof courseFormSchema>;

interface CourseFormProps {
  initialData?: Partial<Course> | null; // Can be partial for new courses if category/combo passed
  onClose?: () => void;
  // Selected category and combination must be provided if not in initialData (e.g. for new subject)
  selectedCategory?: string;
  selectedCombination?: string;
}

const NONE_TEACHER_VALUE = "_NONE_"; 

export function CourseForm({ initialData, onClose, selectedCategory, selectedCombination }: CourseFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [isTeachersLoading, setIsTeachersLoading] = useState(true);

  useEffect(() => {
    const fetchTeachers = async () => {
      setIsTeachersLoading(true);
      try {
        const q = query(collection(db, "users"), where("role", "==", "Teacher"));
        const querySnapshot = await getDocs(q);
        const teachersData = querySnapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data(),
        })) as UserProfile[];
        setTeachers(teachersData);
      } catch (error) {
        console.error("Error fetching teachers: ", error);
        toast({ title: "Error", description: "Could not load teachers list.", variant: "destructive" });
      } finally {
        setIsTeachersLoading(false);
      }
    };
    fetchTeachers();
  }, [toast]);

  const defaultCategory = initialData?.category || selectedCategory || "";
  const defaultCombination = initialData?.combination || selectedCombination || "";

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      code: initialData?.code || "",
      description: initialData?.description || "",
      teacherId: initialData?.teacherId || "",
      category: defaultCategory,
      combination: defaultCombination,
    },
  });
  
  // Watch category and combination to ensure they are part of the form's values if passed as props
  useEffect(() => {
    if (selectedCategory && form.getValues("category") !== selectedCategory) {
      form.setValue("category", selectedCategory);
    }
    if (selectedCombination && form.getValues("combination") !== selectedCombination) {
      form.setValue("combination", selectedCombination);
    }
  }, [selectedCategory, selectedCombination, form]);


  const onSubmit = async (values: CourseFormValues) => {
    setIsLoading(true);
    
    if (!values.category || !values.combination) {
        toast({title: "Missing Info", description: "Category and Combination are required.", variant: "destructive"});
        setIsLoading(false);
        return;
    }

    const dataForFirestore: {
        name: string;
        code: string;
        description?: string | null | FieldValue;
        teacherId?: string | FieldValue; 
        teacherName?: string | null | FieldValue; 
        category: string;
        combination: string;
        updatedAt: FieldValue;
        createdAt?: FieldValue;
    } = {
        name: values.name,
        code: values.code,
        category: values.category,
        combination: values.combination,
        updatedAt: serverTimestamp(),
    };

    if (values.description && values.description.trim() !== "") {
        dataForFirestore.description = values.description;
    } else {
        dataForFirestore.description = initialData?.id ? deleteField() : null; 
    }
    
    if (values.teacherId && values.teacherId !== NONE_TEACHER_VALUE) {
        const selectedTeacher = teachers.find(t => t.uid === values.teacherId);
        dataForFirestore.teacherId = values.teacherId;
        dataForFirestore.teacherName = selectedTeacher?.email || null; // Store email as teacherName
    } else { // If "None" is selected or teacherId is empty
        dataForFirestore.teacherId = deleteField();
        dataForFirestore.teacherName = deleteField();
    }


    try {
      if (initialData?.id) { 
        const courseRef = doc(db, "courses", initialData.id);
        await updateDoc(courseRef, dataForFirestore);
        toast({ title: "Subject Updated", description: `Subject "${values.name}" has been successfully updated.` });
      } else { 
        dataForFirestore.createdAt = serverTimestamp();
        // Ensure no undefined fields are sent for new docs, except for description which can be null
        Object.keys(dataForFirestore).forEach(key => {
             if (dataForFirestore[key as keyof typeof dataForFirestore] === undefined && key !== 'description') {
                 delete dataForFirestore[key as keyof typeof dataForFirestore];
             }
        });
        await addDoc(collection(db, "courses"), dataForFirestore);
        toast({ title: "Subject Added", description: `Subject "${values.name}" has been successfully added to ${values.combination}.` });
      }
      router.refresh(); 
      if (onClose) onClose(); 
    } catch (error: any) {
      console.error("Course form error:", error);
      toast({
        title: initialData?.id ? "Update Failed" : "Add Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      if (!initialData?.id) form.reset({
        name: "",
        code: "",
        description: "",
        teacherId: "",
        category: selectedCategory || "", // Persist selected category/combo for next "add"
        combination: selectedCombination || ""
      }); 
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Category and Combination are usually not directly edited in this form when adding subject to a selection */}
        {/* They are displayed if editing, or implicitly set if adding */}
        {initialData?.category && (
            <div className="space-y-1">
                <FormLabel>Category</FormLabel>
                <Input value={initialData.category} readOnly disabled className="bg-muted/50"/>
            </div>
        )}
         {initialData?.combination && (
            <div className="space-y-1">
                <FormLabel>Combination / Option</FormLabel>
                <Input value={initialData.combination} readOnly disabled className="bg-muted/50"/>
            </div>
        )}

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Mathematics, Financial Accounting" {...field} />
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
              <FormLabel>Subject Code</FormLabel>
              <FormControl>
                <Input placeholder="e.g., MATH101, ACC202" {...field} />
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
                  placeholder="Briefly describe the subject."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="teacherId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assign Teacher (Optional)</FormLabel>
              <Select 
                onValueChange={(value) => {
                  field.onChange(value === NONE_TEACHER_VALUE ? "" : value);
                }} 
                value={!field.value ? NONE_TEACHER_VALUE : field.value} 
                disabled={isTeachersLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={isTeachersLoading ? "Loading teachers..." : "Select a teacher"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isTeachersLoading ? (
                    <SelectItem value="loading-teachers-placeholder" disabled>Loading...</SelectItem> 
                  ) : (
                    <>
                      <SelectItem value={NONE_TEACHER_VALUE}>-- None --</SelectItem>
                      {teachers.length === 0 && (
                        <SelectItem value="no-teachers-placeholder" disabled>No teachers available.</SelectItem> 
                      )}
                      {teachers.map(teacher => (
                        <SelectItem key={teacher.uid} value={teacher.uid}>
                          {teacher.email} (Teacher)
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
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
          <Button type="submit" disabled={isLoading || isTeachersLoading} className="bg-accent hover:bg-accent/90">
            {(isLoading || isTeachersLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData?.id ? "Update Subject" : "Add Subject"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

