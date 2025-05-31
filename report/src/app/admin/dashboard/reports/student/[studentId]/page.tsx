
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
import { ArrowLeft, Loader2, AlertTriangle, UserCircle, BookOpen, Percent, CheckCircle, XCircle, CalendarDays, MapPin, Award, Users, BarChartHorizontalBig, Printer, Building, Phone } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { format, parseISO } from "date-fns";
import Image from "next/image";

const PASS_MARK = 50;

interface StudentReportData {
  student: Student | null;
  grades: Grade[];
  totalMarksSum: number;
  averageMarks: number | null;
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
        let totalMaxMarksSum = 0; // Assuming each subject is out of 100 for totalMarks
        gradesData.forEach(grade => {
          totalMarksSum += grade.totalMarks ?? 0; 
          totalMaxMarksSum += 100; // Each subject's total is out of 100
        });
        
        const averageMarks = gradesData.length > 0 ? (totalMarksSum / (gradesData.length * 100)) * 100 : null; // Average based on total marks for each subject
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
              let studentTotalMarksObtained = 0;
              let countOfGradedSubjects = 0;
              studentGradesSnapshot.forEach(g => {
                studentTotalMarksObtained += g.data().totalMarks ?? 0;
                countOfGradedSubjects++;
              });
              const studentAverage = countOfGradedSubjects > 0 ? (studentTotalMarksObtained / (countOfGradedSubjects * 100)) * 100 : 0;
              studentAverages.push({ studentId: classStudent.id, average: studentAverage });
            }

            studentAverages.sort((a, b) => b.average - a.average);
            const studentRankIndex = studentAverages.findIndex(sa => sa.studentId === studentId);
            if (studentRankIndex !== -1) {
              let currentRank = 1;
              for(let i = 0; i < studentRankIndex; i++) {
                // Only increment rank if the average is strictly greater
                if (studentAverages[i].average > studentAverages[studentRankIndex].average) {
                  currentRank++;
                } else if (studentAverages[i].average === studentAverages[studentRankIndex].average && i < studentRankIndex) {
                  // If averages are the same, they share the same rank as the first one with that average
                  // This logic needs refinement for proper tied ranking. For simplicity, we use index-based rank.
                  // A more robust ranking would count how many students have a strictly higher average.
                }
              }
               const studentsWithHigherAverage = studentAverages.filter(sa => sa.average > (averageMarks ?? 0)).length;
               rank = `${studentsWithHigherAverage + 1} / ${numberOfStudentsInClass}`;
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

  const handlePrint = () => {
    window.print();
  };

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
      return dateString; 
    }
  };
  
  const formatNumber = (num: number | null, precision = 1) => {
    if (num === null || num === undefined || isNaN(num)) return "N/A";
    return num.toFixed(precision);
  }

  return (
    <div className="container mx-auto py-8 space-y-6 print:py-4 print:space-y-4">
      <div className="flex justify-between items-center print:hidden">
        <Button onClick={() => router.back()} variant="outline" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Reports
        </Button>
        <Button onClick={handlePrint} variant="default" className="mb-6 bg-accent hover:bg-accent/90">
            <Printer className="mr-2 h-4 w-4" /> Print Report
        </Button>
      </div>

      <Card className="shadow-lg print:shadow-none print:border-none">
        <CardHeader className="border-b pb-4 print:border-none">
          <div className="flex flex-col items-center mb-4 print:mb-2">
            <div className="mb-2 h-16 w-40 relative print:h-12 print:w-32"> {/* Adjusted placeholder size and container */}
              {systemSettings?.schoolLogoUrl ? (
                <Image
                    src={systemSettings.schoolLogoUrl}
                    alt={systemSettings.schoolName || "School Logo"}
                    layout="fill"
                    objectFit="contain"
                />
              ) : (
                <div className="h-full w-full bg-muted flex items-center justify-center text-muted-foreground text-sm">
                  <ImageIcon className="h-8 w-8" data-ai-hint="image picture" />
                </div>
              )}
            </div>
            <p className="text-sm font-medium text-muted-foreground uppercase print:text-xs">REPUBLIC OF RWANDA</p>
            <p className="text-sm font-medium text-muted-foreground uppercase print:text-xs">MINISTRY OF EDUCATION</p>
            <h1 className="text-xl font-bold text-primary mt-2 print:text-lg">{systemSettings?.schoolName || "YOUR SCHOOL NAME"}</h1>
            {systemSettings?.schoolAddress && <p className="text-xs text-muted-foreground print:text-xxs">{systemSettings.schoolAddress}</p>}
            {systemSettings?.schoolPhoneNumber && <p className="text-xs text-muted-foreground print:text-xxs">Tel: {systemSettings.schoolPhoneNumber}</p>}
          </div>
          
          <Separator className="my-3 print:my-1"/>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <h2 className="text-2xl font-bold text-center text-primary flex-grow print:text-xl uppercase">REPORT CARD</h2>
            <div className="text-right text-sm print:text-xs">
                <p><strong>School Year:</strong> {systemSettings?.defaultAcademicYear || "YYYY-YYYY"}</p>
                <p><strong>Term:</strong> {grades.length > 0 ? grades[0].term : (systemSettings?.defaultTerm || "N/A")}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4 print:pt-3 print:space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 p-4 border rounded-lg bg-muted/20 text-sm print:p-2 print:border-none print:bg-transparent">
            <div className="flex"><p className="font-medium text-muted-foreground w-32 print:w-24">Student Name:</p><p className="font-semibold text-foreground">{student.fullName}</p></div>
            <div className="flex"><p className="font-medium text-muted-foreground w-32 print:w-24">Class:</p><p className="font-semibold text-foreground">{student.className || "N/A"}</p></div>
            <div className="flex"><p className="font-medium text-muted-foreground w-32 print:w-24">Date of Birth:</p><p className="text-foreground flex items-center">{student.dateOfBirth ? formatUserDate(student.dateOfBirth) : "N/A"}</p></div>
            <div className="flex"><p className="font-medium text-muted-foreground w-32 print:w-24">Place of Birth:</p><p className="text-foreground flex items-center">{student.placeOfBirth || "N/A"}</p></div>
            <div className="flex"><p className="font-medium text-muted-foreground w-32 print:w-24">ID No.:</p><p className="text-foreground">{student.studentSystemId || "N/A"}</p></div>
            <div className="flex"><p className="font-medium text-muted-foreground w-32 print:w-24">N. Students:</p><p className="text-foreground">{numberOfStudentsInClass ?? "--"}</p></div>
            <div className="flex"><p className="font-medium text-muted-foreground w-32 print:w-24">Position/Rank:</p><p className="text-foreground">{rank ?? "--"}</p></div>
            <div className="flex"><p className="font-medium text-muted-foreground w-32 print:w-24">Conduct:</p><p className="text-foreground">{student.conduct || "--"}</p></div>
          </div>

          <h3 className="text-xl font-semibold text-foreground pt-4 flex items-center print:text-lg print:pt-2">
            <BookOpen className="mr-2 h-5 w-5 text-primary" />
            Subject Marks
          </h3>
          {grades.length > 0 ? (
            <div className="overflow-x-auto border rounded-md print:border">
              <Table className="print:text-xs">
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px] print:min-w-[120px]">Subject Name</TableHead>
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
                               className={`${grade.status === 'Pass' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} print:text-white print:border-transparent`}>
                          {grade.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground italic print:text-xs">{grade.remarks || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground italic text-center py-4 print:py-2">No grades recorded for this student yet.</p>
          )}
        </CardContent>
        {grades.length > 0 && (
          <CardFooter className="border-t pt-6 mt-6 flex-col items-start space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0 print:pt-3 print:mt-3 print:border-none">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full print:gap-2">
              <div className="flex items-center space-x-2 p-3 border rounded-md bg-card print:p-1 print:border-gray-400">
                 <BarChartHorizontalBig className="h-7 w-7 text-primary print:h-5 print:w-5" /> 
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Total Marks Obtained</p>
                  <p className="text-lg font-bold print:text-sm">{totalMarksSum} / {grades.length * 100}</p> 
                </div>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-md bg-card print:p-1 print:border-gray-400">
                 <Percent className="h-7 w-7 text-primary print:h-5 print:w-5" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Average Percentage</p>
                  <p className="text-lg font-bold print:text-sm">{formatNumber(averageMarks)}%</p>
                </div>
              </div>
               <div className="flex items-center space-x-2 p-3 border rounded-md bg-card print:p-1 print:border-gray-400">
                {overallStatus === 'Pass' ? <CheckCircle className="h-7 w-7 text-green-500 print:h-5 print:w-5" /> : (overallStatus === 'Fail' ? <XCircle className="h-7 w-7 text-red-500 print:h-5 print:w-5" /> : <UserCircle className="h-7 w-7 text-muted-foreground print:h-5 print:w-5" />)}
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Overall Status</p>
                  <p className={`text-lg font-bold print:text-sm ${overallStatus === 'Pass' ? 'text-green-600' : (overallStatus === 'Fail' ? 'text-red-600' : 'text-muted-foreground')}`}>
                    {overallStatus}
                  </p>
                </div>
              </div>
            </div>
          </CardFooter>
        )}
      </Card>
      
      <Card className="mt-6 print:mt-4">
        <CardHeader className="print:pb-1">
            <CardTitle className="text-lg print:text-base">Additional Remarks & Signatures</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 print:space-y-2 print:text-xs">
            <div className="print:pt-1">
                <p className="font-medium text-sm text-muted-foreground print:text-xs">Observations:</p>
                <div className="h-10 border-b border-dashed print:h-6"></div>
            </div>
             <div className="print:pt-1">
                <p className="font-medium text-sm text-muted-foreground print:text-xs">Class Teacher's Remarks:</p>
                <div className="h-10 border-b border-dashed print:h-6"></div>
            </div>
             <div className="print:pt-1">
                <p className="font-medium text-sm text-muted-foreground print:text-xs">Head Teacher's Remarks:</p>
                <div className="h-10 border-b border-dashed print:h-6"></div>
            </div>
            <div className="grid grid-cols-2 gap-8 pt-6 print:pt-3 print:gap-4">
                 <div>
                    <p className="font-medium text-sm text-muted-foreground print:text-xs">Teacher Signature:</p>
                    <div className="h-10 border-b border-dashed print:h-6"></div>
                </div>
                 <div>
                    <p className="font-medium text-sm text-muted-foreground print:text-xs">Parent Signature:</p>
                    <div className="h-10 border-b border-dashed print:h-6"></div>
                </div>
            </div>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground print:text-xxs print:pt-2 print:border-t print:border-gray-300">
            Report Generated On: {new Date().toLocaleDateString()} <span className="ml-auto print:hidden">School Stamp: _______________</span>
        </CardFooter>
      </Card>
    </div>
  );
}
