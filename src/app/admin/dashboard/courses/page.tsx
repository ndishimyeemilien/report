
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CourseForm } from "@/components/courses/CourseForm";
import type { Course } from "@/types";
import { db } from "@/lib/firebase";
import { collection, deleteDoc, doc, getDocs, query, orderBy, Timestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import { PlusCircle, Edit3, Trash2, BookOpen, Loader2, AlertTriangle, UserCheck } from "lucide-react";
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
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const { toast } = useToast();

  const fetchCourses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const q = query(collection(db, "courses"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const coursesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate(), 
        updatedAt: (doc.data().updatedAt as Timestamp)?.toDate(),
      })) as Course[];
      setCourses(coursesData);
    } catch (err: any) {
      console.error("Error fetching courses: ", err);
      setError("Failed to load courses. Please try again.");
      toast({ title: "Error", description: "Failed to load courses.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingCourse(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (courseId: string, courseName: string) => {
    try {
      await deleteDoc(doc(db, "courses", courseId));
      toast({ title: "Course Deleted", description: `Course "${courseName}" has been deleted.` });
      fetchCourses(); 
    } catch (error: any) {
      console.error("Error deleting course: ", error);
      toast({ title: "Delete Failed", description: error.message || "Could not delete course.", variant: "destructive" });
    }
  };
  
  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Manage Courses</h1>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew} className="bg-accent hover:bg-accent/90">
              <PlusCircle className="mr-2 h-5 w-5" /> Add New Course
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg bg-card">
            <DialogHeader>
              <DialogTitle className="text-xl">{editingCourse ? "Edit Course" : "Add New Course"}</DialogTitle>
              <DialogDescription>
                {editingCourse ? "Update the details of this course." : "Fill in the details to add a new course."}
              </DialogDescription>
            </DialogHeader>
            <CourseForm 
              initialData={editingCourse} 
              onClose={() => {
                setIsFormOpen(false);
                setEditingCourse(null);
                fetchCourses(); 
              }} 
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg text-muted-foreground">Loading courses...</p>
        </div>
      )}

      {!isLoading && error && (
        <Card className="bg-destructive/10 border-destructive">
          <CardHeader className="flex flex-row items-center gap-2">
             <AlertTriangle className="h-6 w-6 text-destructive" />
            <CardTitle className="text-destructive">Error Loading Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive-foreground">{error}</p>
            <Button onClick={fetchCourses} variant="outline" className="mt-4">Try Again</Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && courses.length === 0 && (
        <Card className="text-center py-12">
          <CardHeader>
            <div className="mx-auto bg-secondary rounded-full p-3 w-fit">
             <BookOpen className="h-12 w-12 text-muted-foreground" data-ai-hint="book education" />
            </div>
            <CardTitle className="mt-4 text-2xl">No Courses Found</CardTitle>
            <CardDescription>
              Get started by adding your first course. Click the "Add New Course" button.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {!isLoading && !error && courses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Course List</CardTitle>
            <CardDescription>A list of all available courses in the system.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-20rem)]">
              <div className="space-y-4">
                {courses.map((course) => (
                  <Card key={course.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg text-primary">{course.name} ({course.code})</CardTitle>
                          <CardDescription className="pt-1 text-sm">
                            {course.description || "No description provided."}
                          </CardDescription>
                           {course.teacherName && (
                            <Badge variant="secondary" className="mt-2 text-xs">
                              <UserCheck className="mr-1.5 h-3 w-3" />
                              Teacher: {course.teacherName}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleEdit(course)}>
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
                                  This action cannot be undone. This will permanently delete the course "{course.name}"
                                  and any associated data.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(course.id, course.name)} className="bg-destructive hover:bg-destructive/90">
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardHeader>
                     <CardContent className="text-xs text-muted-foreground">
                        <p>Created: {formatDate(course.createdAt)}</p>
                        <p>Last Updated: {formatDate(course.updatedAt)}</p>
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
