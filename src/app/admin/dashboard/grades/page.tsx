
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GradeForm } from "@/components/grades/GradeForm";
import type { Grade, Course, Student } from "@/types"; 
import { db } from "@/lib/firebase";
import { collection, deleteDoc, doc, getDocs, query, orderBy, Timestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import { PlusCircle, Edit3, Trash2, ClipboardList, Loader2, AlertTriangle, Download, User } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


// Basic CSV export function - Needs update for new grade structure
const exportToCSV = (grades: Grade[]) => {
  if (grades.length === 0) {
    alert("No grades to export.");
    return;
  }
  // Updated headers for new grade structure
  const headers = ["Student Name","Student System ID", "Course Code", "Course Name", "CA1", "CA2", "Exam", "Total Marks", "Term", "Status", "Remarks", "Entered By", "Date Recorded"];
  const rows = grades.map(grade => [
    grade.studentName,
    "", // Placeholder for studentSystemId - would need to join with student data
    grade.courseName.split('(')[1]?.replace(')','').trim() || 'N/A', 
    grade.courseName.split('(')[0].trim(),
    grade.ca1 ?? '',
    grade.ca2 ?? '',
    grade.exam ?? '',
    grade.totalMarks ?? '',
    grade.term || "N/A",
    grade.status,
    grade.remarks || "",
    grade.enteredByTeacherEmail || "Admin/System",
    new Date(grade.createdAt).toLocaleDateString()
  ]);

  let csvContent = "data:text/csv;charset=utf-8," 
    + headers.join(",") + "\n" 
    + rows.map(e => e.join(",")).join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "grades_report.csv");
  document.body.appendChild(link); 
  link.click();
  document.body.removeChild(link);
};


