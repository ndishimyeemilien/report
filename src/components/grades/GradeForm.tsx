
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
import type { Grade, Course, Student, SystemSettings } from "@/types"; 
import { useAuth } from "@/context/AuthContext";
import { addDoc, collection, doc, serverTimestamp, updateDoc, query, where, getDocs, type FieldValue, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

const PASS_MARK = 50;

const gradeFormSchema = z.object({
  studentId: z.string().min(1, { message: "Please select a student." }),
  marks: z.coerce.number().min(0, "Marks cannot be negative.").max(100, "Marks cannot exceed 100."),
  remarks: z.string().max(200).optional(),
  term: z.string().optional(), 
});

type GradeFormValues = z.infer<typeof gradeFormSchema>;

interface GradeFormProps {
  initialData?: Grade | null;
  onClose?: () => void;
  course: Course; 
  students: Student[]; 
}

export function GradeForm({ initialData, onClose, course, students }: GradeFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { currentUser, userProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false); 
  const [defaultTerm, setDefaultTerm] = useState<string>("Term 1"); // Default fallback

  const form = useForm<GradeFormValues>({
    resolver: zodResolver(gradeFormSchema),
    defaultValues: initialData ? {
      studentId: initialData.studentId,
      marks: initialData.marks,
      remarks: initialData.remarks || "",
      term: initialData.term || "Term 1",
    } : {
      studentId: "",
      marks: 0,
      remarks: "",
      term: "Term 1", // This will be overridden by fetched default if adding new
    },
  });

  useEffect(() => {
    const fetchSystemDefaults = async () => {
      if (!initialData) { // Only fetch for new grades
        setIsDataLoading(true);
        try {
          const settingsRef = doc(db, "systemSettings", "generalConfig");
          const settingsSnap = await getDoc(settingsRef);
          if (settingsSnap.exists()) {
            const settings = settingsSnap.data() as SystemSettings;
            if (settings.defaultTerm) {
              setDefaultTerm(settings.defaultTerm);
              form.setValue("term", settings.defaultTerm); 
            }
          }
        } catch (error) {
          console.error("Error fetching system defaults for GradeForm:", error);
        } finally {
          setIsDataLoading(false);
        }
      }
    };
    fetchSystemDefaults();
  }, [initialData, form]);


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

    if (!initialData) {
      const gradeQuery = query(
        collection(db, "grades"),
        where("studentId", "==", values.studentId),
        where("courseId", "==", course.id)
      );
      // Potentially add a "where("term", "==", values.term || defaultTerm)" if grades should be unique per term
      const gradeSnapshot = await getDocs(gradeQuery);
      if (!gradeSnapshot.empty) {
        // Check if any existing grade matches the current term being submitted
        const termForNewGrade = values.term || defaultTerm;
        const existingGradeForTerm = gradeSnapshot.docs.find(doc => doc.data().term === termForNewGrade);
        if (existingGradeForTerm) {
            toast({
                title: "Grade Exists",
                description: `${selectedStudent.fullName} already has a grade recorded for ${course.name} in ${termForNewGrade}. You can edit it from the table.`,
                variant: "destructive",
            });
            setIsLoading(false);
            return;
        }
      }
    }

    const status: 'Pass' | 'Fail' = values.marks >= PASS_MARK ? 'Pass' : 'Fail';

    const gradePayload: Partial<Omit<Grade, 'id'>> & { updatedAt: FieldValue, createdAt?: FieldValue } = {
        studentId: values.studentId,
        studentName: selectedStudent.fullName,
        courseId: course.id, 
        courseName: `${course.name} (${course.code})`,
        marks: values.marks,
        status,
        remarks: values.remarks,
        term: initialData ? (values.term || initialData.term) : (values.term || defaultTerm),
        updatedAt: serverTimestamp(),
        enteredByTeacherId: userProfile.uid,
        enteredByTeacherEmail: userProfile.email || undefined,
    };


    try {
      if (initialData) {
        const gradeRef = doc(db, "grades", initialData.id);
        await updateDoc(gradeRef, gradePayload);
        toast({ title: "Grade Updated", description: `Grade for ${selectedStudent.fullName} in ${course.name} updated.` });
      } else {
        gradePayload.createdAt = serverTimestamp();
        await addDoc(collection(db, "grades"), gradePayload);
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
      if (!initialData) form.reset({ studentId: "", marks: 0, remarks: "", term: defaultTerm});
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
                disabled={isDataLoading || !!initialData} 
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={isDataLoading ? "Loading students..." : (students.length === 0 ? "No students available/enrolled" : "Select a student")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isDataLoading ? (
                    <SelectItem value="loading-placeholder" disabled>Loading...</SelectItem>
                  ) : students.length === 0 ? (
                     <SelectItem value="no-students-placeholder" disabled>No students available/enrolled in this course.</SelectItem>
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
         {/* Term field is set by default, not editable in UI for now */}
        <FormField
          control={form.control}
          name="term"
          render={({ field }) => (
            <FormItem className="hidden"> {/* Hidden for now, value is set programmatically */}
              <FormLabel>Term</FormLabel>
              <FormControl>
                <Input {...field} readOnly />
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
