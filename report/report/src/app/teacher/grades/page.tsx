"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GradeForm } from "@/components/grades/GradeForm";
import type { Grade, Course, Student, Class, ClassCourseAssignment } from "@/types"; 
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { collection, deleteDoc, doc, getDocs, query, orderBy, Timestamp, where, documentId, addDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { PlusCircle, Edit3, Trash2, ClipboardList, Loader2, AlertTriangle, User, Info, Filter, UploadCloud } from "lucide-react"; // Removed BookOpen, Users - added Filter
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
import Link from "next/link"; // Keep Link if needed for other parts, not strictly for this page's core flow
import { ExcelImportDialog } from "@/components/shared/ExcelImportDialog";

const PASS_MARK = 50;

interface GradeExcelRow {
  studentSystemId: string; // Must match an existing student in the selected class
  marks: string; // Will be parsed to number
  remarks?: string;
}

export default function TeacherGradesPage() {
  const { userProfile, loading: authLoading } = useAuth();
  
  const [grades, setGrades] = useState<Grade[]>([]);
  const [allClasses, setAllClasses] = useState<Class[]>([]);
  const [allClassAssignments, setAllClassAssignments] = useState<ClassCourseAssignment[]>([]);
  const [teacherAssignedSubjects, setTeacherAssignedSubjects] = useState<Course[]>([]);
  
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  
  const [studentsInSelectedClass, setStudentsInSelectedClass] = useState<Student[]>([]);
  
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const [isGradesLoading, setIsGradesLoading] = useState(false); // For grades and students of selected class/subject
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [isImportGradesDialogOpen, setIsImportGradesDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch initial data: all classes, all subjects assigned to this teacher, all class-course assignments
  useEffect(() => {
    if (!userProfile || authLoading) {
      setIsLoadingInitialData(false);
      return;
    }
    setIsLoadingInitialData(true);
    const fetchData = async () => {
      try {
        const classesQuery = query(collection(db, "classes"), orderBy("name"));
        const teacherSubjectsQuery = query(collection(db, "courses"), where("teacherId", "==", userProfile.uid), orderBy("name"));
        const classAssignmentsQuery = query(collection(db, "classAssignments")); // No specific order needed here, will be filtered

        const [classesSnap, teacherSubjectsSnap, classAssignmentsSnap] = await Promise.all([
          getDocs(classesQuery),
          getDocs(teacherSubjectsQuery),
          getDocs(classAssignmentsQuery),
        ]);

        setAllClasses(classesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Class)));
        setTeacherAssignedSubjects(teacherSubjectsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Course)));
        setAllClassAssignments(classAssignmentsSnap.docs.map(d => ({ id: d.id, ...d.data() } as ClassCourseAssignment)));

      } catch (err) {
        console.error("Error fetching initial data for teacher grades page: ", err);
        toast({ title: "Error", description: "Could not load necessary data for page setup.", variant: "destructive" });
      } finally {
        setIsLoadingInitialData(false);
      }
    };
    fetchData();
  }, [userProfile, authLoading, toast]);

  // Memoized list of subjects available for selection based on selectedClassId and teacher's assigned subjects
  const availableSubjectsForSelectedClass = useMemo(() => {
    if (!selectedClassId || !userProfile) return [];
    // Find subject IDs assigned to the selected class
    const subjectIdsInClass = allClassAssignments
      .filter(ca => ca.classId === selectedClassId)
      .map(ca => ca.courseId); // courseId here is the subjectId
    // Filter teacher's assigned subjects to only include those also present in the selected class's assignments
    return teacherAssignedSubjects.filter(ts => subjectIdsInClass.includes(ts.id));
  }, [selectedClassId, allClassAssignments, teacherAssignedSubjects, userProfile]);

  // Fetch students for the selected class AND grades for selected class AND subject
  const fetchClassAndGradeData = useCallback(async () => {
    if (!selectedClassId || !selectedSubjectId || !userProfile) {
      setGrades([]);
      setStudentsInSelectedClass([]); // Ensure students are cleared if no class/subject
      setIsGradesLoading(false);
      return;
    }
    setIsGradesLoading(true);
    try {
      // Fetch students assigned to the selected class
      const studentsInClassQuery = query(collection(db, "students"), where("classId", "==", selectedClassId), orderBy("fullName"));
      const studentsSnapshot = await getDocs(studentsInClassQuery);
      const classStudents = studentsSnapshot.docs.map(sDoc => ({id: sDoc.id, ...sDoc.data()} as Student));
      setStudentsInSelectedClass(classStudents);
      
      // Fetch grades for the selected subject AND for students specifically in the selected class
      if (classStudents.length > 0) {
        const studentIdsInClass = classStudents.map(s => s.id);
        
        // Batching for 'in' query if studentIdsInClass.length > 30
        const studentIdBatches: string[][] = [];
        for (let i = 0; i < studentIdsInClass.length; i += 30) {
            studentIdBatches.push(studentIdsInClass.slice(i, i + 30));
        }

        let fetchedGrades: Grade[] = [];
        for (const batch of studentIdBatches) {
            if (batch.length > 0) {
                 const gradesQuery = query(
                    collection(db, "grades"), 
                    where("courseId", "==", selectedSubjectId),
                    where("studentId", "in", batch),
                    orderBy("studentName", "asc") // studentName on grade doc is denormalized
                );
                const gradesSnapshot = await getDocs(gradesQuery);
                fetchedGrades = fetchedGrades.concat(gradesSnapshot.docs.map(gDoc => ({ 
                  id: gDoc.id, ...gDoc.data(),
                  createdAt: (gDoc.data().createdAt as Timestamp)?.toDate(),
                  updatedAt: (gDoc.data().updatedAt as Timestamp)?.toDate(),
                } as Grade)));
            }
        }
        setGrades(fetchedGrades.sort((a,b) => a.studentName.localeCompare(b.studentName)));

      } else { // No students in the class
        setGrades([]);
      }

    } catch (err: any) {
      console.error("Error fetching students for class or grades for subject: ", err);
      toast({ title: "Error", description: `Failed to load student or grade data.`, variant: "destructive" });
      setGrades([]); // Clear grades on error
      // setStudentsInSelectedClass([]); // Students might have loaded, but grades failed. Let's not clear students here.
    } finally {
      setIsGradesLoading(false);
    }
  }, [selectedClassId, selectedSubjectId, userProfile, toast]);

  // Effect to run when selectedClassId or selectedSubjectId changes
  useEffect(() => {
    if(selectedClassId && selectedSubjectId) {
      fetchClassAndGradeData();
    } else {
      // If either class or subject is not selected, clear relevant data
      setGrades([]); 
      if (!selectedClassId) { // If class is cleared, clear students too
          setStudentsInSelectedClass([]);
      }
      setIsGradesLoading(false);
    }
  }, [selectedClassId, selectedSubjectId, fetchClassAndGradeData]);

  // Reset selected subject if class changes, to force re-selection of a subject valid for the new class
  useEffect(() => {
    setSelectedSubjectId(null);
  }, [selectedClassId]);


  const handleEdit = (grade: Grade) => {
    if (grade.enteredByTeacherId !== userProfile?.uid && userProfile?.role !== 'Admin') {
        toast({title: "Unauthorized", description: "You can only edit grades you entered.", variant: "destructive"});
        return;
    }
    setEditingGrade(grade);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    if (!selectedClassId || !selectedSubjectId) {
        toast({ title: "Selection Required", description: "Please select a class and a subject before adding a grade.", variant: "default" });
        return;
    }
    if (studentsInSelectedClass.length === 0) {
        toast({ title: "No Students in Class", description: "No students are assigned to this class. Grades cannot be added.", variant: "default" });
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
      fetchClassAndGradeData(); // Refetch grades for the current class/subject
    } catch (error: any) {
      console.error("Error deleting grade: ", error);
      toast({ title: "Delete Failed", description: error.message || "Could not delete grade.", variant: "destructive" });
    }
  };

  const currentSubjectForForm = selectedSubjectId ? teacherAssignedSubjects.find(c => c.id === selectedSubjectId) : undefined;

  const handleGradeImport = async (data: GradeExcelRow[]): Promise<{ success: boolean; message: string }> => {
    if (!selectedSubjectId || !userProfile || !currentSubjectForForm || !selectedClassId) {
      return { success: false, message: "Class, Subject, or user not properly selected/identified." };
    }
     if (studentsInSelectedClass.length === 0) {
      return { success: false, message: "No students in the selected class to import grades for." };
    }

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    for (const row of data) {
      const studentSystemIdTrimmed = String(row.studentSystemId ?? '').trim();
      if (!studentSystemIdTrimmed) {
        failCount++;
        errors.push("A grade record was skipped due to missing studentSystemId.");
        continue;
      }
      const marks = parseFloat(String(row.marks ?? '')); // Ensure marks is a string before parseFloat
      if (isNaN(marks) || marks < 0 || marks > 100) {
        failCount++;
        errors.push(`Invalid marks for student ID ${studentSystemIdTrimmed}: '${row.marks}'. Skipped.`);
        continue;
      }

      const student = studentsInSelectedClass.find(s => s.studentSystemId === studentSystemIdTrimmed);
      if (!student) {
        failCount++;
        errors.push(`Student with ID ${studentSystemIdTrimmed} not found in selected class '${allClasses.find(c => c.id === selectedClassId)?.name}'. Skipped.`);
        continue;
      }

      const status: 'Pass' | 'Fail' = marks >= PASS_MARK ? 'Pass' : 'Fail';
      const gradePayload: Partial<Omit<Grade, 'id'>> = {
        studentId: student.id,
        studentName: student.fullName,
        courseId: currentSubjectForForm.id,
        courseName: `${currentSubjectForForm.name} (${currentSubjectForForm.code})`,
        marks: marks,
        status,
        remarks: row.remarks || "",
        term: "Term 1", // Default or make configurable via import/UI
        enteredByTeacherId: userProfile.uid,
        enteredByTeacherEmail: userProfile.email || undefined,
        updatedAt: serverTimestamp() as unknown as Date,
      };

      try {
        const gradeQuery = query(
          collection(db, "grades"),
          where("studentId", "==", student.id),
          where("courseId", "==", currentSubjectForForm.id)
          // Consider adding where("term", "==", gradePayload.term) if terms are distinct records
        );
        const gradeSnapshot = await getDocs(gradeQuery);

        if (!gradeSnapshot.empty) { 
          const existingGradeDoc = gradeSnapshot.docs[0];
          // Prevent teacher from overwriting admin/other teacher's grade unless they are admin
          if (existingGradeDoc.data().enteredByTeacherId !== userProfile.uid && userProfile.role !== 'Admin') {
            failCount++;
            errors.push(`Grade for ${student.fullName} (ID: ${studentSystemIdTrimmed}) was entered by another user and cannot be overwritten. Skipped.`);
            continue;
          }
          await updateDoc(doc(db, "grades", existingGradeDoc.id), gradePayload);
        } else { 
          await addDoc(collection(db, "grades"), {
            ...gradePayload,
            createdAt: serverTimestamp() as unknown as Date,
          });
        }
        successCount++;
      } catch (e: any) {
        failCount++;
        errors.push(`Error processing grade for ${student.fullName} (ID: ${studentSystemIdTrimmed}): ${e.message}`);
        console.error("Error importing grade row: ", e);
      }
    }

    fetchClassAndGradeData(); 
    
    let message = `${successCount} grade(s) processed successfully.`;
    if (failCount > 0) {
      message += ` ${failCount} record(s) failed or skipped.`;
      if (errors.length > 0) {
        message += ` Details: ${errors.slice(0, 3).join("; ")}${errors.length > 3 ? '...' : ''}`;
      }
    }
    return { success: successCount > 0 || (successCount === 0 && failCount === 0), message };
  };


  if (authLoading || isLoadingInitialData) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /> <p className="ml-2 text-muted-foreground">Loading page data...</p></div>;
  }
  if (!userProfile) { // Should be caught by layout, but as a fallback
    return <div className="flex justify-center items-center h-64"><AlertTriangle className="h-12 w-12 text-destructive" /> <p className="ml-2 text-destructive-foreground">User not authenticated.</p></div>;
  }


  return (
    <React.Fragment>
      <TooltipProvider>
      <div className="container mx-auto py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Manage Student Grades</h1>
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
            {/* Class Selector */}
            <Select 
                onValueChange={(value) => { setSelectedClassId(value); setSelectedSubjectId(null); /* Reset subject when class changes */ }} 
                value={selectedClassId || ""}
                disabled={allClasses.length === 0 || isGradesLoading} // isGradesLoading refers to specific class/subject grades
            >
                <SelectTrigger className="w-full sm:min-w-[200px]">
                    <SelectValue placeholder={allClasses.length === 0 ? "No classes available" : "Select a Class"} />
                </SelectTrigger>
                <SelectContent>
                    {allClasses.length === 0 && <SelectItem value="no-classes-placeholder" disabled>No classes found</SelectItem>}
                    {allClasses.map(cls => (
                        <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Subject Selector (dynamically populated) */}
            <Select 
                onValueChange={setSelectedSubjectId} 
                value={selectedSubjectId || ""}
                disabled={!selectedClassId || availableSubjectsForSelectedClass.length === 0 || isGradesLoading}
            >
                <SelectTrigger className="w-full sm:min-w-[280px]">
                    <SelectValue placeholder={!selectedClassId ? "Select class first" : (availableSubjectsForSelectedClass.length === 0 ? "No subjects for this class" : "Select a Subject")} />
                </SelectTrigger>
                <SelectContent>
                    {!selectedClassId && <SelectItem value="select-class-placeholder" disabled>Select class first</SelectItem>}
                    {selectedClassId && availableSubjectsForSelectedClass.length === 0 && <SelectItem value="no-subjects-placeholder" disabled>No assigned subjects for this class</SelectItem>}
                    {availableSubjectsForSelectedClass.map(subject => (
                        <SelectItem key={subject.id} value={subject.id}>
                            {subject.name} ({subject.code})
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
              <Button 
                onClick={() => setIsImportGradesDialogOpen(true)} 
                variant="outline" 
                className="w-full sm:w-auto"
                disabled={!selectedClassId || !selectedSubjectId || isGradesLoading || studentsInSelectedClass.length === 0}
              >
                <UploadCloud className="mr-2 h-5 w-5" /> Import Grades
              </Button>
              <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleAddNew} className="bg-accent hover:bg-accent/90 w-full sm:w-auto" disabled={!selectedClassId || !selectedSubjectId || isGradesLoading || studentsInSelectedClass.length === 0}>
                    <PlusCircle className="mr-2 h-5 w-5" /> Add New Grade
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg bg-card">
                  <DialogHeader>
                    <DialogTitle className="text-xl">{editingGrade ? "Edit Grade" : "Add New Grade"}</DialogTitle>
                    <DialogDescription>
                      {editingGrade ? "Update student's grade." : `Enter student's grade for ${currentSubjectForForm?.name || 'selected subject'} in class ${allClasses.find(c=>c.id===selectedClassId)?.name || ''}.`}
                    </DialogDescription>
                  </DialogHeader>
                  {currentSubjectForForm && selectedClassId && ( // Ensure currentSubjectForForm and selectedClassId are available
                    <GradeForm 
                      initialData={editingGrade}
                      course={currentSubjectForForm} // This is actually the subject
                      students={studentsInSelectedClass} 
                      onClose={() => {
                        setIsFormOpen(false);
                        setEditingGrade(null);
                        fetchClassAndGradeData(); // Refetch data for current class/subject
                      }} 
                    />
                  )}
                </DialogContent>
              </Dialog>
          </div>
        </div>

        <ExcelImportDialog<GradeExcelRow>
            isOpen={isImportGradesDialogOpen}
            onClose={() => setIsImportGradesDialogOpen(false)}
            onImport={handleGradeImport}
            templateHeaders={["studentSystemId", "marks", "remarks"]}
            templateFileName={`grades_template_${currentSubjectForForm?.code || 'subject'}_${allClasses.find(c=>c.id===selectedClassId)?.name.replace(/\s+/g, '_') || 'class'}.xlsx`}
            dialogTitle={`Import Grades for ${currentSubjectForForm?.name || 'Selected Subject'} in ${allClasses.find(c=>c.id===selectedClassId)?.name || 'Selected Class'}`}
            dialogDescription="Upload Excel. Required headers: studentSystemId, marks. Optional: remarks. Student System IDs must match students enrolled in the selected class."
        />

        {isGradesLoading && selectedClassId && selectedSubjectId && (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-lg text-muted-foreground">Loading grades data...</p>
          </div>
        )}

        {!isGradesLoading && (!selectedClassId || !selectedSubjectId) && (
          <Card className="text-center py-12">
              <CardHeader>
                  <div className="mx-auto bg-secondary rounded-full p-3 w-fit">
                  <Filter className="h-12 w-12 text-muted-foreground" data-ai-hint="filter selection"/>
                  </div>
                  <CardTitle className="mt-4 text-2xl">Select Class and Subject</CardTitle>
                  <CardDescription>Please select a class and then one of your assigned subjects for that class to view or manage grades.</CardDescription>
              </CardHeader>
          </Card>
        )}
        
        {!isGradesLoading && selectedClassId && selectedSubjectId && studentsInSelectedClass.length === 0 && (
          <Card className="text-center py-12">
            <CardHeader>
              <div className="mx-auto bg-secondary rounded-full p-3 w-fit">
              <Users className="h-12 w-12 text-muted-foreground" data-ai-hint="users empty"/>
              </div>
              <CardTitle className="mt-4 text-2xl">No Students in Class</CardTitle>
              <CardDescription>
                No students are currently assigned to the class: {allClasses.find(c => c.id === selectedClassId)?.name || 'this class'}.
                A secretary needs to assign students to this class first.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {!isGradesLoading && selectedClassId && selectedSubjectId && grades.length === 0 && studentsInSelectedClass.length > 0 && (
          <Card className="text-center py-12">
            <CardHeader>
              <div className="mx-auto bg-secondary rounded-full p-3 w-fit">
              <ClipboardList className="h-12 w-12 text-muted-foreground" data-ai-hint="list empty"/>
              </div>
              <CardTitle className="mt-4 text-2xl">No Grades Found</CardTitle>
              <CardDescription>
                Start by adding grades for students in {currentSubjectForForm?.name || 'this subject'} for class {allClasses.find(c => c.id === selectedClassId)?.name || ''}.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {!isGradesLoading && selectedClassId && selectedSubjectId && grades.length > 0 && studentsInSelectedClass.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Grades for: {currentSubjectForForm?.name} ({currentSubjectForForm?.code}) - Class: {allClasses.find(c => c.id === selectedClassId)?.name}</CardTitle>
              <CardDescription>A list of student grades for this subject in the selected class. You can add, edit, or delete grades you entered.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-30rem)]"> 
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Student Name</TableHead>
                      <TableHead>Student ID</TableHead>
                      <TableHead className="text-center">Marks</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead>Remarks</TableHead>
                      <TableHead className="text-center">Entered By</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grades.map((grade) => {
                        const studentDetails = studentsInSelectedClass.find(s => s.id === grade.studentId);
                        const canModify = grade.enteredByTeacherId === userProfile?.uid || userProfile?.role === 'Admin';
                        return (
                          <TableRow key={grade.id}>
                            <TableCell className="font-medium">{grade.studentName}</TableCell>
                            <TableCell>{studentDetails?.studentSystemId || 'N/A'}</TableCell>
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
                                {canModify && (
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
                        );
                      })}
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
