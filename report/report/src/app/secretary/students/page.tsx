"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentForm } from "@/components/students/StudentForm";
import type { Student } from "@/types";
import { db } from "@/lib/firebase";
import { collection, deleteDoc, doc, getDocs, query, orderBy, Timestamp, addDoc, serverTimestamp, where, type FieldValue } from "firebase/firestore"; 
import { useEffect, useState } from "react";
import { PlusCircle, Edit3, Trash2, Users, Loader2, AlertTriangle, UploadCloud, Users2 } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExcelImportDialog } from "@/components/shared/ExcelImportDialog";
import { Badge } from "@/components/ui/badge";


interface StudentExcelRow {
  fullName: string;
  studentSystemId?: string | number; 
  email?: string;
}

export default function SecretaryStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchStudents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const q = query(collection(db, "students"), orderBy("fullName", "asc"));
      const querySnapshot = await getDocs(q);
      const studentsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate(),
        updatedAt: (doc.data().updatedAt as Timestamp)?.toDate(),
      })) as Student[];
      setStudents(studentsData);
    } catch (err: any) {
      console.error("Error fetching students: ", err);
      setError("Failed to load students. Please try again.");
      toast({ title: "Error", description: "Failed to load students.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingStudent(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (studentId: string, studentName: string) => {
    try {
      const enrollmentsQuery = query(collection(db, "enrollments"), where("studentId", "==", studentId));
      const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
      if (!enrollmentsSnapshot.empty) {
        toast({
          title: "Deletion Blocked",
          description: `Student "${studentName}" has existing enrollments. Please remove enrollments first.`,
          variant: "destructive",
        });
        return;
      }
      
      await deleteDoc(doc(db, "students", studentId));
      toast({ title: "Student Deleted", description: `Student "${studentName}" has been deleted.` });
      fetchStudents(); 
    } catch (error: any) {
      console.error("Error deleting student: ", error);
      toast({ title: "Delete Failed", description: error.message || "Could not delete student.", variant: "destructive" });
    }
  };
  
  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  const handleStudentImport = async (data: StudentExcelRow[]): Promise<{ success: boolean; message: string }> => {
    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    for (const row of data) {
      const fullNameTrimmed = String(row.fullName ?? '').trim();
      if (!fullNameTrimmed) {
        failCount++;
        errors.push("A student record was skipped due to missing full name.");
        continue;
      }

      type StudentFirestoreData = {
        fullName: string;
        studentSystemId?: string;
        email?: string;
        createdAt: FieldValue;
        updatedAt: FieldValue;
      };
      
      const dataForFirestore: StudentFirestoreData = {
        fullName: fullNameTrimmed,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const studentIdTrimmed = String(row.studentSystemId ?? '').trim();
      if (studentIdTrimmed) {
        dataForFirestore.studentSystemId = studentIdTrimmed;
      }

      const emailTrimmed = String(row.email ?? '').trim();
      if (emailTrimmed) { 
        dataForFirestore.email = emailTrimmed;
      }

      try {
        if (dataForFirestore.studentSystemId) {
            const q = query(collection(db, "students"), where("studentSystemId", "==", dataForFirestore.studentSystemId));
            const existingStudentSnap = await getDocs(q);
            if (!existingStudentSnap.empty) {
                failCount++;
                errors.push(`Student with ID ${dataForFirestore.studentSystemId} (${dataForFirestore.fullName}) already exists. Skipped.`);
                continue;
            }
        }
        await addDoc(collection(db, "students"), dataForFirestore);
        successCount++;
      } catch (e: any) {
        failCount++;
        errors.push(`Error importing ${row.fullName}: ${e.message}`);
        console.error("Error importing student row: ", e);
      }
    }

    fetchStudents();
    
    let message = `${successCount} student(s) imported successfully.`;
    if (failCount > 0) {
      message += ` ${failCount} student(s) failed to import.`;
      if (errors.length > 0) {
        message += ` Errors: ${errors.slice(0, 3).join("; ")}${errors.length > 3 ? '...' : ''}`;
      }
    }
    return { success: successCount > 0 || (successCount === 0 && failCount === 0), message };
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Manage Students</h1>
        <div className="flex gap-2">
          <Button onClick={() => setIsImportDialogOpen(true)} variant="outline">
            <UploadCloud className="mr-2 h-5 w-5" /> Import Students
          </Button>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddNew} className="bg-accent hover:bg-accent/90">
                <PlusCircle className="mr-2 h-5 w-5" /> Add New Student
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg bg-card">
              <DialogHeader>
                <DialogTitle className="text-xl">{editingStudent ? "Edit Student" : "Add New Student"}</DialogTitle>
                <DialogDescription>
                  {editingStudent ? "Update the student's details." : "Fill in the details to add a new student."}
                </DialogDescription>
              </DialogHeader>
              <StudentForm 
                initialData={editingStudent} 
                onClose={() => {
                  setIsFormOpen(false);
                  setEditingStudent(null);
                  fetchStudents(); 
                }} 
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <ExcelImportDialog<StudentExcelRow>
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onImport={handleStudentImport}
        templateHeaders={["fullName", "studentSystemId", "email"]}
        templateFileName="students_template.xlsx"
        dialogTitle="Import Students from Excel"
        dialogDescription="Upload an Excel file (.xlsx or .xls) with student data. Ensure column headers match: fullName, studentSystemId (optional), email (optional)."
      />

      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg text-muted-foreground">Loading students...</p>
        </div>
      )}

      {!isLoading && error && (
        <Card className="bg-destructive/10 border-destructive">
          <CardHeader className="flex flex-row items-center gap-2">
             <AlertTriangle className="h-6 w-6 text-destructive" />
            <CardTitle className="text-destructive">Error Loading Students</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive-foreground">{error}</p>
            <Button onClick={fetchStudents} variant="outline" className="mt-4">Try Again</Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && students.length === 0 && (
        <Card className="text-center py-12">
          <CardHeader>
            <div className="mx-auto bg-secondary rounded-full p-3 w-fit">
             <Users2 className="h-12 w-12 text-muted-foreground" data-ai-hint="users group" />
            </div>
            <CardTitle className="mt-4 text-2xl">No Students Found</CardTitle>
            <CardDescription>
              Get started by adding your first student or importing from Excel.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {!isLoading && !error && students.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Student List</CardTitle>
            <CardDescription>A list of all registered students.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-22rem)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Full Name</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Assigned Class</TableHead>
                    <TableHead>Registered On</TableHead>
                    <TableHead className="text-right w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.fullName}</TableCell>
                      <TableCell>{student.studentSystemId || "N/A"}</TableCell>
                      <TableCell>{student.email || "N/A"}</TableCell>
                      <TableCell>
                        {student.className ? (
                          <Badge variant="secondary">{student.className}</Badge>
                        ) : (
                          <span className="text-muted-foreground italic">Not Assigned</span>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(student.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleEdit(student)}>
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
                                  This action cannot be undone. This will permanently delete the student "{student.fullName}"
                                  and may affect their enrollments and grades.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(student.id, student.fullName)} className="bg-destructive hover:bg-destructive/90">
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
  );
}
