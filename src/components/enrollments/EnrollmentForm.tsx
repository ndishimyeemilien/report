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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import type { Enrollment, Student, Course } from "@/types";
import { addDoc, collection, serverTimestamp, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const enrollmentFormSchema = z.object({
  studentId: z.string().min(1, { message: "Please select a student." }),
  courseId: z.string().min(1, { message: "Please select a course." }),
});

type EnrollmentFormValues = z.infer<typeof enrollmentFormSchema>;

interface EnrollmentFormProps {
  initialData?: Enrollment | null; // For editing, though Lite version might focus on add/delete
  onClose?: () => void;
}

export function EnrollmentForm({ initialData, onClose }: EnrollmentFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsDataLoading(true);
      try {
        const studentsQuery = query(collection(db, "students"), orderBy("fullName", "asc"));
        const coursesQuery = query(collection(db, "courses"), orderBy("name", "asc"));
        
        const [studentsSnapshot, coursesSnapshot] = await Promise.all([
          getDocs(studentsQuery),
          getDocs(coursesQuery),
        ]);

        const studentsData = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
        const coursesData = coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
        
        setStudents(studentsData);
        setCourses(coursesData);

      } catch (error) {
        console.error("Error fetching students/courses for enrollment: ", error);
        toast({ title: "Error", description: "Could not load students or courses list.", variant: "destructive" });
      } finally {
        setIsDataLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  const form = useForm<EnrollmentFormValues>({
    resolver: zodResolver(enrollmentFormSchema),
    defaultValues: initialData ? {
      studentId: initialData.studentId,
      courseId: initialData.courseId,
    } : {
      studentId: "",
      courseId: "",
    },
  });

  const onSubmit = async (values: EnrollmentFormValues) => {
    setIsLoading(true);

    // Check for existing enrollment (studentId + courseId)
    const existingEnrollmentQuery = query(
      collection(db, "enrollments"),
      where("studentId", "==", values.studentId),
      where("courseId", "==", values.courseId)
    );
    const existingEnrollmentSnapshot = await getDocs(existingEnrollmentQuery);

    if (!existingEnrollmentSnapshot.empty && !initialData) { // Only check for new enrollments
        toast({
            title: "Enrollment Exists",
            description: "This student is already enrolled in this course.",
            variant: "destructive"
        });
        setIsLoading(false);
        return;
    }


    const selectedStudent = students.find(s => s.id === values.studentId);
    const selectedCourse = courses.find(c => c.id === values.courseId);

    if (!selectedStudent || !selectedCourse) {
        toast({ title: "Error", description: "Selected student or course not found.", variant: "destructive" });
        setIsLoading(false);
        return;
    }
    
    const enrollmentPayload: Partial<Omit<Enrollment, 'id'>> = {
        studentId: values.studentId,
        studentName: selectedStudent.fullName,
        courseId: values.courseId,
        courseName: `${selectedCourse.name} (${selectedCourse.code})`,
    };

    try {
      if (initialData) { // Editing existing enrollment
        const enrollmentRef = doc(db, "enrollments", initialData.id);
        // Note: Firestore serverTimestamp is only for add, for update you set it directly
        await updateDoc(enrollmentRef, {
            ...enrollmentPayload, 
            // enrolledAt might not change, or you might want an `updatedAt` field
        });
        toast({ title: "Enrollment Updated", description: "Enrollment details have been updated." });
      } else { // Adding new enrollment
        await addDoc(collection(db, "enrollments"), {
          ...enrollmentPayload,
          enrolledAt: serverTimestamp(),
        });
        toast({ title: "Student Enrolled", description: `${selectedStudent.fullName} enrolled in ${selectedCourse.name}.` });
      }
      router.refresh(); 
      if (onClose) onClose(); 
    } catch (error: any) {
      console.error("Enrollment form error:", error);
      toast({
        title: initialData ? "Update Failed" : "Enrollment Failed",
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
          name="studentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Student</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value} 
                disabled={isDataLoading || !!initialData} // Disable if editing (usually student/course don't change in edit)
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={isDataLoading ? "Loading students..." : "Select a student"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isDataLoading ? (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                  ) : students.length === 0 ? (
                     <SelectItem value="no-students" disabled>No students available.</SelectItem>
                  ) : (
                    students.map(student => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.fullName} {student.studentSystemId ? `(${student.studentSystemId})` : ''}
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
          name="courseId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Course</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value} 
                disabled={isDataLoading || !!initialData} // Disable if editing
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={isDataLoading ? "Loading courses..." : "Select a course"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isDataLoading ? (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                  ) : courses.length === 0 ? (
                     <SelectItem value="no-courses" disabled>No courses available.</SelectItem>
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
        
        <div className="flex justify-end gap-2">
          {onClose && (
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading || isDataLoading}>
              Cancel
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={isLoading || isDataLoading || (students.length === 0 && courses.length === 0 && !isDataLoading)} 
            className="bg-accent hover:bg-accent/90"
          >
            {(isLoading || isDataLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Update Enrollment" : "Enroll Student"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

