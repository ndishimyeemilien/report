
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
  FormDescription,
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
import { Badge } from "@/components/ui/badge"; 

const PASS_MARK = 50; // Assuming total marks are out of 100

const gradeFormSchema = z.object({
  studentId: z.string().min(1, { message: "Please select a student." }),
  ca1: z.coerce.number().min(0, "CA1 marks cannot be negative.").max(100, "CA1 marks cannot exceed 100.").optional().nullable(),
  ca2: z.coerce.number().min(0, "CA2 marks cannot be negative.").max(100, "CA2 marks cannot exceed 100.").optional().nullable(),
  exam: z.coerce.number().min(0, "Exam marks cannot be negative.").max(100, "Exam marks cannot exceed 100.").optional().nullable(),
  remarks: z.string().max(200).optional(),
  term: z.string().min(1, { message: "Term is required."}).max(50, "Term name too long."), 
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
  const [isDefaultsLoading, setIsDefaultsLoading] = useState(!initialData);
  const [calculatedTotalMarks, setCalculatedTotalMarks] = useState<number | null>(null);
  const [calculatedStatus, setCalculatedStatus] = useState<'Pass' | 'Fail' | null>(null);

  const form = useForm<GradeFormValues>({
    resolver: zodResolver(gradeFormSchema),
    defaultValues: {
      studentId: initialData?.studentId || "",
      ca1: initialData?.ca1 ?? null,
      ca2: initialData?.ca2 ?? null,
      exam: initialData?.exam ?? null,
      remarks: initialData?.remarks || "",
      term: initialData?.term || "Term 1", 
    },
  });

  const ca1Value = form.watch("ca1");
  const ca2Value = form.watch("ca2");
  const examValue = form.watch("exam");

  useEffect(() => {
    const val1 = ca1Value ?? 0;
    const val2 = ca2Value ?? 0;
    const val3 = examValue ?? 0;
    const total = val1 + val2 + val3;
    setCalculatedTotalMarks(total);
    if (typeof total === 'number' && !isNaN(total)) {
      setCalculatedStatus(total >= PASS_MARK ? 'Pass' : 'Fail');
    } else {
      setCalculatedStatus(null);
    }
  }, [ca1Value, ca2Value, examValue]);

  useEffect(() => {
    const fetchSystemDefaults = async () => {
      if (!initialData) { 
        setIsDefaultsLoading(true);
        try {
          const settingsRef = doc(db, "systemSettings", "generalConfig");
          const settingsSnap = await getDoc(settingsRef);
          if (settingsSnap.exists()) {
            const settings = settingsSnap.data() as SystemSettings;
            if (settings.defaultTerm) {
              form.setValue("term", settings.defaultTerm); 
            }
          }
        } catch (error) {
          console.error("Error fetching system defaults for GradeForm:", error);
        } finally {
          setIsDefaultsLoading(false);
        }
      } else {
        setIsDefaultsLoading(false); 
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

    const termForGrade = values.term;
    const finalTotalMarks = (values.ca1 ?? 0) + (values.ca2 ?? 0) + (values.exam ?? 0);
    const finalStatus: 'Pass' | 'Fail' = finalTotalMarks >= PASS_MARK ? 'Pass' : 'Fail';

    if (!initialData) { 
      const gradeQuery = query(
        collection(db, "grades"),
        where("studentId", "==", values.studentId),
        where("courseId", "==", course.id),
        where("term", "==", termForGrade)
      );
      const gradeSnapshot = await getDocs(gradeQuery);
      if (!gradeSnapshot.empty) {
        toast({
            title: "Grade Exists",
            description: `${selectedStudent.fullName} already has a grade recorded for ${course.name} in ${termForGrade}. You can edit it from the table.`,
            variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
    }
    
    const gradePayload: Partial<Omit<Grade, 'id'>> & { updatedAt: FieldValue, createdAt?: FieldValue } = {
        studentId: values.studentId,
        studentName: selectedStudent.fullName,
        courseId: course.id, 
        courseName: `${course.name} (${course.code})`,
        ca1: values.ca1 ?? null,
        ca2: values.ca2 ?? null,
        exam: values.exam ?? null,
        totalMarks: finalTotalMarks,
        status: finalStatus,
        remarks: values.remarks,
        term: termForGrade,
        updatedAt: serverTimestamp(),
        enteredByTeacherId: userProfile.uid,
        enteredByTeacherEmail: userProfile.email || undefined,
    };

    try {
      if (initialData) {
        const gradeRef = doc(db, "grades", initialData.id);
        // When editing, term should not change via this form for simplicity
        const updatePayload = {...gradePayload, term: initialData.term}; 
        await updateDoc(gradeRef, updatePayload);
        toast({ title: "Grade Updated", description: `Grade for ${selectedStudent.fullName} in ${course.name} updated.` });
      } else {
        gradePayload.createdAt = serverTimestamp();
        await addDoc(collection(db, "grades"), gradePayload);
        toast({ title: "Grade Added", description: `Grade for ${selectedStudent.fullName} in ${course.name} added for ${termForGrade}.` });
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
      if (!initialData) form.reset({ studentId: "", ca1: null, ca2: null, exam: null, remarks: "", term: form.getValues("term")});
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
                disabled={isDefaultsLoading || !!initialData} 
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={isDefaultsLoading ? "Loading..." : (students.length === 0 ? "No students available/enrolled" : "Select a student")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isDefaultsLoading && !initialData ? ( 
                    <SelectItem value="loading-placeholder" disabled>Loading student options...</SelectItem>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
            control={form.control}
            name="ca1"
            render={({ field }) => (
                <FormItem>
                <FormLabel>CA1 Marks</FormLabel>
                <FormControl>
                    <Input type="number" placeholder="e.g., 15" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormDescription className="text-xs">Continuous Assessment 1</FormDescription>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="ca2"
            render={({ field }) => (
                <FormItem>
                <FormLabel>CA2 Marks</FormLabel>
                <FormControl>
                    <Input type="number" placeholder="e.g., 18" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormDescription className="text-xs">Continuous Assessment 2</FormDescription>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="exam"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Exam Marks</FormLabel>
                <FormControl>
                    <Input type="number" placeholder="e.g., 55" {...field} value={field.value ?? ""}/>
                </FormControl>
                <FormDescription className="text-xs">Final Exam</FormDescription>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <div className="space-y-1">
            <FormLabel>Calculated Total & Status</FormLabel>
            <div className="flex items-center gap-4 p-2 border rounded-md bg-muted/50">
                <p className="text-sm">Total Marks: <span className="font-semibold">{calculatedTotalMarks ?? "N/A"} / 100</span></p>
                {calculatedStatus && (
                    <Badge 
                    variant={calculatedStatus === 'Pass' ? 'default' : 'destructive'} 
                    className={`${calculatedStatus === 'Pass' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
                    >
                    Status: {calculatedStatus}
                    </Badge>
                )}
            </div>
        </div>

        <FormField
          control={form.control}
          name="term"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Term</FormLabel>
              <FormControl>
                <Input 
                  placeholder={isDefaultsLoading && !initialData ? "Loading default term..." : "e.g., Term 1"} 
                  {...field} 
                  readOnly={!!initialData} 
                  disabled={isDefaultsLoading && !initialData}
                />
              </FormControl>
              {!!initialData && <p className="text-xs text-muted-foreground">Term cannot be changed for existing grades.</p>}
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
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading || isDefaultsLoading}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading || isDefaultsLoading || (students.length === 0 && !isDefaultsLoading)} className="bg-accent hover:bg-accent/90">
            {(isLoading || isDefaultsLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Update Grade" : "Add Grade"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
