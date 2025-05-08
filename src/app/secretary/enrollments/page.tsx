"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EnrollmentForm } from "@/components/enrollments/EnrollmentForm";
import type { Enrollment, Class, ClassCourseAssignment } from "@/types"; // Enrollment still represents Student-Course
import { db } from "@/lib/firebase";
import { collection, deleteDoc, doc, getDocs, query, orderBy, Timestamp, where, writeBatch } from "firebase/firestore";
import { useEffect, useState, useMemo } from "react";
import { PlusCircle, Trash2, UsersRound, Loader2, AlertTriangle } from "lucide-react";
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

interface DisplayEnrollment {
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  enrolledAt: Date; // Could be the earliest enrollment date for that student in that class's courses
  // Represents a unique student-class combination
  uniqueKey: string; 
}

export default function SecretaryEnrollmentsPage() {
  const [allEnrollments, setAllEnrollments] = useState<Enrollment[]>([]); // Raw student-course enrollments
  const [allClasses, setAllClasses] = useState<Class[]>([]);
  const [allClassAssignments, setAllClassAssignments] = useState<ClassCourseAssignment[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();

  const fetchEnrollmentData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const enrollmentsQuery = query(collection(db, "enrollments"), orderBy("studentName", "asc"), orderBy("courseName", "asc"));
      const classesQuery = query(collection(db, "classes"), orderBy("name", "asc"));
      const classAssignmentsQuery = query(collection(db, "classAssignments"), orderBy("className", "asc"));

      const [enrollmentsSnapshot, classesSnapshot, classAssignmentsSnapshot] = await Promise.all([
        getDocs(enrollmentsQuery),
        getDocs(classesQuery),
        getDocs(classAssignmentsQuery),
      ]);
      
      const enrollmentsData = enrollmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        enrolledAt: (doc.data().enrolledAt as Timestamp)?.toDate(),
      })) as Enrollment[];
      setAllEnrollments(enrollmentsData);

      const classesData = classesSnapshot.docs.map(doc => ({id: doc.id, ...doc.data() as Omit<Class, 'id'>}) as Class);
      setAllClasses(classesData);

      const classAssignmentsData = classAssignmentsSnapshot.docs.map(doc => ({id: doc.id, ...doc.data() as Omit<ClassCourseAssignment, 'id'>}) as ClassCourseAssignment);
      setAllClassAssignments(classAssignmentsData);

    } catch (err: any) {
      console.error("Error fetching enrollment data: ", err);
      setError("Failed to load enrollment data. Please try again.");
      toast({ title: "Error", description: "Failed to load enrollment data.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  

  useEffect(() => {
    fetchEnrollmentData();
  }, []);

  // Derived state to display student-class enrollments
  const displayEnrollments = useMemo((): DisplayEnrollment[] => {
    const studentClassMap = new Map<string, DisplayEnrollment>();

    allEnrollments.forEach(enrollment => {
      // Find which class this enrollment's course belongs to
      const assignment = allClassAssignments.find(ca => ca.courseId === enrollment.courseId);
      if (assignment) {
        const studentClassKey = `${enrollment.studentId}-${assignment.classId}`;
        if (!studentClassMap.has(studentClassKey)) {
          const classDetails = allClasses.find(c => c.id === assignment.classId);
          studentClassMap.set(studentClassKey, {
            studentId: enrollment.studentId,
            studentName: enrollment.studentName,
            classId: assignment.classId,
            className: classDetails?.name || assignment.className, // Use classDetails for freshest name
            enrolledAt: enrollment.enrolledAt, // Or use Math.min for multiple courses
            uniqueKey: studentClassKey,
          });
        } else {
          // Optionally update enrolledAt if a new course in the same class has an earlier date
          const existing = studentClassMap.get(studentClassKey)!;
          if (enrollment.enrolledAt < existing.enrolledAt) {
            existing.enrolledAt = enrollment.enrolledAt;
          }
        }
      }
    });
    return Array.from(studentClassMap.values()).sort((a,b) => a.studentName.localeCompare(b.studentName) || a.className.localeCompare(b.className));
  }, [allEnrollments, allClasses, allClassAssignments]);


  const handleAddNew = () => {
    setIsFormOpen(true);
  };

  // Deleting a "student-class" enrollment means finding all student-course enrollments for that student
  // where the course is part of that class, and deleting them.
  const handleDeleteStudentClassEnrollment = async (studentId: string, classId: string, studentName: string, className: string) => {
    const batch = writeBatch(db);
    let deletedCount = 0;

    // Find courses assigned to this class
    const coursesInClass = allClassAssignments
      .filter(ca => ca.classId === classId)
      .map(ca => ca.courseId);

    if (coursesInClass.length === 0) {
      toast({ title: "No Courses in Class", description: `Class "${className}" has no courses assigned. No enrollments to remove.`, variant:"default" });
      return;
    }

    // Find all enrollments for this student in any of the courses of this class
    const enrollmentsToDelete = allEnrollments.filter(
      e => e.studentId === studentId && coursesInClass.includes(e.courseId)
    );

    if (enrollmentsToDelete.length === 0) {
      toast({ title: "No Enrollments Found", description: `No active course enrollments for ${studentName} in class ${className} to remove.`, variant:"default" });
      return;
    }

    enrollmentsToDelete.forEach(enrollment => {
      batch.delete(doc(db, "enrollments", enrollment.id));
      deletedCount++;
    });

    try {
      await batch.commit();
      toast({ title: "Enrollment Cancelled", description: `Enrollment for ${studentName} in class ${className} (and its ${deletedCount} associated courses) has been cancelled.` });
      fetchEnrollmentData(); // Refetch all data
    } catch (error: any) {
      console.error("Error cancelling student-class enrollment: ", error);
      toast({ title: "Cancellation Failed", description: error.message || "Could not cancel enrollments.", variant: "destructive" });
    }
  };
  
  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Manage Student Enrollments in Classes</h1>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew} className="bg-accent hover:bg-accent/90">
              <PlusCircle className="mr-2 h-5 w-5" /> Enroll Student in Class
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg bg-card">
            <DialogHeader>
              <DialogTitle className="text-xl">Enroll Student in Class</DialogTitle>
              <DialogDescription>
                Select a student and a class. The student will be enrolled in all courses assigned to that class.
              </DialogDescription>
            </DialogHeader>
            <EnrollmentForm 
              onClose={() => {
                setIsFormOpen(false);
                fetchEnrollmentData(); 
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
            <Button onClick={fetchEnrollmentData} variant="outline" className="mt-4">Try Again</Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && displayEnrollments.length === 0 && (
        <Card className="text-center py-12">
          <CardHeader>
            <div className="mx-auto bg-secondary rounded-full p-3 w-fit">
             <UsersRound className="h-12 w-12 text-muted-foreground" data-ai-hint="group people" />
            </div>
            <CardTitle className="mt-4 text-2xl">No Student-Class Enrollments Found</CardTitle>
            <CardDescription>
              Get started by enrolling students in classes. Click "Enroll Student in Class".
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {!isLoading && !error && displayEnrollments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Student-Class Enrollment List</CardTitle>
            <CardDescription>A list of students and the classes they are enrolled in. Deleting an entry removes the student from all courses in that class.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-20rem)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Student Name</TableHead>
                    <TableHead>Class Name</TableHead>
                    <TableHead>Enrolled On</TableHead>
                    <TableHead className="text-right w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayEnrollments.map((enrollment) => (
                    <TableRow key={enrollment.uniqueKey}>
                      <TableCell className="font-medium">{enrollment.studentName}</TableCell>
                      <TableCell>{enrollment.className}</TableCell>
                      <TableCell>{formatDate(enrollment.enrolledAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="icon" className="h-8 w-8">
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Cancel Enrollment from Class</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action will cancel all course enrollments for "{enrollment.studentName}" within the class "{enrollment.className}". 
                                  This cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Back</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteStudentClassEnrollment(enrollment.studentId, enrollment.classId, enrollment.studentName, enrollment.className)} 
                                  className="bg-destructive hover:bg-destructive/90"
                                >
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
