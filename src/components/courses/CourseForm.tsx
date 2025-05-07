
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
import { addDoc, collection, doc, serverTimestamp, updateDoc, getDocs, query, where } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

const courseFormSchema = z.object({
  name: z.string().min(3, { message: "Course name must be at least 3 characters." }).max(100),
  code: z.string().min(2, { message: "Course code must be at least 2 characters." }).max(20)
    .regex(/^[A-Z0-9\s-]+$/, "Course code can only contain uppercase letters, numbers, spaces, and hyphens."),
  description: z.string().max(500).optional(),
  teacherId: z.string().optional(), // Teacher's UID
});

type CourseFormValues = z.infer<typeof courseFormSchema>;

interface CourseFormProps {
  initialData?: Course | null;
  onClose?: () => void;
}

const NONE_TEACHER_VALUE = "_NONE_"; // Special value for "None" option

export function CourseForm({ initialData, onClose }: CourseFormProps) {
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

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      code: initialData.code,
      description: initialData.description || "",
      teacherId: initialData.teacherId || "",
    } : {
      name: "",
      code: "",
      description: "",
      teacherId: "",
    },
  });

  const onSubmit = async (values: CourseFormValues) => {
    setIsLoading(true);
    
    const selectedTeacher = teachers.find(t => t.uid === values.teacherId);
    // Ensure teacherId is truly empty if no teacher is selected, not "_NONE_"
    const actualTeacherId = values.teacherId === NONE_TEACHER_VALUE ? "" : values.teacherId;
    const teacherName = actualTeacherId ? (selectedTeacher ? selectedTeacher.email : null) : undefined;


    const courseData: Partial<Course> = {
        ...values,
        teacherId: actualTeacherId || undefined, // Store undefined if empty
        teacherName: teacherName || undefined,
        updatedAt: serverTimestamp() as unknown as Date, 
    };


    try {
      if (initialData) {
        const courseRef = doc(db, "courses", initialData.id);
        await updateDoc(courseRef, {
            ...courseData
        });
        toast({ title: "Course Updated", description: `Course "${values.name}" has been successfully updated.` });
      } else {
        await addDoc(collection(db, "courses"), {
          ...courseData,
          createdAt: serverTimestamp(),
        });
        toast({ title: "Course Added", description: `Course "${values.name}" has been successfully added.` });
      }
      router.refresh(); 
      if (onClose) onClose(); 
    } catch (error: any) {
      console.error("Course form error:", error);
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
                value={!field.value ? NONE_TEACHER_VALUE : field.value} // If teacherId is empty string, treat NONE_TEACHER_VALUE as selected
                disabled={isTeachersLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={isTeachersLoading ? "Loading teachers..." : "Select a teacher"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isTeachersLoading ? (
                    <SelectItem value="loading-teachers-placeholder" disabled>Loading...</SelectItem> // Use non-empty unique value
                  ) : (
                    <>
                      <SelectItem value={NONE_TEACHER_VALUE}>None</SelectItem>
                      {teachers.length === 0 && (
                        <SelectItem value="no-teachers-placeholder" disabled>No teachers available.</SelectItem> // Use non-empty unique value
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
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Update Course" : "Add Course"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