export default function GradesPage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]); 
  const [allStudents, setAllStudents] = useState<Student[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const { toast } = useToast();

  const fetchAllData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const gradesQuery = query(collection(db, "grades"), orderBy("createdAt", "desc"));
      const coursesQuery = query(collection(db, "courses"), orderBy("name"));
      const studentsQuery = query(collection(db, "students"), orderBy("fullName"));

      const [gradesSnapshot, coursesSnapshot, studentsSnapshot] = await Promise.all([
        getDocs(gradesQuery),
        getDocs(coursesQuery),
        getDocs(studentsQuery),
      ]);
      
      const gradesData = gradesSnapshot.docs.map(gradeDoc => ({ 
        id: gradeDoc.id,
        ...gradeDoc.data(),
        createdAt: (gradeDoc.data().createdAt as Timestamp)?.toDate(),
        updatedAt: (gradeDoc.data().updatedAt as Timestamp)?.toDate(),
      })) as Grade[];
      setGrades(gradesData);

      const coursesData = coursesSnapshot.docs.map(courseDoc => ({ id: courseDoc.id, ...courseDoc.data() } as Course)); 
      setAllCourses(coursesData);

      const studentsData = studentsSnapshot.docs.map(studentDoc => ({ id: studentDoc.id, ...studentDoc.data() } as Student)); 
      setAllStudents(studentsData);

    } catch (err: any) {
      console.error("Error fetching data: ", err);
      setError("Failed to load data. Please try again.");
      toast({ title: "Error", description: "Failed to load page data.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleEdit = (grade: Grade) => {
    setEditingGrade(grade);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingGrade(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (gradeId: string, studentName: string, courseName: string) => {
    try {
      await deleteDoc(doc(db, "grades", gradeId));
      toast({ title: "Grade Deleted", description: `Grade for ${studentName} in ${courseName} deleted.` });
      fetchAllData(); 
    } catch (error: any)
    {
      console.error("Error deleting grade: ", error);
      toast({ title: "Delete Failed", description: error.message || "Could not delete grade.", variant: "destructive" });
    }
  };
  
  const selectedCourseForForm = editingGrade 
                                 ? allCourses.find(c => c.id === editingGrade.courseId) 
                                 : (allCourses.length > 0 ? allCourses[0] : undefined); 

  return (
    <TooltipProvider>
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Manage Grades (Admin View)</h1>
        <div className="flex gap-2">
          {/* CSV Export button - Commented out as its structure needs review for new grade fields */}
          {/* <Button variant="outline" onClick={() => exportToCSV(grades)} disabled={grades.length === 0 || isLoading}>
            <Download className="mr-2 h-5 w-5" /> Export as CSV
          </Button> */}
           <Button variant="outline" onClick={() => toast({title: "Export Needs Update", description:"CSV Export needs to be updated for the new grade structure."})} disabled={grades.length === 0 || isLoading}>
            <Download className="mr-2 h-5 w-5" /> Export as CSV (Needs Update)
          </Button>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddNew} className="bg-accent hover:bg-accent/90" disabled={allCourses.length === 0 || allStudents.length === 0}>
                <PlusCircle className="mr-2 h-5 w-5" /> Add New Grade
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg bg-card">
              <DialogHeader>
                <DialogTitle className="text-xl">{editingGrade ? "Edit Grade" : "Add New Grade"}</DialogTitle>
                <DialogDescription>
                  {editingGrade ? "Update the student's grade details." : "Enter the student's grade information. Admins can assign grades for any student in any course."}
                </DialogDescription>
              </DialogHeader>
               {(allCourses.length > 0 && allStudents.length > 0 && selectedCourseForForm) && ( 
                <GradeForm 
                    initialData={editingGrade} 
                    course={selectedCourseForForm} 
                    students={allStudents} 
                    onClose={() => {
                        setIsFormOpen(false);
                        setEditingGrade(null);
                        fetchAllData(); 
                    }} 
                />
               )}
               {((allCourses.length === 0 || allStudents.length === 0) || (!selectedCourseForForm && !editingGrade && allCourses.length > 0)) && !isLoading && (
                 <p className="text-sm text-muted-foreground py-4">
                    {allCourses.length === 0 && "Please add courses first. "}
                    {allStudents.length === 0 && "Please add students first. "}
                    {!selectedCourseForForm && !editingGrade && allCourses.length > 0 && "Could not determine a default course for adding new grade."}
                 </p>
               )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg text-muted-foreground">Loading grades...</p>
        </div>
      )}

      {!isLoading && error && (
         <Card className="bg-destructive/10 border-destructive">
          <CardHeader className="flex flex-row items-center gap-2">
             <AlertTriangle className="h-6 w-6 text-destructive" />
            <CardTitle className="text-destructive">Error Loading Grades</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive-foreground">{error}</p>
            <Button onClick={fetchAllData} variant="outline" className="mt-4">Try Again</Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && grades.length === 0 && (
        <Card className="text-center py-12">
          <CardHeader>
            <div className="mx-auto bg-secondary rounded-full p-3 w-fit">
             <ClipboardList className="h-12 w-12 text-muted-foreground" data-ai-hint="clipboard list" />
            </div>
            <CardTitle className="mt-4 text-2xl">No Grades Found</CardTitle>
            <CardDescription>
              Start by adding grades for students. Click "Add New Grade".
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {!isLoading && !error && grades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Grade Records</CardTitle>
            <CardDescription>A list of all recorded student grades. Admins can edit any record.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-22rem)]"> 
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Student Name</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead className="text-center">CA1</TableHead>
                    <TableHead className="text-center">CA2</TableHead>
                    <TableHead className="text-center">Exam</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-center">Term</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead className="text-center w-[120px]">Entered By</TableHead>
                    <TableHead className="text-right w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grades.map((grade) => (
                    <TableRow key={grade.id}>
                      <TableCell className="font-medium">{grade.studentName}</TableCell>
                      <TableCell>{grade.courseName}</TableCell>
                      <TableCell className="text-center">{grade.ca1 ?? '-'}</TableCell>
                      <TableCell className="text-center">{grade.ca2 ?? '-'}</TableCell>
                      <TableCell className="text-center">{grade.exam ?? '-'}</TableCell>
                      <TableCell className="text-center font-semibold">{grade.totalMarks ?? '-'}</TableCell>
                      <TableCell className="text-center">{grade.term || "N/A"}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={grade.status === 'Pass' ? 'default' : 'destructive'} 
                               className={grade.status === 'Pass' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}>
                          {grade.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate" title={grade.remarks || undefined}>{grade.remarks || "-"}</TableCell>
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
                                <AlertDialogAction onClick={() => handleDelete(grade.id, grade.studentName, grade.courseName)} className="bg-destructive hover:bg-destructive/90">
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
  );
}
