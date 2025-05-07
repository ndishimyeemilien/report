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
import type { Grade, Course } from "@/types";
import { addDoc, collection, doc, serverTimestamp, updateDoc, getDocs, query, orderBy } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const PASS_MARK = 40; // Assuming 40 is the pass mark

const gradeFormSchema = z.object({
  studentName: z.string().min(2, { message: "Student name must be at least 2 characters." }).max(100),
  courseId: z.string().min(1, { message: "Please select a course." }),
  marks: z.coerce.number().min(0, "Marks cannot be negative.").max(100, "Marks cannot exceed 100."),
  remarks: z.string().max(200).optional(),
});

type GradeFormValues = z.infer<typeof gradeFormSchema>;

interface GradeFormProps {
  initialData?: Grade | null;
  onClose?: () => void;
}

export function GradeForm({ initialData, onClose }: GradeFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isCoursesLoading, setIsCoursesLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      setIsCoursesLoading(true);
      try {
        const q = query(collection(db, "courses"), orderBy("name"));
        const querySnapshot = await getDocs(q);
        const coursesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Course[];
        setCourses(coursesData);
      } catch (error) {
        console.error("Error fetching courses for grade form: ", error);
        toast({ title: "Error", description: "Could not load courses.", variant: "destructive" });
      } finally {
        setIsCoursesLoading(false);
      }
    };
    fetchCourses();
  }, [toast]);

  const form = useForm<GradeFormValues>({
    resolver: zodResolver(gradeFormSchema),
    defaultValues: initialData ? {
      studentName: initialData.studentName,
      courseId: initialData.courseId,
      marks: initialData.marks,
      remarks: initialData.remarks || "",
    } : {
      studentName: "",
      courseId: "",
      marks: 0,
      remarks: "",
    },
  });

  const onSubmit = async (values: GradeFormValues) => {
    setIsLoading(true);
    const selectedCourse = courses.find(c => c.id === values.courseId);
    if (!selectedCourse) {
        toast({ title: "Error", description: "Selected course not found.", variant: "destructive" });
        setIsLoading(false);
        return;
    }

    const status: 'Pass' | 'Fail' = values.marks >= PASS_MARK ? 'Pass' : 'Fail';

    try {
      if (initialData) {
        const gradeRef = doc(db, "grades", initialData.id);
        await updateDoc(gradeRef, {
          ...values,
          courseName: selectedCourse.name, // Ensure courseName is updated if course changes
          status,
          updatedAt: serverTimestamp(),
        });
        toast({ title: "Grade Updated", description: `Grade for ${values.studentName} in ${selectedCourse.name} updated.` });
      } else {
        await addDoc(collection(db, "grades"), {
          ...values,
          courseName: selectedCourse.name,
          status,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        toast({ title: "Grade Added", description: `Grade for ${values.studentName} in ${selectedCourse.name} added.` });
      }
      router.refresh();
      if (onClose) onClose();
    } catch (error: any) {
      console.error("Grade form error:", error);
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
          name="studentName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Student Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="courseId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Course</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isCoursesLoading}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={isCoursesLoading ? "Loading courses..." : "Select a course"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isCoursesLoading ? (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                  ) : courses.length === 0 ? (
                     <SelectItem value="no-courses" disabled>No courses available. Add a course first.</SelectItem>
                  ) : (
                    courses.map(course => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.name} ({course.code})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="marks"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Marks (0-100)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g., 75" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="remarks"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Remarks (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any comments on the student's performance..."
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
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading || isCoursesLoading}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading || isCoursesLoading || (courses.length === 0 && !isCoursesLoading)} className="bg-accent hover:bg-accent/90">
            {(isLoading || isCoursesLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Update Grade" : "Add Grade"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
