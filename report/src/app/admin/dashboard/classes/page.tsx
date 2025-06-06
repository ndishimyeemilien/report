
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClassForm } from "@/components/classes/ClassForm"; 
import type { Class, ClassCourseAssignment } from "@/types";
import { db } from "@/lib/firebase";
import { collection, deleteDoc, doc, getDocs, query, orderBy, Timestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import { PlusCircle, Edit3, Trash2, Archive, Loader2, AlertTriangle, UserCircle, CalendarDays, ListChecks } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export default function AdminManageClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const { toast } = useToast();

  const fetchClasses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const classesQuery = query(collection(db, "classes"), orderBy("createdAt", "desc"));
      const classAssignmentsQuery = query(collection(db, "classAssignments"));

      const [classesSnapshot, classAssignmentsSnapshot] = await Promise.all([
        getDocs(classesQuery),
        getDocs(classAssignmentsQuery),
      ]);

      const classAssignmentsData = classAssignmentsSnapshot.docs.map(doc => doc.data() as ClassCourseAssignment);
      
      const assignmentsCountMap = new Map<string, number>();
      classAssignmentsData.forEach(assignment => {
        assignmentsCountMap.set(assignment.classId, (assignmentsCountMap.get(assignment.classId) || 0) + 1);
      });

      const classesData = classesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate(), 
        updatedAt: (doc.data().updatedAt as Timestamp)?.toDate(),
        assignedCoursesCount: assignmentsCountMap.get(doc.id) || 0,
      })) as Class[];
      setClasses(classesData);
    } catch (err: any) {
      console.error("Error fetching classes and assignments: ", err);
      setError("Failed to load classes. Please try again.");
      toast({ title: "Error", description: "Failed to load classes.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleEdit = (classItem: Class) => {
    setEditingClass(classItem);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingClass(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (classId: string, className: string) => {
    try {
      // Consider adding checks here if class is associated with students/enrollments before deleting
      await deleteDoc(doc(db, "classes", classId));
      toast({ title: "Class Deleted", description: `Class "${className}" has been deleted.` });
      fetchClasses(); 
    } catch (error: any) {
      console.error("Error deleting class: ", error);
      toast({ title: "Delete Failed", description: error.message || "Could not delete class. Check if it's used in enrollments or assignments.", variant: "destructive" });
    }
  };
  
  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Manage Classes (Admin)</h1>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew} className="bg-accent hover:bg-accent/90">
              <PlusCircle className="mr-2 h-5 w-5" /> Add New Class
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg bg-card">
            <DialogHeader>
              <DialogTitle className="text-xl">{editingClass ? "Edit Class" : "Add New Class"}</DialogTitle>
              <DialogDescription>
                {editingClass ? "Update the details of this class." : "Fill in the details to add a new class."}
              </DialogDescription>
            </DialogHeader>
            <ClassForm 
              initialData={editingClass} 
              onClose={() => {
                setIsFormOpen(false);
                setEditingClass(null);
                fetchClasses(); 
              }} 
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg text-muted-foreground">Loading classes...</p>
        </div>
      )}

      {!isLoading && error && (
        <Card className="bg-destructive/10 border-destructive">
          <CardHeader className="flex flex-row items-center gap-2">
             <AlertTriangle className="h-6 w-6 text-destructive" />
            <CardTitle className="text-destructive">Error Loading Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive-foreground">{error}</p>
            <Button onClick={fetchClasses} variant="outline" className="mt-4">Try Again</Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && classes.length === 0 && (
        <Card className="text-center py-12">
          <CardHeader>
            <div className="mx-auto bg-secondary rounded-full p-3 w-fit">
             <Archive className="h-12 w-12 text-muted-foreground" data-ai-hint="archive box empty" />
            </div>
            <CardTitle className="mt-4 text-2xl">No Classes Found</CardTitle>
            <CardDescription>
              Get started by adding the first class. Click the "Add New Class" button.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {!isLoading && !error && classes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Class List</CardTitle>
            <CardDescription>A list of all student classes in the system.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-20rem)]">
              <div className="space-y-4">
                {classes.map((classItem) => (
                  <Card key={classItem.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg text-primary">{classItem.name}</CardTitle>
                          <CardDescription className="pt-1 text-sm">
                            {classItem.description || "No description provided."}
                          </CardDescription>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {classItem.academicYear && (
                              <Badge variant="outline" className="text-xs">
                                <CalendarDays className="mr-1.5 h-3 w-3" />
                                Year: {classItem.academicYear}
                              </Badge>
                            )}
                            {classItem.secretaryName && (
                              <Badge variant="secondary" className="text-xs">
                                <UserCircle className="mr-1.5 h-3 w-3" />
                                Managed by: {classItem.secretaryName.split('@')[0]}
                              </Badge>
                            )}
                             <Badge variant="outline" className="text-xs">
                                <ListChecks className="mr-1.5 h-3 w-3" />
                                Assigned Courses: {classItem.assignedCoursesCount || 0}
                              </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleEdit(classItem)}>
                            <Edit3 className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="icon" className="h-8 w-8">
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the class "{classItem.name}".
                                  This may affect existing student enrollments and course assignments for this class.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(classItem.id, classItem.name)} className="bg-destructive hover:bg-destructive/90">
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardHeader>
                     <CardContent className="text-xs text-muted-foreground">
                        <p>Created: {formatDate(classItem.createdAt)}</p>
                        <p>Last Updated: {formatDate(classItem.updatedAt)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

