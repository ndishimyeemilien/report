"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClassAssignmentForm } from "@/components/classassignments/ClassAssignmentForm"; 
import type { ClassCourseAssignment } from "@/types";
import { db } from "@/lib/firebase";
import { collection, deleteDoc, doc, getDocs, query, orderBy, Timestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import { PlusCircle, Trash2, Link2, Loader2, AlertTriangle, Edit3 } from "lucide-react"; 
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

export default function SecretaryClassAssignmentsPage() {
  const [assignments, setAssignments] = useState<ClassCourseAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<ClassCourseAssignment | null>(null); 
  const { toast } = useToast();

  const fetchAssignments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const q = query(collection(db, "classAssignments"), orderBy("className", "asc"), orderBy("courseName", "asc"));
      const querySnapshot = await getDocs(q);
      const assignmentsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        assignedAt: (doc.data().assignedAt as Timestamp)?.toDate(),
      })) as ClassCourseAssignment[];
      setAssignments(assignmentsData);
    } catch (err: any) {
      console.error("Error fetching class assignments: ", err);
      setError("Failed to load class assignments. Please try again.");
      toast({ title: "Error", description: "Failed to load class assignments.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleEdit = (assignment: ClassCourseAssignment) => {
    toast({ title: "Info", description: "Editing assignments is disabled in this version." });
    // setEditingAssignment(assignment);
    // setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingAssignment(null); 
    setIsFormOpen(true);
  };

  const handleDelete = async (assignmentId: string, className: string, courseName: string) => {
    try {
      await deleteDoc(doc(db, "classAssignments", assignmentId));
      toast({ title: "Assignment Removed", description: `Assignment of ${courseName} to ${className} has been removed.` });
      fetchAssignments(); 
    } catch (error: any) {
      console.error("Error removing assignment: ", error);
      toast({ title: "Removal Failed", description: error.message || "Could not remove assignment.", variant: "destructive" });
    }
  };
  
  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Manage Class-Course Assignments</h1>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew} className="bg-accent hover:bg-accent/90">
              <PlusCircle className="mr-2 h-5 w-5" /> Assign Course to Class
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg bg-card">
            <DialogHeader>
              <DialogTitle className="text-xl">{editingAssignment ? "Edit Assignment (Disabled)" : "Assign Course to Class"}</DialogTitle>
              <DialogDescription>
                {editingAssignment ? "Update this class-course assignment (Disabled)." : "Select a class and a course to assign."}
              </DialogDescription>
            </DialogHeader>
            <ClassAssignmentForm 
              initialData={editingAssignment}
              onClose={() => {
                setIsFormOpen(false);
                setEditingAssignment(null);
                fetchAssignments(); 
              }} 
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg text-muted-foreground">Loading assignments...</p>
        </div>
      )}

      {!isLoading && error && (
        <Card className="bg-destructive/10 border-destructive">
          <CardHeader className="flex flex-row items-center gap-2">
             <AlertTriangle className="h-6 w-6 text-destructive" />
            <CardTitle className="text-destructive">Error Loading Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive-foreground">{error}</p>
            <Button onClick={fetchAssignments} variant="outline" className="mt-4">Try Again</Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && assignments.length === 0 && (
        <Card className="text-center py-12">
          <CardHeader>
            <div className="mx-auto bg-secondary rounded-full p-3 w-fit">
             <Link2 className="h-12 w-12 text-muted-foreground" data-ai-hint="link chain" />
            </div>
            <CardTitle className="mt-4 text-2xl">No Assignments Found</CardTitle>
            <CardDescription>
              Get started by assigning courses to classes. Click "Assign Course to Class".
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {!isLoading && !error && assignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Class-Course Assignment List</CardTitle>
            <CardDescription>A list of all courses assigned to classes.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-20rem)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Class Name</TableHead>
                    <TableHead>Course Name</TableHead>
                    <TableHead>Assigned On</TableHead>
                    <TableHead className="text-right w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">{assignment.className}</TableCell>
                      <TableCell>{assignment.courseName}</TableCell>
                      <TableCell>{formatDate(assignment.assignedAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                           <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleEdit(assignment)} disabled>
                            <Edit3 className="h-4 w-4" />
                            <span className="sr-only">Edit (Disabled)</span>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="icon" className="h-8 w-8">
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Remove Assignment</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action will remove the assignment of "{assignment.courseName}" from "{assignment.className}". 
                                  This cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Back</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(assignment.id, assignment.className, assignment.courseName)} className="bg-destructive hover:bg-destructive/90">
                                  Confirm Removal
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
            </Scroll