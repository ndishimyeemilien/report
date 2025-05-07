"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GradeForm } from "@/components/grades/GradeForm";
import type { Grade } from "@/types";
import { db } from "@/lib/firebase";
import { collection, deleteDoc, doc, getDocs, query, orderBy, Timestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import { PlusCircle, Edit3, Trash2, ClipboardList, Loader2, AlertTriangle, Download } from "lucide-react";
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

// Basic CSV export function
const exportToCSV = (grades: Grade[]) => {
  if (grades.length === 0) {
    alert("No grades to export.");
    return;
  }
  const headers = ["Student Name", "Course Code", "Course Name", "Marks", "Status", "Remarks", "Date Recorded"];
  const rows = grades.map(grade => [
    grade.studentName,
    // Assuming Course Code is part of Course Name or needs to be fetched if stored separately
    grade.courseName.split('(')[1]?.replace(')','').trim() || 'N/A', 
    grade.courseName.split('(')[0].trim(),
    grade.marks,
    grade.status,
    grade.remarks || "",
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const { toast } = useToast();

  const fetchGrades = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const q = query(collection(db, "grades"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const gradesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate(),
        updatedAt: (doc.data().updatedAt as Timestamp)?.toDate(),
      })) as Grade[];
      setGrades(gradesData);
    } catch (err: any) {
      console.error("Error fetching grades: ", err);
      setError("Failed to load grades. Please try again.");
      toast({ title: "Error", description: "Failed to load grades.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGrades();
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
      fetchGrades(); // Refresh list
    } catch (error: any)
    {
      console.error("Error deleting grade: ", error);
      toast({ title: "Delete Failed", description: error.message || "Could not delete grade.", variant: "destructive" });
    }
  };
  
  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Manage Grades</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportToCSV(grades)} disabled={grades.length === 0 || isLoading}>
            <Download className="mr-2 h-5 w-5" /> Export as CSV
          </Button>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddNew} className="bg-accent hover:bg-accent/90">
                <PlusCircle className="mr-2 h-5 w-5" /> Add New Grade
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg bg-card">
              <DialogHeader>
                <DialogTitle className="text-xl">{editingGrade ? "Edit Grade" : "Add New Grade"}</DialogTitle>
                <DialogDescription>
                  {editingGrade ? "Update the student's grade details." : "Enter the student's grade information."}
                </DialogDescription>
              </DialogHeader>
              <GradeForm 
                initialData={editingGrade} 
                onClose={() => {
                  setIsFormOpen(false);
                  setEditingGrade(null);
                  fetchGrades(); // Refresh list after form close
                }} 
              />
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
            <Button onClick={fetchGrades} variant="outline" className="mt-4">Try Again</Button>
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
            <CardDescription>A list of all recorded student grades.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-22rem)]"> {/* Adjust height as needed */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Student Name</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead className="text-center">Marks</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grades.map((grade) => (
                    <TableRow key={grade.id}>
                      <TableCell className="font-medium">{grade.studentName}</TableCell>
                      <TableCell>{grade.courseName}</TableCell>
                      <TableCell className="text-center">{grade.marks}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={grade.status === 'Pass' ? 'default' : 'destructive'} 
                               className={grade.status === 'Pass' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}>
                          {grade.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={grade.remarks}>{grade.remarks || "-"}</TableCell>
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
  );
}
