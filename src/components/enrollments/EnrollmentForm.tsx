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
import type { Enrollment, Student, Course, Class, ClassCourseAssignment } from "@/types";
import { addDoc, collection, serverTimestamp, query, where, getDocs, orderBy } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const enrollmentFormSchema = z.object({
  studentId: z.string().min(1, { message: "Please select a student." }),
  classId: z.string().min(1, { message: "Please select a class." }),
});

type EnrollmentFormValues = z.infer<typeof enrollmentFormSchema>;

interface EnrollmentFormProps {
  // initialData is removed as editing a "student-class" enrollment is complex
  // and Lite version focuses on add/delete of student-course enrollments.
  onClose?: () => void;
}

export function EnrollmentForm({ onClose }: EnrollmentFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]); // Changed from courses to classes
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsDataLoading(true);
      try {
        const studentsQuery = query(collection(db, "students"), orderBy("fullName", "asc"));
        const classesQuery = query(collection(db, "classes"), orderBy("name", "asc")); // Fetch classes
        
        const [studentsSnapshot, classesSnapshot] = await Promise.all([
          getDocs(studentsQuery),
          getDocs(classesQuery),
        ]);

        const studentsData = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
        const classesData = classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Class)); // Map classes
        
        setStudents(studentsData);
        setClasses(classesData);

      } catch (error) {
        console.error("Error fetching students/classes for enrollment: ", error);
        toast({ title: "Error", description: "Could not load students or classes list.", variant: "destructive" });
      } finally {
        setIsDataLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  const form = useForm<EnrollmentFormValues>({
    resolver: zodResolver(enrollmentFormSchema),
    defaultValues: {
      studentId: "",
      classId: "",
    },
  });

  const onSubmit = async (values: EnrollmentFormValues) => {
    setIsLoading(true);

    const selectedStudent = students.find(s => s.id === values.studentId);
    const selectedClass = classes.find(c => c.id === values.classId);

    if (!selectedStudent || !selectedClass) {
        toast({ title: "Error", description: "Selected student or class not found.", variant: "destructive" });
        setIsLoading(false);
        return;
    }

    try {
      // Find all courses assigned to this class
      const classAssignmentsQuery = query(collection(db, "classAssignments"), where("classId", "==", values.classId));
      const classAssignmentsSnapshot = await getDocs(classAssignmentsQuery);
      
      if (classAssignmentsSnapshot.empty) {
        toast({ title: "No Courses", description: `No courses are assigned to the class "${selectedClass.name}". Please assign courses first.`, variant: "default" });
        setIsLoading(false);
        return;
      }

      const coursesToEnroll = classAssignmentsSnapshot.docs.map(doc => doc.data() as ClassCourseAssignment);
      let successfulEnrollments = 0;
      let existingEnrollments = 0;

      for (const assignment of coursesToEnroll) {
        // Check for existing enrollment (studentId + courseId)
        const existingEnrollmentQuery = query(
          collection(db, "enrollments"),
          where("studentId", "==", values.studentId),
          where("courseId", "==", assignment.courseId)
        );
        const existingEnrollmentSnapshot = await getDocs(existingEnrollmentQuery);

        if (existingEnrollmentSnapshot.empty) {
          const enrollmentPayload: Partial<Omit<Enrollment, 'id'>> = {
              studentId: values.studentId,
              studentName: selectedStudent.fullName,
              courseId: assignment.courseId,
              courseName: assignment.courseName, // Already stored in ClassCourseAssignment
              enrolledAt: serverTimestamp() as unknown as Date,
          };
          await addDoc(collection(db, "enrollments"), enrollmentPayload);
          successfulEnrollments++;
        } else {
          existingEnrollments++;
        }
      }
      
      let summaryMessage = "";
      if (successfulEnrollments > 0) {
        summaryMessage += `${selectedStudent.fullName} enrolled in ${successfulEnrollments} new course(s) from class ${selectedClass.name}. `;
      }
      if (existingEnrollments > 0) {
        summaryMessage += `${existingEnrollments} course enrollment(s) already existed.`;
      }
      if (successfulEnrollments === 0 && existingEnrollments === 0 && coursesToEnroll.length > 0) {
         summaryMessage = "No new enrollments made (all might have existed or an issue occurred).";
      } else if (coursesToEnroll.length === 0) {
         summaryMessage = `No courses are assigned to class ${selectedClass.name} to enroll the student into.`;
      }

      toast({ 
        title: "Enrollment Processed", 
        description: summaryMessage.trim() || "Enrollment attempt complete.",
        variant: successfulEnrollments > 0 ? "default" : "destructive"
      });
      
      router.refresh(); 
      if (onClose) onClose(); 

    } catch (error: any) {
      console.error("Enrollment form error:", error);
      toast({
        title: "Enrollment Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      form.reset(); 
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
                disabled={isDataLoading} 
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={isDataLoading ? "Loading students..." : "Select a student"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isDataLoading ? (
                    <SelectItem value="loading-students" disabled>Loading...</SelectItem>
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
          name="classId" // Changed from courseId to classId
          render={({ field }) => (
            <FormItem>
              <FormLabel>Class</FormLabel> {/* Changed label */}
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value} 
                disabled={isDataLoading} 
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={isDataLoading ? "Loading classes..." : "Select a class"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isDataLoading ? (
                    <SelectItem value="loading-classes" disabled>Loading...</SelectItem>
                  ) : classes.length === 0 ? (
                     <SelectItem value="no-classes" disabled>No classes available.</SelectItem>
                  ) : (
                    classes.map(cls => ( // Changed from course to cls
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
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
            disabled={isLoading || isDataLoading || (students.length === 0 && classes.length === 0 && !isDataLoading)} 
            className="bg-accent hover:bg-accent/90"
          >
            {(isLoading || isDataLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enroll Student in Class
          </Button>
        </div>
      </form>
    </Form>
  );
}
