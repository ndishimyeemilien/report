
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EnrollmentForm } from "@/components/enrollments/EnrollmentForm";
import type { Enrollment } from "@/types";
import { db } from "@/lib/firebase";
import { collection, deleteDoc, doc, getDocs, query, orderBy, Timestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import { PlusCircle, Trash2, UsersRound, Loader2, AlertTriangle } from "lucide-react"; // Edit icon removed as edit form not implemented for this version
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

export default function SecretaryEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  // Editing existing enrollment is not a primary feature for Lite version, focusing on add/delete.
  // const [editingEnrollment, setEditingEnrollment] = useState<Enrollment | null>(null); 
  const { toast } = useToast();

  const fetchEnrollments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Order by student name then course name for better readability
      const q = query(collection(db, "enrollments"), orderBy("studentName", "asc"), orderBy("courseName", "asc"));
      const querySnapshot = await getDocs(q);
      const enrollmentsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        enrolledAt: (doc.data().enrolledAt as Timestamp)?.toDate(),
      })) as Enrollment[];
      setEnrollments(enrollmentsData);
    } catch (err: any) {
      console.error("Error fetching enrollments: ", err);
      setError("Failed to load enrollments. Please try again.");
      toast({ title: "Error", description: "Failed to load enrollments.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const handleAddNew = () => {
    // setEditingEnrollment(null); // If edit was implemented
    setIsFormOpen(true);
  };

  const handleDelete = async (enrollmentId: string, studentName: string, courseName: string) => {
    try {
      await deleteDoc(doc(db, "enrollments", enrollmentId));
      toast({ title: "Enrollment Cancelled", description: `Enrollment for ${studentName} in ${courseName} has been cancelled.` });
      fetchEnrollments(); 
    } catch (error: any) {
      console.error("Error cancelling enrollment: ", error);
      toast({ title: "Cancellation Failed", description: error.message || "Could not cancel enrollment.", variant: "destructive" });
    }
  };
  
  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Manage Enrollments</h1>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew} className="bg-accent hover:bg-accent/90">
              <PlusCircle className="mr-2 h-5 w-5" /> New Enrollment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg bg-card">
            <DialogHeader>
              <DialogTitle className="text-xl">Enroll Student in Course</DialogTitle>
              <DialogDescription>
                Select a student and a course to create a new enrollment.
              </DialogDescription>
            </DialogHeader>
            <EnrollmentForm 
              // initialData={editingEnrollment} // If edit was implemented
              onClose={() => {
                setIsFormOpen(false);
                // setEditingEnrollment(null); // If edit was implemented
                fetchEnrollments(); 
              }} 
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg text-muted-foreground">Loading enrollments...</p>
        </div>
      )}

      {!isLoading && error && (
        <Card className="bg-destructive/10 border-destructive">
          <CardHeader className="flex flex-row items-center gap-2">
             <AlertTriangle className="h-6 w-6 text-destructive" />
            <CardTitle className="text-destructive">Error Loading Enrollments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive-foreground">{error}</p>
            <Button onClick={fetchEnrollments} variant="outline" className="mt-4">Try Again</Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && enrollments.length === 0 && (
        <Card className="text-center py-12">
          <CardHeader>
            <div className="mx-auto bg-secondary rounded-full p-3 w-fit">
             <UsersRound className="h-12 w-12 text-muted-foreground" data-ai-hint="group people" />
            </div>
            <CardTitle className="mt-4 text-2xl">No Enrollments Found</CardTitle>
            <CardDescription>
              Get started by enrolling students in courses. Click "New Enrollment".
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {!isLoading && !error && enrollments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Enrollment List</CardTitle>
            <CardDescription>A list of all student enrollments in courses.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-20rem)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Student Name</TableHead>
                    <TableHead>Course Name</TableHead>
                    <TableHead>Enrolled On</TableHead>
                    <TableHead className="text-right w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map((enrollment) => (
                    <TableRow key={enrollment.id}>
                      <TableCell className="font-medium">{enrollment.studentName}</TableCell>
                      <TableCell>{enrollment.courseName}</TableCell>
                      <TableCell>{formatDate(enrollment.enrolledAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {/* Edit button could be added here if edit functionality is implemented later */}
                          {/* <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleEdit(enrollment)}>
                            <Edit3 className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button> */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="icon" className="h-8 w-8">
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Cancel Enrollment</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action will cancel the enrollment for "{enrollment.studentName}" in "{enrollment.courseName}". 
                                  This cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Back</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(enrollment.id, enrollment.studentName, enrollment.courseName)} className="bg-destructive hover:bg-destructive/90">
                                  Confirm Cancellation
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
