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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import type { Student, Class } from "@/types";
import { addDoc, collection, doc, serverTimestamp, updateDoc, getDocs, query, orderBy, deleteField, type FieldValue } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

const studentFormSchema = z.object({
  fullName: z.string().min(3, { message: "Full name must be at least 3 characters." }).max(100),
  studentSystemId: z.string().max(50).optional().describe("School's unique ID for the student, e.g., S1001"),
  email: z.string().email({ message: "Invalid email address." }).optional().or(z.literal("")),
  classId: z.string().optional(),
});

type StudentFormValues = z.infer<typeof studentFormSchema>;

interface StudentFormProps {
  initialData?: Student | null;
  onClose?: () => void;
}

const NONE_CLASS_VALUE = "_NONE_";

export function StudentForm({ initialData, onClose }: StudentFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isClassesLoading, setIsClassesLoading] = useState(true);

  useEffect(() => {
    const fetchClasses = async () => {
      setIsClassesLoading(true);
      try {
        const q = query(collection(db, "classes"), orderBy("name", "asc"));
        const querySnapshot = await getDocs(q);
        const classesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Class));
        setClasses(classesData);
      } catch (error) {
        console.error("Error fetching classes: ", error);
        toast({ title: "Error", description: "Could not load classes list.", variant: "destructive" });
      } finally {
        setIsClassesLoading(false);
      }
    };
    fetchClasses();
  }, [toast]);

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: initialData ? {
      fullName: initialData.fullName,
      studentSystemId: initialData.studentSystemId || "",
      email: initialData.email || "",
      classId: initialData.classId || "",
    } : {
      fullName: "",
      studentSystemId: "",
      email: "",
      classId: "",
    },
  });

  const onSubmit = async (values: StudentFormValues) => {
    setIsLoading(true);
    
    const studentData: Partial<Omit<Student, 'id' | 'createdAt' | 'updatedAt'>> & { updatedAt: FieldValue, classId?: string | FieldValue, className?: string | FieldValue } = {
        fullName: values.fullName,
        studentSystemId: values.studentSystemId || "",
        email: values.email || "",
        updatedAt: serverTimestamp(),
    };

    if (values.classId && values.classId !== NONE_CLASS_VALUE) {
      const selectedClass = classes.find(c => c.id === values.classId);
      studentData.classId = values.classId;
      studentData.className = selectedClass?.name || "";
    } else {
      // If "None" is selected or classId is empty, remove the fields
      studentData.classId = deleteField();
      studentData.className = deleteField();
    }
    
    // Ensure empty strings are not saved for optional fields, prefer undefined or deleteField
    if (!studentData.studentSystemId) delete studentData.studentSystemId;
    if (!studentData.email) delete studentData.email;


    try {
      if (initialData) {
        const studentRef = doc(db, "students", initialData.id);
        await updateDoc(studentRef, studentData);
        toast({ title: "Student Updated", description: `Student "${values.fullName}" has been successfully updated.` });
      } else {
        await addDoc(collection(db, "students"), {
          ...studentData,
          createdAt: serverTimestamp(),
        });
        toast({ title: "Student Added", description: `Student "${values.fullName}" has been successfully added.` });
      }
      router.refresh(); 
      if (onClose) onClose(); 
    } catch (error: any) {
      console.error("Student form error:", error);
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
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Jane Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="studentSystemId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Student ID (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., S1001, 2024005" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email (Optional)</FormLabel>
              <FormControl>
                <Input type="email" placeholder="e.g., jane.doe@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="classId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assign to Class (Optional)</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(value === NONE_CLASS_VALUE ? "" : value)}
                value={!field.value ? NONE_CLASS_VALUE : field.value}
                disabled={isClassesLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={isClassesLoading ? "Loading classes..." : "Select a class"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isClassesLoading ? (
                    <SelectItem value="loading-classes-placeholder" disabled>Loading...</SelectItem>
                  ) : (
                    <>
                      <SelectItem value={NONE_CLASS_VALUE}>-- None --</SelectItem>
                      {classes.length === 0 && (
                        <SelectItem value="no-classes-placeholder" disabled>No classes available.</SelectItem>
                      )}
                      {classes.map(cls => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
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
          <Button type="submit" disabled={isLoading || isClassesLoading} className="bg-accent hover:bg-accent/90">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Update Student" : "Add Student"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
