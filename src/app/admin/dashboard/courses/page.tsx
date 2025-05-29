
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CourseForm } from "@/components/courses/CourseForm";
import type { Course } from "@/types";
import { db } from "@/lib/firebase";
import { collection, deleteDoc, doc, getDocs, query, orderBy, Timestamp, where } from "firebase/firestore";
import { useEffect, useState, useMemo } from "react";
import { PlusCircle, Edit3, Trash2, BookOpen, Loader2, AlertTriangle, UserCheck, Filter, Briefcase } from "lucide-react"; // Added Briefcase
import { Label as FormLabel } from "@/components/ui/label"; 
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
  AlertDialogTrigger as AlertDialogTriggerComponent, 
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { subjectData, categories as predefinedCategories, getCombinationsForCategory } from "@/lib/course-structure-data";

export default function CoursesPage() {
  const [allCourses, setAllCourses] = useState<Course[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null); 
  
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedCombination, setSelectedCombination] = useState<string>("");

  const { toast } = useToast();

  const combinationsForSelectedCategory = useMemo(() => {
    if (selectedCategory) {
      return getCombinationsForCategory(selectedCategory);
    }
    return [];
  }, [selectedCategory]);

  const filteredCourses = useMemo(() => {
    if (!selectedCategory || !selectedCombination) {
      return []; 
    }
    return allCourses.filter(
      course => course.category === selectedCategory && course.combination === selectedCombination
    );
  }, [allCourses, selectedCategory, selectedCombination]);


  const fetchAllSubjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const q = query(collection(db, "courses"), orderBy("category"), orderBy("combination"), orderBy("name"));
      const querySnapshot = await getDocs(q);
      const coursesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate(), 
        updatedAt: (doc.data().updatedAt as Timestamp)?.toDate(),
      })) as Course[];
      setAllCourses(coursesData);
    } catch (err: any) {
      console.error("Error fetching subjects: ", err);
      setError("Failed to load subjects. Please try again.");
      toast({ title: "Error", description: "Failed to load subjects.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllSubjects();
  }, []);

  useEffect(() => {
    setSelectedCombination("");
  }, [selectedCategory]);

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setIsFormOpen(true);
  };

  const handleAddNewSubject = () => {
    if (!selectedCategory || !selectedCombination) {
      toast({title: "Selection Required", description: "Please select a category and combination first.", variant: "default"});
      return;
    }
    setEditingCourse(null); 
    setIsFormOpen(true);
  };

  const handleDelete = async (courseId: string, courseName: string) => {
    try {
      await deleteDoc(doc(db, "courses", courseId));
      toast({ title: "Subject Deleted", description: `Subject "${courseName}" has been deleted.` });
      fetchAllSubjects(); 
    } catch (error: any) {
      console.error("Error deleting subject: ", error);
      toast({ title: "Delete Failed", description: error.message || "Could not delete subject.", variant: "destructive" });
    }
  };
  
  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Manage Subjects</h1>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={handleAddNewSubject} 
              className="bg-accent hover:bg-accent/90"
              disabled={!selectedCategory || !selectedCombination || isLoading}
            >
              <PlusCircle className="mr-2 h-5 w-5" /> Add New Subject
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg bg-card">
            <DialogHeader>
              <DialogTitle className="text-xl">{editingCourse ? "Edit Subject" : `Add New Subject to ${selectedCombination}`}</DialogTitle>
              <DialogDescription>
                {editingCourse ? "Update the details of this subject." : `Fill in the details for the new subject in ${selectedCategory} - ${selectedCombination}.`}
              </DialogDescription>
            </DialogHeader>
            <CourseForm 
              initialData={editingCourse} 
              selectedCategory={editingCourse ? editingCourse.category : selectedCategory}
              selectedCombination={editingCourse ? editingCourse.combination : selectedCombination}
              onClose={() => {
                setIsFormOpen(false);
                setEditingCourse(null);
                fetchAllSubjects(); 
              }} 
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="mb-8 shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5 text-primary"/> Filter Subjects</CardTitle>
          <CardDescription>Select a category and then a combination/option to view and manage its subjects.</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div>
            <FormLabel htmlFor="category-select">Category</FormLabel>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger id="category-select" className="w-full">
                <SelectValue placeholder="-- Select Category --" />
              </SelectTrigger>
              <SelectContent>
                {predefinedCategories
                  .filter(cat => cat !== "") 
                  .map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <FormLabel htmlFor="combination-select">Combination / Option</FormLabel>
            <Select value={selectedCombination} onValueChange={setSelectedCombination} disabled={!selectedCategory || combinationsForSelectedCategory.length === 0}>
              <SelectTrigger id="combination-select" className="w-full">
                <SelectValue placeholder={!selectedCategory ? "Select category first" : (combinationsForSelectedCategory.length === 0 ? "No combinations in category" : "-- Select Combination --")} />
              </SelectTrigger>
              <SelectContent>
                {combinationsForSelectedCategory
                  .filter(combo => combo !== "")
                  .map(combo => (
                  <SelectItem key={combo} value={combo}>{combo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>


      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg text-muted-foreground">Loading subjects...</p>
        </div>
      )}

      {!isLoading && error && (
        <Card className="bg-destructive/10 border-destructive">
          <CardHeader className="flex flex-row items-center gap-2">
             <AlertTriangle className="h-6 w-6 text-destructive" />
            <CardTitle className="text-destructive">Error Loading Subjects</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive-foreground">{error}</p>
            <Button onClick={fetchAllSubjects} variant="outline" className="mt-4">Try Again</Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && selectedCategory && selectedCombination && filteredCourses.length === 0 && (
        <Card className="text-center py-12">
          <CardHeader>
            <div className="mx-auto bg-secondary rounded-full p-3 w-fit">
             <BookOpen className="h-12 w-12 text-muted-foreground" data-ai-hint="book education" />
            </div>
            <CardTitle className="mt-4 text-2xl">No Subjects Found for {selectedCombination}</CardTitle>
            <CardDescription>
              There are no subjects defined for {selectedCategory} - {selectedCombination}. 
              Click "Add New Subject" to add one.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
      
      {!isLoading && !error && !(selectedCategory && selectedCombination) && (
         <Card className="text-center py-12">
          <CardHeader>
            <div className="mx-auto bg-secondary rounded-full p-3 w-fit">
             <Filter className="h-12 w-12 text-muted-foreground" data-ai-hint="filter funnel" />
            </div>
            <CardTitle className="mt-4 text-2xl">Select Category and Combination</CardTitle>
            <CardDescription>
              Please select a category and combination above to view or manage subjects.
            </CardDescription>
          </CardHeader>
        </Card>
      )}


      {!isLoading && !error && selectedCategory && selectedCombination && filteredCourses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Subjects for: {selectedCategory} - {selectedCombination}</CardTitle>
            <CardDescription>A list of all subjects within this category and combination.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-30rem)]"> 
              <div className="space-y-4">
                {filteredCourses.map((course) => (
                  <Card key={course.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg text-primary">{course.name} ({course.code})</CardTitle>
                          <CardDescription className="pt-1 text-sm">
                            {course.description || "No description provided."}
                          </CardDescription>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {course.teacherName && (
                                <Badge variant="secondary" className="mt-2 text-xs">
                                <UserCheck className="mr-1.5 h-3 w-3" />
                                Teacher: {course.teacherName}
                                </Badge>
                            )}
                            {course.department && (
                                <Badge variant="outline" className="mt-2 text-xs">
                                <Briefcase className="mr-1.5 h-3 w-3" />
                                Department: {course.department}
                                </Badge>
                            )}
                           </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleEdit(course)}>
                            <Edit3 className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTriggerComponent asChild>
                              <Button variant="destructive" size="icon" className="h-8 w-8">
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </AlertDialogTriggerComponent>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the subject "{course.name}"
                                  and any associated data (grades, enrollments).
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
