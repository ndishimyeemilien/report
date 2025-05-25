
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Student, Grade } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, AlertTriangle, UserCircle, BookOpen, Percent, CheckCircle, XCircle } from "lucide-react";

const PASS_MARK = 50;

interface StudentReportData {
  student: Student | null;
  grades: Grade[];
  totalMarks: number;
  averageMarks: number | null;
  overallStatus: 'Pass' | 'Fail' | 'N/A';
}

export default function StudentReportPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.studentId as string;

  const [reportData, setReportData] = useState<StudentReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) {
      setError("Student ID is missing.");
      setIsLoading(false);
      return;
    }

    const fetchStudentData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const studentRef = doc(db, "students", studentId);
        const studentSnap = await getDoc(studentRef);

        if (!studentSnap.exists()) {
          setError("Student not found.");
          setReportData(null);
          setIsLoading(false);
          return;
        }
        const studentData = { id: studentSnap.id, ...studentSnap.data() } as Student;

        const gradesQuery = query(
          collection(db, "grades"),
          where("studentId", "==", studentId),
          orderBy("courseName", "asc") 
        );
        const gradesSnapshot = await getDocs(gradesQuery);
        const gradesData = gradesSnapshot.docs.map(d => ({
          id: d.id,
          ...d.data(),
          createdAt: (d.data().createdAt as Timestamp)?.toDate(),
          updatedAt: (d.data().updatedAt as Timestamp)?.toDate(),
        } as Grade));

        let totalMarks = 0;
        gradesData.forEach(grade => {
          totalMarks += grade.marks;
        });
        
        const averageMarks = gradesData.length > 0 ? totalMarks / gradesData.length : null;
        let overallStatus: 'Pass' | 'Fail' | 'N/A' = 'N/A';
        if (averageMarks !== null) {
          overallStatus = averageMarks >= PASS_MARK ? 'Pass' : 'Fail';
        }
        
        setReportData({
          student: studentData,
          grades: gradesData,
          totalMarks,
          averageMarks,
          overallStatus,
        });

      } catch (err: any) {
        console.error("Error fetching student report data:", err);
        setError("Failed to load student report. Please try again.");
        setReportData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentData();
  }, [studentId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-8rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Loading student report...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="m-4 bg-destructive/10 border-destructive">
        <CardHeader className="flex flex-row items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-destructive" />
          <CardTitle className="text-destructive">Error Loading Report</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive-foreground">{error}</p>
          <Button onClick={() => router.back()} variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!reportData || !reportData.student) {
    return (
      <Card className="m-4 text-center py-12">
        <CardHeader>
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto" data-ai-hint="warning sign" />
          <CardTitle className="mt-4 text-2xl">Student Report Not Available</CardTitle>
          <CardDescription>The requested student report could not be found or generated.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back to Reports
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { student, grades, totalMarks, averageMarks, overallStatus } = reportData;

  const formatNumber = (num: number | null, precision = 1) => {
    if (num === null || num === undefined || isNaN(num)) return "N/A";
    return num.toFixed(precision);
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Button onClick={() => router.back()} variant="outline" className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Reports
      </Button>

      <Card className="shadow-lg">
        <CardHeader className="border-b pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
                <CardTitle className="text-2xl text-primary">Student Academic Report</CardTitle>
                <CardDescription>Detailed academic performance for {student.fullName}.</CardDescription>
            </div>
            {/* Placeholder for school logo or emblem */}
            {/* <img src="/placeholder-logo.png" alt="School Logo" className="h-16 w-auto" data-ai-hint="school emblem" /> */}
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 p-4 border rounded-lg bg-muted/30">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Student Name</p>
              <p className="text-lg font-semibold text-foreground">{student.fullName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Student ID</p>
              <p className="text-lg font-semibold text-foreground">{student.studentSystemId || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Class</p>
              <p className="text-lg font-semibold text-foreground">{student.className || "N/A"}</p>
            </div>
            {/* Add more student details here if needed, e.g., Academic Year, Term */}
          </div>

          <h3 className="text-xl font-semibold text-foreground pt-4 flex items-center">
            <BookOpen className="mr-2 h-5 w-5 text-primary" />
            Subject Marks
          </h3>
          {grades.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Subject Name</TableHead>
                    <TableHead className="text-center">Marks Obtained (Out of 100)</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grades.map((grade) => (
                    <TableRow key={grade.id}>
                      <TableCell className="font-medium">{grade.courseName}</TableCell>
                      <TableCell className="text-center font-semibold">{grade.marks}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={grade.status === 'Pass' ? 'default' : 'destructive'}
                               className={grade.status === 'Pass' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}>
                          {grade.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground italic">{grade.remarks || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground italic">No grades recorded for this student yet.</p>
          )}
        </CardContent>
        {grades.length > 0 && (
          <CardFooter className="border-t pt-6 mt-6 flex-col items-start space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
              <div className="flex items-center space-x-2 p-3 border rounded-md bg-card">
                 <Percent className="h-7 w-7 text-primary" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Total Marks Obtained</p>
                  <p className="text-lg font-bold">{totalMarks} / {grades.length * 100}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-md bg-card">
                 <Percent className="h-7 w-7 text-primary" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Average Percentage</p>
                  <p className="text-lg font-bold">{formatNumber(averageMarks)}%</p>
                </div>
              </div>
               <div className="flex items-center space-x-2 p-3 border rounded-md bg-card">
                {overallStatus === 'Pass' ? <CheckCircle className="h-7 w-7 text-green-500" /> : (overallStatus === 'Fail' ? <XCircle className="h-7 w-7 text-red-500" /> : <UserCircle className="h-7 w-7 text-muted-foreground" />)}
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Overall Status</p>
                  <p className={`text-lg font-bold ${overallStatus === 'Pass' ? 'text-green-600' : (overallStatus === 'Fail' ? 'text-red-600' : 'text-muted-foreground')}`}>
                    {overallStatus}
                  </p>
                </div>
              </div>
            </div>
          </CardFooter>
        )}
      </Card>
      
      {/* Placeholder for Teacher's Remarks and Head Teacher's Remarks */}
      <Card className="mt-6">
        <CardHeader>
            <CardTitle className="text-lg">Additional Remarks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div>
                <p className="font-medium text-sm text-muted-foreground">Class Teacher's Remarks:</p>
                <p className="text-sm italic h-10 border-b">_________________________________________________________</p>
            </div>
             <div>
                <p className="font-medium text-sm text-muted-foreground">Head Teacher's Remarks:</p>
                <p className="text-sm italic h-10 border-b">_________________________________________________________</p>
            </div>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
            Report Generated On: {new Date().toLocaleDateString()}
        </CardFooter>
      </Card>

    </div>
  );
}

