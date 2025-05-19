
"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, Timestamp, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Course, Grade, Student, Enrollment } from "@/types"; // Course now means Subject
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, Legend as RechartsLegend } from "recharts";
import { Loader2, AlertTriangle, BarChart3, Percent, CheckCircle, XCircle, TrendingUp, TrendingDown, ListChecks, FileSpreadsheet, Users, BookOpen, Download } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ReportData {
  overallStats: {
    totalStudentsGraded: number; 
    totalGradeEntries: number; 
    averageMarks: number | null;
    passRate: number | null;
    failRate: number | null;
    highestMark: number | null;
    lowestMark: number | null;
    totalRegisteredStudents: number;
  };
  subjectPerformance: Array<{ // Renamed from coursePerformance
    subjectId: string; // Renamed from courseId
    subjectName: string; // Renamed from courseName
    subjectCode: string; // Renamed from courseCode
    category: string; // Added
    combination: string; // Added
    totalStudentsEnrolled: number; 
    totalStudentsGradedInSubject: number; // Renamed
    averageMarks: number | null;
    passCount: number;
    failCount: number;
    passRate: number | null;
    highestMark: number | null;
    lowestMark: number | null;
    teacherName?: string;
  }>;
  marksDistribution: Array<{
    range: string;
    count: number;
  }>;
  totalSubjects: number; // Renamed from totalCourses
}

const PASS_MARK = 50; // Changed from 40 to 50

// CSV export function for subject performance
const exportSubjectPerformanceToCSV = (subjectPerformanceData: ReportData['subjectPerformance']) => {
  if (subjectPerformanceData.length === 0) {
    alert("No subject performance data to export.");
    return;
  }
  const headers = [
    "Subject Name", "Subject Code", "Category", "Combination", "Teacher", 
    "Enrolled Students", "Graded Students", "Average Marks (%)", 
    "Pass Count", "Fail Count", "Pass Rate (%)", 
    "Highest Mark", "Lowest Mark"
  ];
  
  const rows = subjectPerformanceData.map(sp => [
    sp.subjectName,
    sp.subjectCode,
    sp.category,
    sp.combination,
    sp.teacherName || "N/A",
    sp.totalStudentsEnrolled,
    sp.totalStudentsGradedInSubject,
    sp.averageMarks !== null ? sp.averageMarks.toFixed(1) : "N/A",
    sp.passCount,
    sp.failCount,
    sp.passRate !== null ? sp.passRate.toFixed(1) : "N/A",
    sp.highestMark !== null ? sp.highestMark : "N/A",
    sp.lowestMark !== null ? sp.lowestMark : "N/A",
  ]);

  let csvContent = "data:text/csv;charset=utf-8," 
    + headers.join(",") + "\n" 
    + rows.map(e => e.map(field => `"${String(field).replace(/"/g, '""')}"`).join(",")).join("\n"); // Handle commas in fields

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "subject_performance_report.csv");
  document.body.appendChild(link); 
  link.click();
  document.body.removeChild(link);
};


