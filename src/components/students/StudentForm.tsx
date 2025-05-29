
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
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

const studentFormSchema = z.object({
  fullName: z.string().min(3, { message: "Full name must be at least 3 characters." }).max(100),
  studentSystemId: z.string().max(50).optional().describe("School's unique ID for the student, e.g., S1001"),
  email: z.string().email({ message: "Invalid email address." }).optional().or(z.literal("")),
  gender: z.enum(['Male', 'Female', 'Other', '']).optional(),
  classId: z.string().optional(),
  dateOfBirth: z.string().optional(), 
  placeOfBirth: z.string().max(100).optional(),
});

type StudentFormValues = z.infer<typeof studentFormSchema>;

interface StudentFormProps {
  initialData?: Student | null;
  onClose?: () => void;
}

const NONE_CLASS_VALUE = "_NONE_";
const NONE_GENDER_VALUE = "";

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
      gender: initialData.gender || NONE_GENDER_VALUE,
      classId: initialData.classId || "",
      dateOfBirth: initialData.dateOfBirth ? format(parseISO(initialData.dateOfBirth), "yyyy-MM-dd") : "",
      placeOfBirth: initialData.placeOfBirth || "",
    } : {
      fullName: "",
      studentSystemId: "",
      email: "",
      gender: NONE_GENDER_VALUE,
      classId: "",
      dateOfBirth: "",
      placeOfBirth: "",
    },
  });

  const onSubmit = async (values: StudentFormValues) => {
    setIsLoading(true);
    
    const studentData: Partial<Omit<Student, 'id' | 'createdAt' | 'updatedAt'>> & { updatedAt: FieldValue } & Record<string, any> = {
        fullName: values.fullName,
        updatedAt: serverTimestamp(),
    };

    if (values.studentSystemId && values.studentSystemId.trim() !== "") {
        studentData.studentSystemId = values.studentSystemId.trim();
    } else if (initialData?.id) { 
        studentData.studentSystemId = deleteField();
    }

    if (values.email && values.email.trim() !== "") {
        studentData.email = values.email.trim();
    } else if (initialData?.id) { 
        studentData.email = deleteField();
    }

    if (values.gender && values.gender !== NONE_GENDER_VALUE) {
        studentData.gender = values.gender;
    } else if (initialData?.id) {
        studentData.gender = deleteField();
    }
    
    if (values.classId && values.classId !== NONE_CLASS_VALUE) {
      const selectedClass = classes.find(c => c.id === values.classId);
      studentData.classId = values.classId;
      studentData.className = selectedClass?.name || "";
    } else {
      studentData.classId = deleteField();
      studentData.className = deleteField();
    }

    if (values.dateOfBirth) {
        studentData.dateOfBirth = values.dateOfBirth; 
    } else if (initialData?.id) {
        studentData.dateOfBirth = deleteField();
    }

    if (values.placeOfBirth && values.placeOfBirth.trim() !== "") {
        studentData.placeOfBirth = values.placeOfBirth.trim();
    } else if (initialData?.id) {
        studentData.placeOfBirth = deleteField();
    }
    
    try {
      if (initialData?.id) {
        const studentRef = doc(db, "students", initialData.id);
        await updateDoc(studentRef, studentData);
        toast({ title: "Student Updated", description: `Student "${values.fullName}" has been successfully updated.` });
      } else {
        const dataForAdd = {
            ...studentData,
            createdAt: serverTimestamp(),
        };
        Object.keys(dataForAdd).forEach(key => {
            if (dataForAdd[key as keyof typeof dataForAdd] === undefined && key !== 'createdAt' && key !== 'updatedAt' && key !== 'fullName') {
                delete dataForAdd[key as keyof typeof dataForAdd];
            }
        });
        await addDoc(collection(db, "students"), dataForAdd);
        toast({ title: "Student Added", description: `Student "${values.fullName}" has been successfully added.` });
      }
      router.refresh(); 
      if (onClose) onClose(); 
    } catch (error: any) {
      console.error("Student form error:", error);
      toast({
        title: initialData?.id ? "Update Failed" : "Add Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      if (!initialData?.id) form.reset({ fullName: "", studentSystemId: "", email: "", gender: NONE_GENDER_VALUE, classId: "", dateOfBirth: "", placeOfBirth: ""}); 
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            name="gender"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Gender (Optional)</FormLabel>
                <Select
                    onValueChange={field.onChange}
                    value={field.value || NONE_GENDER_VALUE}
                >
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    <SelectItem value={NONE_GENDER_VALUE}>-- Select Gender --</SelectItem>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="dateOfBirth"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                <FormLabel>Date of Birth (Optional)</FormLabel>
                 <Popover>
                    <PopoverTrigger asChild>
                    <FormControl>
                        <Button
                        variant={"outline"}
                        className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                        )}
                        >
                        {field.value ? (
                            format(parseISO(field.value), "PPP")
                        ) : (
                            <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                    </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={field.value ? parseISO(field.value) : undefined}
                        onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                        disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                    />
                    </PopoverContent>
                </Popover>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="placeOfBirth"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Place of Birth (Optional)</FormLabel>
                <FormControl>
                    <Input placeholder="e.g., Kigali" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
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
