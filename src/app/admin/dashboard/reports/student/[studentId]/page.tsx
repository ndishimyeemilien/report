
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Student, Grade, SystemSettings } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, AlertTriangle, UserCircle, BookOpen, Percent, CheckCircle, XCircle, CalendarDays, MapPin, Award, Users, BarChartHorizontalBig } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { format, parseISO } from "date-fns";

const PASS_MARK = 50;

interface StudentReportData {
  student: Student | null;
  grades: Grade[];
  totalMarksSum: number; // Sum of totalMarks
  averageMarks: number | null; // Average of totalMarks
  overallStatus: 'Pass' | 'Fail' | 'N/A';
  systemSettings: SystemSettings | null;
  numberOfStudentsInClass?: number;
  rank?: string;
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

        let totalMarksSum = 0;
        gradesData.forEach(grade => {
          totalMarksSum += grade.totalMarks ?? 0; // Use totalMarks
        });
        
        const averageMarks = gradesData.length > 0 ? totalMarksSum / gradesData.length : null;
        let overallStatus: 'Pass' | 'Fail' | 'N/A' = 'N/A';
        if (averageMarks !== null) {
          overallStatus = averageMarks >= PASS_MARK ? 'Pass' : 'Fail';
        }

        const settingsRef = doc(db, "systemSettings", "generalConfig");
        const settingsSnap = await getDoc(settingsRef);
        const systemSettingsData = settingsSnap.exists() ? settingsSnap.data() as SystemSettings : null;
        
        let numberOfStudentsInClass: number | undefined = undefined;
        let rank: string | undefined = undefined;

        if (studentData.classId) {
          const classStudentsQuery = query(collection(db, "students"), where("classId", "==", studentData.classId));
          const classStudentsSnapshot = await getDocs(classStudentsQuery);
          numberOfStudentsInClass = classStudentsSnapshot.size;

          if (numberOfStudentsInClass > 0) {
            const studentAverages: { studentId: string, average: number }[] = [];
            for (const classStudentDoc of classStudentsSnapshot.docs) {
              const classStudent = { id: classStudentDoc.id, ...classStudentDoc.data() } as Student;
              const studentGradesQuery = query(collection(db, "grades"), where("studentId", "==", classStudent.id));
              const studentGradesSnapshot = await getDocs(studentGradesQuery);
              let studentTotalMarksSum = 0;
              let countOfGradedSubjects = 0;
              studentGradesSnapshot.forEach(g => {
                studentTotalMarksSum += g.data().totalMarks ?? 0;
                countOfGradedSubjects++;
              });
              const studentAverage = countOfGradedSubjects > 0 ? studentTotalMarksSum / countOfGradedSubjects : 0;
              studentAverages.push({ studentId: classStudent.id, average: studentAverage });
            }

            studentAverages.sort((a, b) => b.average - a.average);
            const studentRankIndex = studentAverages.findIndex(sa => sa.studentId === studentId);
            if (studentRankIndex !== -1) {
              let currentRank = 1;
              for(let i = 0; i < studentRankIndex; i++) {
                if (studentAverages[i].average > studentAverages[studentRankIndex].average) {
                  currentRank++;
                }
              }
              rank = `${currentRank} out of ${numberOfStudentsInClass}`;
            }
          }
        }
        