export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAndProcessData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const subjectsQuery = query(collection(db, "courses"), orderBy("name")); // courses collection now stores subjects
      const gradesQuery = query(collection(db, "grades"));
      const studentsQuery = query(collection(db, "students"));
      const enrollmentsQuery = query(collection(db, "enrollments"));


      const [subjectsSnapshot, gradesSnapshot, studentsSnapshot, enrollmentsSnapshot] = await Promise.all([
        getDocs(subjectsQuery),
        getDocs(gradesQuery),
        getDocs(studentsQuery),
        getDocs(enrollmentsQuery),
      ]);

      const subjects = subjectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course)); // Course type now means Subject
      const grades = gradesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: (data.createdAt as Timestamp)?.toDate(),
          updatedAt: (data.updatedAt as Timestamp)?.toDate(),
        } as Grade;
      });
      const students = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data()} as Student));
      const enrollments = enrollmentsSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as Enrollment));
      
      generateReportData(subjects, grades, students, enrollments);

    } catch (err: any) {
      console.error("Error fetching report data:", err);
      setError("Failed to load report data. Please try again.");
      setReportData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAndProcessData();
  }, []);

  const generateReportData = (subjects: Course[], grades: Grade[], students: Student[], enrollments: Enrollment[]) => {
    let totalMarks = 0;
    let passCountOverall = 0;
    let highestMarkOverall: number | null = null;
    let lowestMarkOverall: number | null = null;
    const uniqueStudentIdsGraded = new Set(grades.map(g => g.studentId));

    if (grades.length > 0) {
      grades.forEach(grade => {
        totalMarks += grade.marks;
        if (grade.status === 'Pass') passCountOverall++; // Status is already set based on PASS_MARK in GradeForm
        if (highestMarkOverall === null || grade.marks > highestMarkOverall) highestMarkOverall = grade.marks;
        if (lowestMarkOverall === null || grade.marks < lowestMarkOverall) lowestMarkOverall = grade.marks;
      });
    }
    
    const averageMarksOverall = grades.length > 0 ? totalMarks / grades.length : null;
    const passRateOverall = grades.length > 0 ? (passCountOverall / grades.length) * 100 : null;
    const failRateOverall = grades.length > 0 && passRateOverall !== null ? 100 - passRateOverall : null;

    const subjectPerformance = subjects.map(subject => {
      const subjectGrades = grades.filter(grade => grade.courseId === subject.id); // courseId in Grade refers to subject's ID
      const uniqueStudentIdsGradedInSubject = new Set(subjectGrades.map(g => g.studentId));
      
      const subjectEnrollments = enrollments.filter(e => e.courseId === subject.id); // courseId in Enrollment refers to subject's ID
      const uniqueStudentIdsEnrolledInSubject = new Set(subjectEnrollments.map(e => e.studentId));

      let subjectTotalMarks = 0;
      let subjectPassCount = 0;
      let subjectHighestMark: number | null = null;
      let subjectLowestMark: number | null = null;

      if (subjectGrades.length > 0) {
          subjectGrades.forEach(grade => {
            subjectTotalMarks += grade.marks;
            if (grade.status === 'Pass') subjectPassCount++;
            if (subjectHighestMark === null || grade.marks > subjectHighestMark) subjectHighestMark = grade.marks;
            if (subjectLowestMark === null || grade.marks < subjectLowestMark) subjectLowestMark = grade.marks;
          });
      }

      return {
        subjectId: subject.id,
        subjectName: subject.name,
        subjectCode: subject.code,
        category: subject.category,
        combination: subject.combination,
        teacherName: subject.teacherName,
        totalStudentsEnrolled: uniqueStudentIdsEnrolledInSubject.size,
        totalStudentsGradedInSubject: uniqueStudentIdsGradedInSubject.size,
        averageMarks: subjectGrades.length > 0 ? subjectTotalMarks / subjectGrades.length : null,
        passCount: subjectPassCount,
        failCount: subjectGrades.length - subjectPassCount,
        passRate: subjectGrades.length > 0 ? (subjectPassCount / subjectGrades.length) * 100 : null,
        highestMark: subjectHighestMark,
        lowestMark: subjectLowestMark,
      };
    });

    const marksDistribution = Array(10).fill(null).map((_, i) => ({
      range: i === 0 ? "0-10" : `${i * 10 + 1}-${(i + 1) * 10}`,
      count: 0,
    }));

    grades.forEach(grade => {
      const mark = grade.marks;
      let rangeIndex;
      if (mark <= 10) rangeIndex = 0;
      else if (mark <= 20) rangeIndex = 1;
      else if (mark <= 30) rangeIndex = 2;
      else if (mark <= 40) rangeIndex = 3;
      else if (mark <= 50) rangeIndex = 4;
      else if (mark <= 60) rangeIndex = 5;
      else if (mark <= 70) rangeIndex = 6;
      else if (mark <= 80) rangeIndex = 7;
      else if (mark <= 90) rangeIndex = 8;
      else rangeIndex = 9; 

      if (rangeIndex >=0 && rangeIndex < marksDistribution.length) {
         marksDistribution[rangeIndex].count++;
      }
    });
    
    setReportData({
      overallStats: {
        totalStudentsGraded: uniqueStudentIdsGraded.size,
        totalGradeEntries: grades.length,
        averageMarks: averageMarksOverall,
        passRate: passRateOverall,
        failRate: failRateOverall,
        highestMark: highestMarkOverall,
        lowestMark: lowestMarkOverall,
        totalRegisteredStudents: students.length,
      },
      subjectPerformance,
      marksDistribution,
      totalSubjects: subjects.length,
    });
  };

  const chartConfig = {
    count: {
      label: "Students",
      color: "hsl(var(--chart-1))",
    },
  };

  const formatNumber = (num: number | null, precision = 1) => {
    if (num === null || num === undefined || isNaN(num)) return "N/A";
    return num.toFixed(precision);
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-8rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Generating reports...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="m-4 bg-destructive/10 border-destructive">
        <CardHeader className="flex flex-row items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-destructive" />
          <CardTitle className="text-destructive">Error Loading Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive-foreground">{error}</p>
          <Button onClick={fetchAndProcessData} variant="outline" className="mt-4">Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  if (!reportData || (reportData.totalSubjects === 0 && reportData.overallStats.totalGradeEntries === 0 && reportData.overallStats.totalRegisteredStudents === 0) ) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
         <h1 className="text-3xl font-bold tracking-tight text-foreground">Academic Reports</h1>
        </div>
        <Card className="text-center py-12">
          <CardHeader>
            <div className="mx-auto bg-secondary rounded-full p-3 w-fit">
             <FileSpreadsheet className="h-12 w-12 text-muted-foreground" data-ai-hint="spreadsheet document"/>
            </div>
            <CardTitle className="mt-4 text-2xl">No Data for Reports</CardTitle>
            <CardDescription>
              There are no subjects, grades, or students recorded in the system yet.
              Please add relevant data to generate reports.
            </CardDescription>
          </CardHeader>
           <CardContent className="flex gap-2 justify-center">
            <Link href="/admin/dashboard/courses">
              <Button variant="outline">Add Subjects</Button>
            </Link>
            <Link href="/admin/dashboard/grades">
              <Button>Add Grades</Button>
            </Link>
             <Link href="/secretary/students">
              <Button variant="secondary">Add Students</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const { overallStats, subjectPerformance, marksDistribution } = reportData;


  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Academic Reports</h1>
        <Button 
          variant="outline" 
          onClick={() => exportSubjectPerformanceToCSV(reportData.subjectPerformance)} 
          disabled={reportData.subjectPerformance.length === 0 || isLoading}
        >
          <Download className="mr-2 h-5 w-5" /> Export Subject Performance
        </Button>
      </div>

      {reportData.overallStats.totalGradeEntries === 0 && reportData.overallStats.totalRegisteredStudents > 0 ? (
        <Card className="text-center py-12 mb-8">
            <CardHeader>
                <div className="mx-auto bg-secondary rounded-full p-3 w-fit">
                <ListChecks className="h-12 w-12 text-muted-foreground" data-ai-hint="checklist tasks" />
                </div>
                <CardTitle className="mt-4 text-2xl">No Grades Recorded</CardTitle>
                <CardDescription>
                Reports cannot be generated without student grades. Please add grades first.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Link href="/admin/dashboard/grades">
                    <Button>Add Grades</Button>
                </Link>
            </CardContent>
        </Card>
      ) : (
      <>
      <Card className="mb-8 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-primary">Overall Performance Snapshot</CardTitle>
          <CardDescription>Summary of academic performance across all subjects and students.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          <div className="flex items-center space-x-3 rounded-md border p-4 bg-card hover:shadow-md transition-shadow">
            <BookOpen className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Subjects Defined</p>
              <p className="text-2xl font-bold">{reportData.totalSubjects}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 rounded-md border p-4 bg-card hover:shadow-md transition-shadow">
            <Users className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Registered Students</p>
              <p className="text-2xl font-bold">{overallStats.totalRegisteredStudents}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 rounded-md border p-4 bg-card hover:shadow-md transition-shadow">
            <Users className="h-8 w-8 text-accent" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Unique Students Graded</p>
              <p className="text-2xl font-bold">{overallStats.totalStudentsGraded}</p>
            </div>
          </div>
           <div className="flex items-center space-x-3 rounded-md border p-4 bg-card hover:shadow-md transition-shadow">
            <ListChecks className="h-8 w-8 text-accent" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Grade Entries</p>
              <p className="text-2xl font-bold">{overallStats.totalGradeEntries}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 rounded-md border p-4 bg-card hover:shadow-md transition-shadow">
            <Percent className="h-8 w-8 text-accent" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Average Marks</p>
              <p className="text-2xl font-bold">{formatNumber(overallStats.averageMarks)}%</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 rounded-md border p-4 bg-card hover:shadow-md transition-shadow">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Overall Pass Rate</p>
              <p className="text-2xl font-bold">{formatNumber(overallStats.passRate)}%</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 rounded-md border p-4 bg-card hover:shadow-md transition-shadow">
            <XCircle className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Overall Fail Rate</p>
              <p className="text-2xl font-bold">{formatNumber(overallStats.failRate)}%</p>
            </div>
          </div>
           <div className="flex items-center space-x-3 rounded-md border p-4 bg-card hover:shadow-md transition-shadow">
            <TrendingUp className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Highest Mark Recorded</p>
              <p className="text-2xl font-bold">{formatNumber(overallStats.highestMark, 0)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 rounded-md border p-4 bg-card hover:shadow-md transition-shadow">
            <TrendingDown className="h-8 w-8 text-orange-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Lowest Mark Recorded</p>
              <p className="text-2xl font-bold">{formatNumber(overallStats.lowestMark, 0)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {overallStats.totalGradeEntries > 0 && (
        <Card className="mb-8 shadow-lg">
            <CardHeader>
            <CardTitle className="text-xl text-primary">Marks Distribution</CardTitle>
            <CardDescription>Distribution of all student marks across different ranges (0-100).</CardDescription>
            </CardHeader>
            <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={marksDistribution} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="range" tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <RechartsLegend content={<ChartLegendContent />} />
                    <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
                </RechartsBarChart>
                </ResponsiveContainer>
            </ChartContainer>
            </CardContent>
        </Card>
      )}

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-primary">Subject-wise Performance Analysis</CardTitle>
          <CardDescription>Detailed performance metrics for each subject, including assigned teacher.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-25rem)] md:h-auto md:max-h-[60vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Subject Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Combination</TableHead>
                  <TableHead className="min-w-[120px]">Teacher</TableHead>
                  <TableHead className="text-center">Enrolled</TableHead>
                  <TableHead className="text-center">Graded</TableHead>
                  <TableHead className="text-center">Avg. Marks</TableHead>
                  <TableHead className="text-center">Pass Rate</TableHead>
                  <TableHead className="text-center">Highest</TableHead>
                  <TableHead className="text-center">Lowest</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjectPerformance.length > 0 ? subjectPerformance.map(subject => (
                  <TableRow key={subject.subjectId}>
                    <TableCell className="font-medium">{subject.subjectName}</TableCell>
                    <TableCell>{subject.subjectCode}</TableCell>
                    <TableCell>{subject.category}</TableCell>
                    <TableCell>{subject.combination}</TableCell>
                    <TableCell>{subject.teacherName || <span className="italic text-muted-foreground">Not Assigned</span>}</TableCell>
                    <TableCell className="text-center">{subject.totalStudentsEnrolled}</TableCell>
                    <TableCell className="text-center">{subject.totalStudentsGradedInSubject}</TableCell>
                    <TableCell className="text-center">{formatNumber(subject.averageMarks)}%</TableCell>
                    <TableCell className="text-center">
                       {subject.passRate !== null ? (
                        <Badge variant={subject.totalStudentsGradedInSubject === 0 ? 'secondary' : (subject.passRate >= PASS_MARK ? 'default' : 'destructive')}
                               className={
                                subject.totalStudentsGradedInSubject === 0 ? 'bg-muted text-muted-foreground hover:bg-muted' :
                                (subject.passRate >= PASS_MARK ? 'bg-green-500 hover:bg-green-600' 
                                : 'bg-red-500 hover:bg-red-600')
                               }>
                            {subject.totalStudentsGradedInSubject === 0 ? 'N/A' : `${formatNumber(subject.passRate)}%`}
                        </Badge>
                       ) : 'N/A'}
                    </TableCell>
                    <TableCell className="text-center">{subject.totalStudentsGradedInSubject > 0 ? formatNumber(subject.highestMark, 0) : 'N/A'}</TableCell>
                    <TableCell className="text-center">{subject.totalStudentsGradedInSubject > 0 ? formatNumber(subject.lowestMark, 0) : 'N/A'}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                      No subjects available or no grades recorded for any subject.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
      </>
      )}
    </div>
  );
}

