
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
import type { Grade, Course, Student } from "@/types"; // Added Student
import { useAuth } from "@/context/AuthContext";
import { addDoc, collection, doc, serverTimestamp, updateDoc, query, where, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

const PASS_MARK = 40;

const gradeFormSchema = z.object({
  studentId: z.string().min(1, { message: "Please select a student." }),
  // courseId is now implicitly set by the passed `course` prop
  marks: z.coerce.number().min(0, "Marks cannot be negative.").max(100, "Marks cannot exceed 100."),
  remarks: z.string().max(200).optional(),
});

type GradeFormValues = z.infer<typeof gradeFormSchema>;

interface GradeFormProps {
  initialData?: Grade | null;
  onClose?: () => void;
  course: Course; // The course for which grades are being entered
  students: Student[]; // List of students enrolled in this course
}

export function GradeForm({ initialData, onClose, course, students }: GradeFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { currentUser, userProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false); // For any async ops inside form if needed

  const form = useForm<GradeFormValues>({
    resolver: zodResolver(gradeFormSchema),
    defaultValues: initialData ? {
      studentId: initialData.studentId,
      marks: initialData.marks,
      remarks: initialData.remarks || "",
    } : {
      studentId: "",
      marks: 0,
      remarks: "",
    },
  });

  const onSubmit = async (values: GradeFormValues) => {
    setIsLoading(true);
    if (!currentUser || !userProfile) {
        toast({ title: "Authentication Error", description: "You must be logged in to submit grades.", variant: "destructive" });
        setIsLoading(false);
        return;
    }
    
    const selectedStudent = students.find(s => s.id === values.studentId);
    if (!selectedStudent) {
        toast({ title: "Error", description: "Selected student not found.", variant: "destructive" });
        setIsLoading(false);
        return;
    }

    // Check if grade already exists for this student in this course (for new entries only)
    if (!initialData) {
      const gradeQuery = query(
        collection(db, "grades"),
        where("studentId", "==", values.studentId),
        where("courseId", "==", course.id)
      );
      const gradeSnapshot = await getDocs(gradeQuery);
      if (!gradeSnapshot.empty) {
        toast({
          title: "Grade Exists",
          description: `${selectedStudent.fullName} already has a grade recorded for ${course.name}. You can edit it from the table.`,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
    }


    const status: 'Pass' | 'Fail' = values.marks >= PASS_MARK ? 'Pass' : 'Fail';

    const gradePayload: Partial<Omit<Grade, 'id'>> = {
        studentId: values.studentId,
        studentName: selectedStudent.fullName,
        courseId: course.id, // Use the passed course prop
        courseName: `${course.name} (${course.code})`,
        marks: values.marks,
        status,
        remarks: values.remarks,
        updatedAt: serverTimestamp() as unknown as Date,
        enteredByTeacherId: userProfile.uid,
        enteredByTeacherEmail: userProfile.email || undefined,
    };


    try {
      if (initialData) {
        const gradeRef = doc(db, "grades", initialData.id);
        await updateDoc(gradeRef, gradePayload);
        toast({ title: "Grade Updated", description: `Grade for ${selectedStudent.fullName} in ${course.name} updated.` });
      } else {
        await addDoc(collection(db, "grades"), {
          ...gradePayload,
          createdAt: serverTimestamp(),
        });
        toast({ title: "Grade Added", description: `Grade for ${selectedStudent.fullName} in ${course.name} added.` });
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
          name="studentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Student</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value} 
                disabled={isDataLoading || !!initialData} // Disable if editing existing grade
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={isDataLoading ? "Loading students..." : (students.length === 0 ? "No students enrolled" : "Select an enrolled student")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isDataLoading ? (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                  ) : students.length === 0 ? (
                     <SelectItem value="no-students" disabled>No students enrolled in this course.</SelectItem>
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
        {/* Course selection is removed, as course is passed as a prop */}
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
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading || isDataLoading}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading || isDataLoading || (students.length === 0 && !isDataLoading)} className="bg-accent hover:bg-accent/90">
            {(isLoading || isDataLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Update Grade" : "Add Grade"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

