"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GradeForm } from "@/components/grades/GradeForm";
import type { Grade, Course, Student, Enrollment } from "@/types"; // Added Student and Enrollment
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { collection, deleteDoc, doc, getDocs, query, orderBy, Timestamp, where, documentId } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { PlusCircle, Edit3, Trash2, ClipboardList, Loader2, AlertTriangle, User, Info, BookOpen, Users } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSearchParams } from "next/navigation";
import Link from "next/link";


export default function TeacherGradesPage() {
  const { userProfile, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const preselectedCourseId = searchParams.get('courseId');
  
  const [grades, setGrades] = useState<Grade[]>([]);
  const [assignedCourses, setAssignedCourses] = useState<Course[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]); // Students enrolled in selected course
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(preselectedCourseId);
  const [isLoading, setIsLoading] = useState(true);
  const [isGradesLoading, setIsGradesLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const { toast } = useToast();

  // Fetch assigned courses for the teacher
  useEffect(() => {
    if (!userProfile || authLoading) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const fetchAssignedCourses = async () => {
      try {
        const q = query(collection(db, "courses"), where("teacherId", "==", userProfile.uid), orderBy("name"));
        const querySnapshot = await getDocs(q);
        const coursesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Course[];
        setAssignedCourses(coursesData);
        if (coursesData.length > 0 && !selectedCourseId) {
          setSelectedCourseId(coursesData[0].id); 
        } else if (preselectedCourseId && !coursesData.find(c => c.id === preselectedCourseId)) {
           toast({title:"Course Not Found", description: "The previously selected course is not assigned to you or does not exist.", variant: "destructive"});
           setSelectedCourseId(coursesData.length > 0 ? coursesData[0].id : null);
        }
      } catch (err) {
        console.error("Error fetching assigned courses: ", err);
        toast({ title: "Error", description: "Could not load your courses.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchAssignedCourses();
  }, [userProfile, authLoading, toast, preselectedCourseId, selectedCourseId]);

  // Fetch grades AND enrolled students for the selected course
  const fetchCourseData = async (courseId: string | null) => {
    if (!courseId || !userProfile) {
      setGrades([]);
      setEnrolledStudents([]);
      setIsGradesLoading(false);
      return;
    }
    setIsGradesLoading(true);
    try {
      // Fetch Grades
      const gradesQuery = query(
        collection(db, "grades"), 
        where("courseId", "==", courseId),
        orderBy("studentName", "asc")
      );
      const gradesSnapshot = await getDocs(gradesQuery);
      const gradesData = gradesSnapshot.docs.map(gradeDoc => ({ 
        id: gradeDoc.id,
        ...gradeDoc.data(),
        createdAt: (gradeDoc.data().createdAt as Timestamp)?.toDate(),
        updatedAt: (gradeDoc.data().updatedAt as Timestamp)?.toDate(),
      })) as Grade[];
      setGrades(gradesData);

      // Fetch Enrollments for this course
      const enrollmentsQuery = query(collection(db, "enrollments"), where("courseId", "==", courseId));
      const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
      const studentIdsInCourse = enrollmentsSnapshot.docs.map(enrollmentDoc => (enrollmentDoc.data() as Enrollment).studentId);

      if (studentIdsInCourse.length > 0) {
        // Fetch student details for enrolled students
        // Firestore 'in' query limitation: max 30 elements in array. For more, batch queries.
        const studentBatches: string[][] = [];
        for (let i = 0; i < studentIdsInCourse.length; i += 30) { // Firestore 'in' query supports up to 30 elements
            studentBatches.push(studentIdsInCourse.slice(i, i + 30));
        }
        
        let studentsData: Student[] = [];
        for (const batch of studentBatches) {
            if (batch.length > 0) { 
                const studentsQuery = query(collection(db, "students"), where(documentId(), "in", batch));
                const studentsSnapshot = await getDocs(studentsQuery);
                studentsData = studentsData.concat(
                    studentsSnapshot.docs.map(studentDoc => ({id: studentDoc.id, ...studentDoc.data()} as Student))
                );
            }
        }
        setEnrolledStudents(studentsData.sort((a, b) => a.fullName.localeCompare(b.fullName)));
      } else {
        setEnrolledStudents([]);
      }

    } catch (err: any) {
      console.error("Error fetching course data: ", err);
      toast({ title: "Error", description: `Failed to load data for selected course.`, variant: "destructive" });
    } finally {
      setIsGradesLoading(false);
    }
  };

  useEffect(() => {
    if(selectedCourseId) {
      fetchCourseData(selectedCourseId);
    } else {
      setGrades([]); 
      setEnrolledStudents([]);
      setIsGradesLoading(false);
    }
  }, [selectedCourseId, userProfile]);


  const handleEdit = (grade: Grade) => {
    if (grade.enteredByTeacherId !== userProfile?.uid && userProfile?.role !== 'Admin') {
        toast({title: "Unauthorized", description: "You can only edit grades you entered.", variant: "destructive"});
        return;
    }
    setEditingGrade(grade);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    if (!selectedCourseId) {
        toast({ title: "Select Course", description: "Please select a course before adding a grade.", variant: "default" });
        return;
    }
    if (enrolledStudents.length === 0) {
        toast({ title: "No Students Enrolled", description: "No students are enrolled in this course. Please enroll students first or contact the secretary.", variant: "default" });
        return;
    }
    setEditingGrade(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (grade: Grade) => {
     if (grade.enteredByTeacherId !== userProfile?.uid && userProfile?.role !== 'Admin') {
        toast({title: "Unauthorized", description: "You can only delete grades you entered.", variant: "destructive"});
        return;
    }
    try {
      await deleteDoc(doc(db, "grades", grade.id));
      toast({ title: "Grade Deleted", description: `Grade for ${grade.studentName} in ${grade.courseName} deleted.` });
      if (selectedCourseId) fetchCourseData(selectedCourseId);
    } catch (error: any) {
      console.error("Error deleting grade: ", error);
      toast({ title: "Delete Failed", description: error.message || "Could not delete grade.", variant: "destructive" });
    }
  };

  const currentCourseForForm = selectedCourseId ? assignedCourses.find(c => c.id === selectedCourseId) : undefined;

  if (authLoading || isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /> <p className="ml-2">Loading data...</p></div>;
  }

  return (
    <React.Fragment>
      <TooltipProvider>
      <div className="container mx-auto py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Manage Student Grades</h1>
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
              <Select 
                  onValueChange={(value) => setSelectedCourseId(value)} 
                  value={selectedCourseId || ""}
                  disabled={assignedCourses.length === 0 || isGradesLoading}
              >
                  <SelectTrigger className="w-full md:min-w-[280px]">
                      <SelectValue placeholder={assignedCourses.length === 0 ? "No courses assigned" : "Select a course"} />
                  </SelectTrigger>
                  <SelectContent>
                      {assignedCourses.length === 0 && <SelectItem value="no-courses-placeholder" disabled>No courses assigned to you</SelectItem>}
                      {assignedCourses.map(course => (
                          <SelectItem key={course.id} value={course.id}>
                              {course.name} ({course.code})
                          </SelectItem>
                      ))}
                  </SelectContent>
              </Select>
              <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleAddNew} className="bg-accent hover:bg-accent/90 w-full sm:w-auto" disabled={!selectedCourseId || isGradesLoading || enrolledStudents.length === 0}>
                    <PlusCircle className="mr-2 h-5 w-5" /> Add New Grade
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg bg-card">
                  <DialogHeader>
                    <DialogTitle className="text-xl">{editingGrade ? "Edit Grade" : "Add New Grade"}</DialogTitle>
                    <DialogDescription>
                      {editingGrade ? "Update student's grade." : `Enter student's grade for ${currentCourseForForm?.name || 'selected course'}.`}
                    </DialogDescription>
                  </DialogHeader>
                  {currentCourseForForm && (
                    <GradeForm 
                      initialData={editingGrade}
                      course={currentCourseForForm} // Pass selected course
                      students={enrolledStudents} // Pass enrolled students for dropdown
                      onClose={() => {
                        setIsFormOpen(false);
                        setEditingGrade(null);
                        if (selectedCourseId) fetchCourseData(selectedCourseId);
                      }} 
                    />
                  )}
                </DialogContent>
              </Dialog>
          </div>
        </div>

        {isGradesLoading && selectedCourseId && (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-lg text-muted-foreground">Loading data for selected course...</p>
          </div>
        )}

        {!isGradesLoading && !selectedCourseId && assignedCourses.length > 0 && (
          <Card className="text-center py-12">
              <CardHeader>
                  <div className="mx-auto bg-secondary rounded-full p-3 w-fit">
                  <Info className="h-12 w-12 text-muted-foreground" data-ai-hint="information select"/>
                  </div>
                  <CardTitle className="mt-4 text-2xl">Select a Course</CardTitle>
                  <CardDescription>Please select one of your assigned courses above to view or manage grades.</CardDescription>
              </CardHeader>
          </Card>
        )}

        {!isLoading && assignedCourses.length === 0 && !authLoading && (
          <Card className="text-center py-12">
              <CardHeader>
                  <div className="mx-auto bg-secondary rounded-full p-3 w-fit">
                  <BookOpen className="h-12 w-12 text-muted-foreground" data-ai-hint="book empty"/>
                  </div>
                  <CardTitle className="mt-4 text-2xl">No Courses Assigned</CardTitle>
                  <CardDescription>You are not assigned to any courses. Please contact an administrator.</CardDescription>
                  <CardContent className="mt-4">
                      <Link href="/teacher/dashboard">
                          <Button variant="outline">Back to Dashboard</Button>
                      </Link>
                  </CardContent>
              </CardHeader>
          </Card>
        )}

        {!isGradesLoading && selectedCourseId && enrolledStudents.length === 0 && (
          <Card className="text-center py-12">
            <CardHeader>
              <div className="mx-auto bg-secondary rounded-full p-3 w-fit">
              <Users className="h-12 w-12 text-muted-foreground" data-ai-hint="users empty"/>
              </div>
              <CardTitle className="mt-4 text-2xl">No Students Enrolled</CardTitle>
              <CardDescription>
                No students are currently enrolled in {assignedCourses.find(c => c.id === selectedCourseId)?.name || 'this course'}.
                A secretary needs to enroll students first.
              </CardDescription>
            </CardHeader>
          </Card>
        )}


        {!isGradesLoading && selectedCourseId && grades.length === 0 && (
          <Card className="text-center py-12">
            <CardHeader>
              <div className="mx-auto bg-secondary rounded-full p-3 w-fit">
              <ClipboardList className="h-12 w-12 text-muted-foreground" data-ai-hint="list empty"/>
              </div>
              <CardTitle className="mt-4 text-2xl">No Grades Found</CardTitle>
              <CardDescription>
                Start by adding grades for students in {assignedCourses.find(c => c.id === selectedCourseId)?.name || 'this course'}.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {!isGradesLoading && selectedCourseId && grades.length > 0 && enrolledStudents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Grades for: {assignedCourses.find(c => c.id === selectedCourseId)?.name || 'Selected Course'}</CardTitle>
              <CardDescription>A list of student grades for this course. You can add, edit, or delete grades you entered.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-25rem)]"> 
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Student Name</TableHead>
                      <TableHead className="text-center">Marks</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead>Remarks</TableHead>
                      <TableHead className="text-center">Entered By</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grades.map((grade) => (
                      <TableRow key={grade.id}>
                        <TableCell className="font-medium">{grade.studentName}</TableCell>
                        <TableCell className="text-center">{grade.marks}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={grade.status === 'Pass' ? 'default' : 'destructive'} 
                                className={grade.status === 'Pass' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}>
                            {grade.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate" title={grade.remarks || undefined}>{grade.remarks || "-"}</TableCell>
                        <TableCell className="text-center">
                          {grade.enteredByTeacherEmail ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                  <span className="truncate cursor-default">{grade.enteredByTeacherEmail.split('@')[0]}</span>
                              </TooltipTrigger>
                              <TooltipContent>
                                  <p>{grade.enteredByTeacherEmail}</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <Tooltip>
                              <TooltipTrigger asChild><User className="h-4 w-4 mx-auto text-muted-foreground" /></TooltipTrigger>
                              <TooltipContent><p>Admin/System Entry</p></TooltipContent>
                            </Tooltip>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {(grade.enteredByTeacherId === userProfile?.uid || userProfile?.role === 'Admin') && (
                              <>
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleEdit(grade)}>
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
                                        This action will permanently delete the grade for {grade.studentName} in {grade.courseName}.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDelete(grade)} className="bg-destructive hover:bg-destructive/90">
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
      </TooltipProvider>
    </React.Fragment>
  );
}

