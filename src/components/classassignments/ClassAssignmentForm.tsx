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
import type { ClassCourseAssignment, Class, Course } from "@/types";
import { addDoc, collection, serverTimestamp, query, where, getDocs, doc, updateDoc, orderBy, type FieldValue } from "firebase/firestore";
// import { useRouter } from "next/navigation"; 
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const classAssignmentFormSchema = z.object({
  classId: z.string().min(1, { message: "Please select a class." }),
  courseId: z.string().min(1, { message: "Please select a course." }),
});

type ClassAssignmentFormValues = z.infer<typeof classAssignmentFormSchema>;

interface ClassAssignmentFormProps {
  initialData?: ClassCourseAssignment | null; 
  onClose?: () => void;
}

export function ClassAssignmentForm({ initialData, onClose }: ClassAssignmentFormProps) {
  const { toast } = useToast();
  // const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsDataLoading(true);
      try {
        const classesQuery = query(collection(db, "classes"), orderBy("name", "asc"));
        const coursesQuery = query(collection(db, "courses"), orderBy("name", "asc"));
        
        const [classesSnapshot, coursesSnapshot] = await Promise.all([
          getDocs(classesQuery),
          getDocs(coursesQuery),
        ]);

        const classesData = classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Class));
        const coursesData = coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
        
        setClasses(classesData);
        setCourses(coursesData);

      } catch (error) {
        console.error("Error fetching classes/courses for assignment: ", error);
        toast({ title: "Error", description: "Could not load classes or courses list.", variant: "destructive" });
      } finally {
        setIsDataLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  const form = useForm<ClassAssignmentFormValues>({
    resolver: zodResolver(classAssignmentFormSchema),
    defaultValues: initialData ? {
      classId: initialData.classId,
      courseId: initialData.courseId,
    } : {
      classId: "",
      courseId: "",
    },
  });

  const onSubmit = async (values: ClassAssignmentFormValues) => {
    setIsLoading(true);

    // Check for existing assignment, but only for new or if IDs change
    if (!initialData || (initialData && (initialData.classId !== values.classId || initialData.courseId !== values.courseId ))) {
        const existingAssignmentQuery = query(
        collection(db, "classAssignments"),
        where("classId", "==", values.classId),
        where("courseId", "==", values.courseId)
        );
        const existingAssignmentSnapshot = await getDocs(existingAssignmentQuery);
        if (!existingAssignmentSnapshot.empty) { 
            toast({
                title: "Assignment Exists",
                description: "This course is already assigned to this class.",
                variant: "destructive"
            });
            setIsLoading(false);
            return;
        }
    }


    const selectedClass = classes.find(c => c.id === values.classId);
    const selectedCourse = courses.find(c => c.id === values.courseId);

    if (!selectedClass || !selectedCourse) {
        toast({ title: "Error", description: "Selected class or course not found.", variant: "destructive" });
        setIsLoading(false);
        return;
    }
    
    const assignmentPayload: {
        classId: string;
        className: string;
        courseId: string;
        courseName: string;
        assignedAt: FieldValue;
    } = {
        classId: values.classId,
        className: selectedClass.name,
        courseId: values.courseId,
        courseName: `${selectedCourse.name} (${selectedCourse.code})`,
        assignedAt: serverTimestamp(),
    };

    try {
      if (initialData) { 
        // Editing is disabled for Lite version
        toast({ title: "Info", description: "Editing assignments is disabled. Please delete and re-add." });
      } else { 
        await addDoc(collection(db, "classAssignments"), assignmentPayload);
        toast({ title: "Course Assigned", description: `${selectedCourse.name} assigned to ${selectedClass.name}.` });
      }
      if (onClose) onClose(); 
    } catch (error: any) {
      console.error("Class assignment form error:", error);
      toast({
        title: initialData ? "Update Failed" : "Assignment Failed",
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
          name="classId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Class</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value} 
                disabled={isDataLoading || !!initialData} 
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={isDataLoading ? "Loading classes..." : "Select a class"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isDataLoading ? (
                    <SelectItem value="loading-classes-placeholder" disabled>Loading...</SelectItem>
                  ) : classes.length === 0 ? (
                     <SelectItem value="no-classes-placeholder" disabled>No classes available.</SelectItem>
                  ) : (
                    classes.map(cls => (
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
        <FormField
          control={form.control}
          name="courseId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Course</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value} 
                disabled={isDataLoading || !!initialData} 
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={isDataLoading ? "Loading courses..." : "Select a course"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isDataLoading ? (
                    <SelectItem value="loading-courses-placeholder" disabled>Loading...</SelectItem>
                  ) : courses.length === 0 ? (
                     <SelectItem value="no-courses-placeholder" disabled>No courses available.</SelectItem>
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
            disabled={isLoading || isDataLoading || (classes.length === 0 && courses.length === 0 && !isDataLoading) || !!initialData} 
            className="bg-accent hover:bg-accent/90"
          >
            {(isLoading || isDataLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Update (Disabled)" : "Assign Course"}
          </Button>
        </div>
      </form>
    </Form>
  );
}