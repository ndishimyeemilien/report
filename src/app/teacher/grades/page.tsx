"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GradeForm } from "@/components/grades/GradeForm";
import type { Grade, Course, Student, Enrollment } from "@/types"; 
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { collection, deleteDoc, doc, getDocs, query, orderBy, Timestamp, where, documentId, addDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import React, { useEffect, useState, useCallback } from "react";
import { PlusCircle, Edit3, Trash2, ClipboardList, Loader2, AlertTriangle, User, Info, BookOpen, Users, UploadCloud } from "lucide-react";
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
import { ExcelImportDialog } from "@/components/shared/ExcelImportDialog";

const PASS_MARK = 40;

interface GradeExcelRow {
  studentSystemId: string;
  marks: string; // XLSX reads numbers as strings sometimes, or they might be actual numbers
  remarks?: string;
}


export default function TeacherGradesPage() {
  const { userProfile, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const preselectedCourseId = searchParams.get('courseId');
  
  const [grades, setGrades] = useState<Grade[]>([]);
  const [assignedCourses, setAssignedCourses] = useState<Course[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]); 
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(preselectedCourseId);
  const [isLoading, setIsLoading] = useState(true);
  const [isGradesLoading, setIsGradesLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [isImportGradesDialogOpen, setIsImportGradesDialogOpen] = useState(false);
  const { toast } = useToast();

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
        } else if (selectedCourseId && !coursesData.find(c => c.id === selectedCourseId) && coursesData.length > 0) {
          // If a previously selected course ID is no longer valid (e.g. teacher unassigned), select the first one.
          setSelectedCourseId(coursesData[0].id);
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

  
  const fetchCourseData = useCallback(async (courseId: string | null) => {
    if (!courseId || !userProfile) {
      setGrades([]);
      setEnrolledStudents([]);
      setIsGradesLoading(false);
      return;
    }
    setIsGradesLoading(true);
    try {
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

      const enrollmentsQuery = query(collection(db, "enrollments"), where("courseId", "==", courseId));
      const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
      const studentIdsInCourse = enrollmentsSnapshot.docs.map(enrollmentDoc => (enrollmentDoc.data() as Enrollment).studentId);

      if (studentIdsInCourse.length > 0) {
        const studentBatches: string[][] = [];
        for (let i = 0; i < studentIdsInCourse.length; i += 30) {
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
  }, [userProfile, toast]); // Added toast to dependency array

  useEffect(() => {
    if(selectedCourseId) {
      fetchCourseData(selectedCourseId);
    } else {
      setGrades([]); 
      setEnrolledStudents([]);
      setIsGradesLoading(false);
    }
  }, [selectedCourseId, fetchCourseData]); // Changed from userProfile to fetchCourseData


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

  const handleGradeImport = async (data: GradeExcelRow[]): Promise<{ success: boolean; message: string }> => {
    if (!selectedCourseId || !userProfile || !currentCourseForForm) {
      return { success: false, message: "Course or user not properly selected/identified." };
    }

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    for (const row of data) {
      if (!row.studentSystemId || row.studentSystemId.trim() === "") {
        failCount++;
        errors.push("A grade record was skipped due to missing studentSystemId.");
        continue;
      }
      const marks = parseFloat(row.marks);
      if (isNaN(marks) || marks < 0 || marks > 100) {
        failCount++;
        errors.push(`Invalid marks for student ID ${row.studentSystemId}: ${row.marks}. Skipped.`);
        continue;
      }

      const student = enrolledStudents.find(s => s.studentSystemId === row.studentSystemId.trim());
      if (!student) {
        failCount++;
        errors.push(`Student with ID ${row.studentSystemId} not found or not enrolled in this course. Skipped.`);
        continue;
      }

      const status: 'Pass' | 'Fail' = marks >= PASS_MARK ? 'Pass' : 'Fail';
      const gradePayload: Partial&lt;Omit&lt;Grade, 'id'&gt;&gt; = {
        studentId: student.id,
        studentName: student.fullName,
        courseId: currentCourseForForm.id,
        courseName: `${currentCourseForForm.name} (${currentCourseForForm.code})`,
        marks: marks,
        status,
        remarks: row.remarks || "",
        enteredByTeacherId: userProfile.uid,
        enteredByTeacherEmail: userProfile.email || undefined,
        updatedAt: serverTimestamp() as unknown as Date,
      };

      try {
        // Check if grade already exists for this student in this course
        const gradeQuery = query(
          collection(db, "grades"),
          where("studentId", "==", student.id),
          where("courseId", "==", currentCourseForForm.id)
        );
        const gradeSnapshot = await getDocs(gradeQuery);

        if (!gradeSnapshot.empty) { // Grade exists, update it
          const existingGradeDoc = gradeSnapshot.docs[0];
          await updateDoc(doc(db, "grades", existingGradeDoc.id), gradePayload);
        } else { // Grade doesn't exist, add new
          await addDoc(collection(db, "grades"), {
            ...gradePayload,
            createdAt: serverTimestamp() as unknown as Date,
          });
        }
        successCount++;
      } catch (e: any) {
        failCount++;
        errors.push(`Error processing grade for ${student.fullName} (ID: ${row.studentSystemId}): ${e.message}`);
        console.error("Error importing grade row: ", e);
      }
    }

    fetchCourseData(selectedCourseId); // Refresh grade list
    
    let message = `${successCount} grade(s) processed successfully.`;
    if (failCount > 0) {
      message += ` ${failCount} grade(s) failed to process.`;
      if (errors.length > 0) {
        message += ` Errors: ${errors.slice(0, 3).join("; ")}${errors.length > 3 ? '...' : ''}`;
      }
    }
    return { success: successCount > 0 || (successCount === 0 && failCount === 0), message };
  };

  const currentCourseForForm = selectedCourseId ? assignedCourses.find(c => c.id === selectedCourseId) : undefined;

  if (authLoading || isLoading) {
    return &lt;div className="flex justify-center items-center h-64"&gt;&lt;Loader2 className="h-12 w-12 animate-spin text-primary" /&gt; &lt;p className="ml-2"&gt;Loading data...&lt;/p&gt;&lt;/div&gt;;
  }

  return (
    &lt;React.Fragment&gt;
      &lt;TooltipProvider&gt;
      &lt;div className="container mx-auto py-8"&gt;
        &lt;div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4"&gt;
          &lt;h1 className="text-3xl font-bold tracking-tight text-foreground"&gt;Manage Student Grades&lt;/h1&gt;
          &lt;div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto"&gt;
              &lt;Select 
                  onValueChange={(value) =&gt; setSelectedCourseId(value)} 
                  value={selectedCourseId || ""}
                  disabled={assignedCourses.length === 0 || isGradesLoading}
              &gt;
                  &lt;SelectTrigger className="w-full sm:min-w-[280px]"&gt;
                      &lt;SelectValue placeholder={assignedCourses.length === 0 ? "No courses assigned" : "Select a course"} /&gt;
                  &lt;/SelectTrigger&gt;
                  &lt;SelectContent&gt;
                      {assignedCourses.length === 0 &amp;&amp; &lt;SelectItem value="no-courses-placeholder" disabled&gt;No courses assigned to you&lt;/SelectItem&gt;}
                      {assignedCourses.map(course =&gt; (
                          &lt;SelectItem key={course.id} value={course.id}&gt;
                              {course.name} ({course.code})
                          &lt;/SelectItem&gt;
                      ))}
                  &lt;/SelectContent&gt;
              &lt;/Select&gt;
              &lt;Button 
                onClick={() =&gt; setIsImportGradesDialogOpen(true)} 
                variant="outline" 
                className="w-full sm:w-auto"
                disabled={!selectedCourseId || isGradesLoading || enrolledStudents.length === 0}
              &gt;
                &lt;UploadCloud className="mr-2 h-5 w-5" /&gt; Import Grades
              &lt;/Button&gt;
              &lt;Dialog open={isFormOpen} onOpenChange={setIsFormOpen}&gt;
                &lt;DialogTrigger asChild&gt;
                  &lt;Button onClick={handleAddNew} className="bg-accent hover:bg-accent/90 w-full sm:w-auto" disabled={!selectedCourseId || isGradesLoading || enrolledStudents.length === 0}&gt;
                    &lt;PlusCircle className="mr-2 h-5 w-5" /&gt; Add New Grade
                  &lt;/Button&gt;
                &lt;/DialogTrigger&gt;
                &lt;DialogContent className="sm:max-w-lg bg-card"&gt;
                  &lt;DialogHeader&gt;
                    &lt;DialogTitle className="text-xl"&gt;{editingGrade ? "Edit Grade" : "Add New Grade"}&lt;/DialogTitle&gt;
                    &lt;DialogDescription&gt;
                      {editingGrade ? "Update student's grade." : `Enter student's grade for ${currentCourseForForm?.name || 'selected course'}.`}
                    &lt;/DialogDescription&gt;
                  &lt;/DialogHeader&gt;
                  {currentCourseForForm &amp;&amp; (
                    &lt;GradeForm 
                      initialData={editingGrade}
                      course={currentCourseForForm} 
                      students={enrolledStudents} 
                      onClose={() =&gt; {
                        setIsFormOpen(false);
                        setEditingGrade(null);
                        if (selectedCourseId) fetchCourseData(selectedCourseId);
                      }} 
                    /&gt;
                  )}
                &lt;/DialogContent&gt;
              &lt;/Dialog&gt;
          &lt;/div&gt;
        &lt;/div&gt;

        &lt;ExcelImportDialog&lt;GradeExcelRow&gt;
            isOpen={isImportGradesDialogOpen}
            onClose={() =&gt; setIsImportGradesDialogOpen(false)}
            onImport={handleGradeImport}
            templateHeaders={["studentSystemId", "marks", "remarks"]}
            templateFileName={`grades_template_${currentCourseForForm?.code || 'course'}.xlsx`}
            dialogTitle={`Import Grades for ${currentCourseForForm?.name || 'Selected Course'}`}
            dialogDescription="Upload an Excel file with student grades. Required headers: studentSystemId, marks. Optional: remarks. Student System IDs must match enrolled students."
        /&gt;


        {isGradesLoading &amp;&amp; selectedCourseId &amp;&amp; (
          &lt;div className="flex justify-center items-center h-64"&gt;
            &lt;Loader2 className="h-12 w-12 animate-spin text-primary" /&gt;
            &lt;p className="ml-4 text-lg text-muted-foreground"&gt;Loading data for selected course...&lt;/p&gt;
          &lt;/div&gt;
        )}

        {!isGradesLoading &amp;&amp; !selectedCourseId &amp;&amp; assignedCourses.length &gt; 0 &amp;&amp; (
          &lt;Card className="text-center py-12"&gt;
              &lt;CardHeader&gt;
                  &lt;div className="mx-auto bg-secondary rounded-full p-3 w-fit"&gt;
                  &lt;Info className="h-12 w-12 text-muted-foreground" data-ai-hint="information select"/&gt;
                  &lt;/div&gt;
                  &lt;CardTitle className="mt-4 text-2xl"&gt;Select a Course&lt;/CardTitle&gt;
                  &lt;CardDescription&gt;Please select one of your assigned courses above to view or manage grades.&lt;/CardDescription&gt;
              &lt;/CardHeader&gt;
          &lt;/Card&gt;
        )}

        {!isLoading &amp;&amp; assignedCourses.length === 0 &amp;&amp; !authLoading &amp;&amp; (
          &lt;Card className="text-center py-12"&gt;
              &lt;CardHeader&gt;
                  &lt;div className="mx-auto bg-secondary rounded-full p-3 w-fit"&gt;
                  &lt;BookOpen className="h-12 w-12 text-muted-foreground" data-ai-hint="book empty"/&gt;
                  &lt;/div&gt;
                  &lt;CardTitle className="mt-4 text-2xl"&gt;No Courses Assigned&lt;/CardTitle&gt;
                  &lt;CardDescription&gt;You are not assigned to any courses. Please contact an administrator.&lt;/CardDescription&gt;
                  &lt;CardContent className="mt-4"&gt;
                      &lt;Link href="/teacher/dashboard"&gt;
                          &lt;Button variant="outline"&gt;Back to Dashboard&lt;/Button&gt;
                      &lt;/Link&gt;
                  &lt;/CardContent&gt;
              &lt;/CardHeader&gt;
          &lt;/Card&gt;
        )}
        
        {/* This handles "course selected, but no students enrolled" */}
        {!isGradesLoading &amp;&amp; selectedCourseId &amp;&amp; enrolledStudents.length === 0 &amp;&amp; (
          &lt;Card className="text-center py-12"&gt;
            &lt;CardHeader&gt;
              &lt;div className="mx-auto bg-secondary rounded-full p-3 w-fit"&gt;
              &lt;Users className="h-12 w-12 text-muted-foreground" data-ai-hint="users empty"/&gt;
              &lt;/div&gt;
              &lt;CardTitle className="mt-4 text-2xl"&gt;No Students Enrolled&lt;/CardTitle&gt;
              &lt;CardDescription&gt;
                No students are currently enrolled in {assignedCourses.find(c =&gt; c.id === selectedCourseId)?.name || 'this course'}.
                A secretary needs to enroll students first.
              &lt;/CardDescription&gt;
            &lt;/CardHeader&gt;
          &lt;/Card&gt;
        )}

        {/* This handles "course selected, students enrolled, but no grades yet" */}
        {!isGradesLoading &amp;&amp; selectedCourseId &amp;&amp; grades.length === 0 &amp;&amp; enrolledStudents.length &gt; 0 &amp;&amp; (
          &lt;Card className="text-center py-12"&gt;
            &lt;CardHeader&gt;
              &lt;div className="mx-auto bg-secondary rounded-full p-3 w-fit"&gt;
              &lt;ClipboardList className="h-12 w-12 text-muted-foreground" data-ai-hint="list empty"/&gt;
              &lt;/div&gt;
              &lt;CardTitle className="mt-4 text-2xl"&gt;No Grades Found&lt;/CardTitle&gt;
              &lt;CardDescription&gt;
                Start by adding grades for students in {assignedCourses.find(c =&gt; c.id === selectedCourseId)?.name || 'this course'}.
              &lt;/CardDescription&gt;
            &lt;/CardHeader&gt;
          &lt;/Card&gt;
        )}

        {!isGradesLoading &amp;&amp; selectedCourseId &amp;&amp; grades.length &gt; 0 &amp;&amp; enrolledStudents.length &gt; 0 &amp;&amp; (
          &lt;Card&gt;
            &lt;CardHeader&gt;
              &lt;CardTitle&gt;Grades for: {assignedCourses.find(c =&gt; c.id === selectedCourseId)?.name || 'Selected Course'}&lt;/CardTitle&gt;
              &lt;CardDescription&gt;A list of student grades for this course. You can add, edit, or delete grades you entered.&lt;/CardDescription&gt;
            &lt;/CardHeader&gt;
            &lt;CardContent&gt;
              &lt;ScrollArea className="h-[calc(100vh-28rem)]"&gt; 
                &lt;Table&gt;
                  &lt;TableHeader&gt;
                    &lt;TableRow&gt;
                      &lt;TableHead className="w-[200px]"&gt;Student Name&lt;/TableHead&gt;
                      &lt;TableHead&gt;Student ID&lt;/TableHead&gt;
                      &lt;TableHead className="text-center"&gt;Marks&lt;/TableHead&gt;
                      &lt;TableHead className="text-center"&gt;Status&lt;/TableHead&gt;
                      &lt;TableHead&gt;Remarks&lt;/TableHead&gt;
                      &lt;TableHead className="text-center"&gt;Entered By&lt;/TableHead&gt;
                      &lt;TableHead className="text-right"&gt;Actions&lt;/TableHead&gt;
                    &lt;/TableRow&gt;
                  &lt;/TableHeader&gt;
                  &lt;TableBody&gt;
                    {grades.map((grade) =&gt; {
                        const studentDetails = enrolledStudents.find(s =&gt; s.id === grade.studentId);
                        return (
                          &lt;TableRow key={grade.id}&gt;
                            &lt;TableCell className="font-medium"&gt;{grade.studentName}&lt;/TableCell&gt;
                            &lt;TableCell&gt;{studentDetails?.studentSystemId || 'N/A'}&lt;/TableCell&gt;
                            &lt;TableCell className="text-center"&gt;{grade.marks}&lt;/TableCell&gt;
                            &lt;TableCell className="text-center"&gt;
                              &lt;Badge variant={grade.status === 'Pass' ? 'default' : 'destructive'} 
                                    className={grade.status === 'Pass' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}&gt;
                                {grade.status}
                              &lt;/Badge&gt;
                            &lt;/TableCell&gt;
                            &lt;TableCell className="max-w-[200px] truncate" title={grade.remarks || undefined}&gt;{grade.remarks || "-"}&lt;/TableCell&gt;
                            &lt;TableCell className="text-center"&gt;
                              {grade.enteredByTeacherEmail ? (
                                &lt;Tooltip&gt;
                                  &lt;TooltipTrigger asChild&gt;
                                      &lt;span className="truncate cursor-default"&gt;{grade.enteredByTeacherEmail.split('@')[0]}&lt;/span&gt;
                                  &lt;/TooltipTrigger&gt;
                                  &lt;TooltipContent&gt;
                                      &lt;p&gt;{grade.enteredByTeacherEmail}&lt;/p&gt;
                                  &lt;/TooltipContent&gt;
                                &lt;/Tooltip&gt;
                              ) : (
                                &lt;Tooltip&gt;
                                  &lt;TooltipTrigger asChild&gt;&lt;User className="h-4 w-4 mx-auto text-muted-foreground" /&gt;&lt;/TooltipTrigger&gt;
                                  &lt;TooltipContent&gt;&lt;p&gt;Admin/System Entry&lt;/p&gt;&lt;/TooltipContent&gt;
                                &lt;/Tooltip&gt;
                              )}
                            &lt;/TableCell&gt;
                            &lt;TableCell className="text-right"&gt;
                              &lt;div className="flex justify-end gap-2"&gt;
                                {(grade.enteredByTeacherId === userProfile?.uid || userProfile?.role === 'Admin') &amp;&amp; (
                                  &lt;&gt;
                                    &lt;Button variant="outline" size="icon" className="h-8 w-8" onClick={() =&gt; handleEdit(grade)}&gt;
                                      &lt;Edit3 className="h-4 w-4" /&gt;
                                      &lt;span className="sr-only"&gt;Edit&lt;/span&gt;
                                    &lt;/Button&gt;
                                    &lt;AlertDialog&gt;
                                      &lt;AlertDialogTrigger asChild&gt;
                                        &lt;Button variant="destructive" size="icon" className="h-8 w-8"&gt;
                                          &lt;Trash2 className="h-4 w-4" /&gt;
                                          &lt;span className="sr-only"&gt;Delete&lt;/span&gt;
                                        &lt;/Button&gt;
                                      &lt;/AlertDialogTrigger&gt;
                                      &lt;AlertDialogContent&gt;
                                        &lt;AlertDialogHeader&gt;
                                          &lt;AlertDialogTitle&gt;Are you sure?&lt;/AlertDialogTitle&gt;
                                          &lt;AlertDialogDescription&gt;
                                            This action will permanently delete the grade for {grade.studentName} in {grade.courseName}.
                                          &lt;/AlertDialogDescription&gt;
                                        &lt;/AlertDialogHeader&gt;
                                        &lt;AlertDialogFooter&gt;
                                          &lt;AlertDialogCancel&gt;Cancel&lt;/AlertDialogCancel&gt;
                                          &lt;AlertDialogAction onClick={() =&gt; handleDelete(grade)} className="bg-destructive hover:bg-destructive/90"&gt;
                                            Delete
                                          &lt;/AlertDialogAction&gt;
                                        &lt;/AlertDialogFooter&gt;
                                      &lt;/AlertDialogContent&gt;
                                    &lt;/AlertDialog&gt;
                                  &lt;/&gt;
                                )}
                              &lt;/div&gt;
                            &lt;/TableCell&gt;
                          &lt;/TableRow&gt;
                        );
                      })}
                  &lt;/TableBody&gt;
                &lt;/Table&gt;
              &lt;/ScrollArea&gt;
            &lt;/CardContent&gt;
          &lt;/Card&gt;
        )}
      &lt;/div&gt;
      &lt;/TooltipProvider&gt;
    &lt;/React.Fragment&gt;
  );
}