        setReportData({
          student: studentData,
          grades: gradesData,
          totalMarksSum,
          averageMarks,
          overallStatus,
          systemSettings: systemSettingsData,
          numberOfStudentsInClass,
          rank,
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
          <Button onClick={() => router.back()} variant="outline" className="mt-4 print:hidden">
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
          <Button onClick={() => router.back()} variant="outline" className="print:hidden">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back to Reports
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { student, grades, totalMarksSum, averageMarks, overallStatus, systemSettings, numberOfStudentsInClass, rank } = reportData;

  const formatUserDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    try {
      return format(parseISO(dateString), "dd/MM/yyyy");
    } catch (e) {
      return dateString; // Return original if parsing fails
    }
  };
  
  const formatNumber = (num: number | null, precision = 1) => {
    if (num === null || num === undefined || isNaN(num)) return "N/A";
    return num.toFixed(precision);
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Button onClick={() => router.back()} variant="outline" className="mb-6 print:hidden">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Reports
      </Button>

      <Card className="shadow-lg print:shadow-none print:border-none">
        <CardHeader className="border-b pb-4 print:border-none">
          <div className="text-center mb-4">
            <p className="text-sm font-medium text-muted-foreground">REPUBLIC OF RWANDA</p>
            <p className="text-sm font-medium text-muted-foreground">MINISTRY OF EDUCATION</p>
            <h1 className="text-xl font-bold text-primary mt-2">COLLEGE DE BETHEL / APARU</h1>
            <p className="text-xs text-muted-foreground">P.O.BOX: 70 RUHANGO | Tel: 0788836651 / 0784522178</p>
          </div>
          
          <Separator className="my-3"/>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <h2 className="text-2xl font-bold text-center text-primary flex-grow">REPORT CARD</h2>
            <div className="text-right text-sm">
                <p>School Year: {systemSettings?.defaultAcademicYear || "YYYY-YYYY"}</p>
                <p>Term: {grades.length > 0 ? grades[0].term : (systemSettings?.defaultTerm || "N/A")}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 p-4 border rounded-lg bg-muted/30 text-sm">
            <div className="flex">
              <p className="font-medium text-muted-foreground w-32">Student Name:</p>
              <p className="font-semibold text-foreground">{student.fullName}</p>
            </div>
             <div className="flex">
              <p className="font-medium text-muted-foreground w-32">Class:</p>
              <p className="font-semibold text-foreground">{student.className || "N/A"}</p>
            </div>
            <div className="flex">
              <p className="font-medium text-muted-foreground w-32">Date of Birth:</p>
              <p className="text-foreground flex items-center">
                <CalendarDays className="mr-1.5 h-4 w-4 text-muted-foreground" /> 
                {formatUserDate(student.dateOfBirth) || "N/A"}
              </p>
            </div>
            <div className="flex">
              <p className="font-medium text-muted-foreground w-32">Place of Birth:</p>
              <p className="text-foreground flex items-center">
                 <MapPin className="mr-1.5 h-4 w-4 text-muted-foreground" /> 
                 {student.placeOfBirth || "N/A"}
              </p>
            </div>
            <div className="flex">
              <p className="font-medium text-muted-foreground w-32">ID No.:</p>
              <p className="text-foreground">{student.studentSystemId || "N/A"}</p>
            </div>
            <div className="flex">
              <p className="font-medium text-muted-foreground w-32">N. Students in Class:</p>
              <p className="text-foreground flex items-center">
                <Users className="mr-1.5 h-4 w-4 text-muted-foreground" />
                {numberOfStudentsInClass ?? "--"}
              </p>
            </div>
             <div className="flex">
              <p className="font-medium text-muted-foreground w-32">Position / Rank:</p>
               <p className="text-foreground flex items-center">
                <Award className="mr-1.5 h-4 w-4 text-muted-foreground" />
                {rank ?? "--"}
              </p>
            </div>
             <div className="flex">
              <p className="font-medium text-muted-foreground w-32">Conduct:</p>
              <p className="text-foreground">-- (Placeholder)</p>
            </div>
          </div>

          <h3 className="text-xl font-semibold text-foreground pt-4 flex items-center">
            <BookOpen className="mr-2 h-5 w-5 text-primary" />
            Subject Marks
          </h3>
          {grades.length > 0 ? (
            <div className="overflow-x-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Subject Name</TableHead>
                    <TableHead className="text-center">CA1</TableHead>
                    <TableHead className="text-center">CA2</TableHead>
                    <TableHead className="text-center">Exam</TableHead>
                    <TableHead className="text-center font-semibold">Total</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grades.map((grade) => (
                    <TableRow key={grade.id}>
                      <TableCell className="font-medium">{grade.courseName}</TableCell>
                      <TableCell className="text-center">{grade.ca1 ?? '-'}</TableCell>
                      <TableCell className="text-center">{grade.ca2 ?? '-'}</TableCell>
                      <TableCell className="text-center">{grade.exam ?? '-'}</TableCell>
                      <TableCell className="text-center font-semibold">{grade.totalMarks ?? '-'}</TableCell>
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
            <p className="text-muted-foreground italic text-center py-4">No grades recorded for this student yet.</p>
          )}
        </CardContent>
        {grades.length > 0 && (
          <CardFooter className="border-t pt-6 mt-6 flex-col items-start space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0 print:border-none">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
              <div className="flex items-center space-x-2 p-3 border rounded-md bg-card">
                 <BarChartHorizontalBig className="h-7 w-7 text-primary" /> {/* Changed Icon */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Total Marks Obtained</p>
                  <p className="text-lg font-bold">{totalMarksSum} / {grades.length * 100}</p> {/* Assuming each subject total is 100 */}
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
      
      <Card className="mt-6 print:mt-10">
        <CardHeader>
            <CardTitle className="text-lg">Additional Remarks & Signatures</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
            <div>
                <p className="font-medium text-sm text-muted-foreground">Observations:</p>
                <p className="text-sm italic h-12 border-b border-dashed">__________________________________________________________________________________________________________________</p>
            </div>
             <div>
                <p className="font-medium text-sm text-muted-foreground">Class Teacher's Remarks:</p>
                <p className="text-sm italic h-12 border-b border-dashed">__________________________________________________________________________________________________________________</p>
            </div>
             <div>
                <p className="font-medium text-sm text-muted-foreground">Head Teacher's Remarks:</p>
                <p className="text-sm italic h-12 border-b border-dashed">__________________________________________________________________________________________________________________</p>
            </div>
            <div className="grid grid-cols-2 gap-8 pt-8">
                 <div>
                    <p className="font-medium text-sm text-muted-foreground">Teacher Signature:</p>
                    <p className="text-sm italic h-12 border-b border-dashed"></p>
                </div>
                 <div>
                    <p className="font-medium text-sm text-muted-foreground">Parent Signature:</p>
                    <p className="text-sm italic h-12 border-b border-dashed"></p>
                </div>
            </div>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground print:hidden">
            Report Generated On: {new Date().toLocaleDateString()}
        </CardFooter>
      </Card>

    </div>
  );
}
