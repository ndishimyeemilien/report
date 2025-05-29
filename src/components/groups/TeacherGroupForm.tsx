
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import type { TeacherGroup, UserProfile } from "@/types";
import { addDoc, collection, doc, serverTimestamp, updateDoc, type FieldValue, deleteField, getDocs, query, where } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const teacherGroupFormSchema = z.object({
  name: z.string().min(2, { message: "Group name must be at least 2 characters." }).max(100),
  description: z.string().max(500).optional(),
  memberTeacherIds: z.array(z.string()).optional(),
});

type TeacherGroupFormValues = z.infer<typeof teacherGroupFormSchema>;

interface TeacherGroupFormProps {
  initialData?: TeacherGroup | null;
  onClose?: () => void;
}

export function TeacherGroupForm({ initialData, onClose }: TeacherGroupFormProps) {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [allTeachers, setAllTeachers] = useState<UserProfile[]>([]);
  const [isTeachersLoading, setIsTeachersLoading] = useState(true);

  const form = useForm<TeacherGroupFormValues>({
    resolver: zodResolver(teacherGroupFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      memberTeacherIds: initialData?.memberTeacherIds || [],
    },
  });

  useEffect(() => {
    const fetchTeachers = async () => {
      setIsTeachersLoading(true);
      try {
        const teachersQuery = query(collection(db, "users"), where("role", "==", "Teacher"));
        const teachersSnapshot = await getDocs(teachersQuery);
        const teachersData = teachersSnapshot.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile));
        setAllTeachers(teachersData);
      } catch (error) {
        console.error("Error fetching teachers:", error);
        toast({ title: "Error", description: "Could not load teachers list.", variant: "destructive" });
      } finally {
        setIsTeachersLoading(false);
      }
    };
    fetchTeachers();
  }, [toast]);
  
  // Effect to reset memberTeacherIds in form when initialData changes (e.g. opening form for different group)
   useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        description: initialData.description || "",
        memberTeacherIds: initialData.memberTeacherIds || [],
      });
    } else {
       form.reset({
        name: "",
        description: "",
        memberTeacherIds: [],
      });
    }
  }, [initialData, form]);


  const onSubmit = async (values: TeacherGroupFormValues) => {
    setIsLoading(true);
    if (!currentUser) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const dataToSave: Partial<Omit<TeacherGroup, 'id' | 'createdAt' | 'updatedAt'>> & { updatedAt: FieldValue, createdBy?: string, description?: string | FieldValue | null, memberTeacherIds: string[] } = {
      name: values.name,
      memberTeacherIds: values.memberTeacherIds || [],
      updatedAt: serverTimestamp(),
    };

    if (values.description && values.description.trim() !== "") {
        dataToSave.description = values.description;
    } else {
        dataToSave.description = initialData?.id ? deleteField() : null; 
    }


    try {
      if (initialData?.id) {
        const groupRef = doc(db, "teacherGroups", initialData.id);
        await updateDoc(groupRef, dataToSave);
        toast({ title: "Teacher Group Updated", description: `Group "${values.name}" has been updated.` });
      } else {
        const fullDataForAdd = {
            ...dataToSave,
            createdBy: currentUser.uid,
            createdAt: serverTimestamp() as unknown as Date, // Firestore handles this
        };
        await addDoc(collection(db, "teacherGroups"), fullDataForAdd);
        toast({ title: "Teacher Group Added", description: `Group "${values.name}" has been added.` });
      }
      if (onClose) onClose();
    } catch (error: any) {
      console.error("Teacher group form error:", error);
      toast({
        title: initialData?.id ? "Update Failed" : "Add Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      if (!initialData?.id) form.reset({ name: "", description: "", memberTeacherIds: [] });
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
              <FormLabel>Group Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Science Department Team, Grade 10 Teachers" {...field} />
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
                  placeholder="Briefly describe the purpose or focus of this group."
                  className="resize-none"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
            control={form.control}
            name="memberTeacherIds"
            render={() => (
                <FormItem>
                <div className="mb-4">
                    <FormLabel className="text-base">Assign Teachers to Group</FormLabel>
                    <FormDescription>
                    Select the teachers who should be members of this group.
                    </FormDescription>
                </div>
                {isTeachersLoading ? (
                    <div className="flex items-center space-x-2">
                        <Loader2 className="h-5 w-5 animate-spin" /> <span>Loading teachers...</span>
                    </div>
                ) : allTeachers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No teachers available to assign.</p>
                ) : (
                    <ScrollArea className="h-40 rounded-md border p-2">
                        {allTeachers.map((teacher) => (
                            <FormField
                            key={teacher.uid}
                            control={form.control}
                            name="memberTeacherIds"
                            render={({ field }) => {
                                return (
                                <FormItem
                                    key={teacher.uid}
                                    className="flex flex-row items-start space-x-3 space-y-0 py-2"
                                >
                                    <FormControl>
                                    <Checkbox
                                        checked={field.value?.includes(teacher.uid)}
                                        onCheckedChange={(checked) => {
                                        return checked
                                            ? field.onChange([...(field.value || []), teacher.uid])
                                            : field.onChange(
                                                (field.value || []).filter(
                                                (value) => value !== teacher.uid
                                                )
                                            );
                                        }}
                                    />
                                    </FormControl>
                                    <FormLabel className="font-normal text-sm">
                                        {teacher.email}
                                    </FormLabel>
                                </FormItem>
                                );
                            }}
                            />
                        ))}
                    </ScrollArea>
                )}
                <FormMessage />
                </FormItem>
            )}
        />
        
        <div className="flex justify-end gap-2">
          {onClose && (
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading || isTeachersLoading}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading || isTeachersLoading} className="bg-accent hover:bg-accent/90">
            {(isLoading || isTeachersLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData?.id ? "Update Group" : "Add Group"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
