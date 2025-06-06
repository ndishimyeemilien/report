
"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, Timestamp, where, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Course, Grade, Student, Enrollment, SystemSettings } from "@/types"; 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, Legend as RechartsLegend } from "recharts";
import { Loader2, AlertTriangle, BarChart3, Percent, CheckCircle, XCircle, TrendingUp, TrendingDown, ListChecks, FileSpreadsheet, Users, BookOpen, Download, UserSquare2, ExternalLink, Archive } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface SubjectPerformanceData {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  category: string;
  combination: string;
  totalStudentsEnrolled: number;
  totalStudentsGradedInSubject: number;
  averageMarks: number | null; // Will be average of totalMarks
  passCount: number;
  failCount: number;
  passRate: number | null;
  highestMark: number | null; // Highest totalMarks
  lowestMark: number | null; // Lowest totalMarks
  teacherName?: string;
}

interface StudentPerformanceData {
  studentId: string;
  studentName: string;
  studentSystemId?: string;
  className?: string;
  numberOfSubjectsGraded: number;
  totalMarksObtainedSum: number; // Sum of totalMarks across subjects
  averageMarks: number | null; // Average of totalMarks
}

interface ClassPerformanceData {
  classId: string;
  className: string;
  totalStudentsInClass: number;
  studentsWithGrades: number;
  classAverageMark: number | null;
  studentsPassing: number;
  studentsFailing: number;
  classPassRate: number | null;
}


interface ReportData {
  overallStats: {
    totalStudentsGraded: number;
    totalGradeEntries: number;
    averageMarks: number | null; // Average of totalMarks
    passRate: number | null;
    failRate: number | null;
    highestMark: number | null; // Highest totalMarks
    lowestMark: number | null; // Lowest totalMarks
    totalRegisteredStudents: number;
  };
  subjectPerformance: SubjectPerformanceData[];
  studentPerformance: StudentPerformanceData[];
  classPerformance: ClassPerformanceData[];
  marksDistribution: Array<{
    range: string;
    count: number;
  }>;
  totalSubjects: number;
  totalClasses: number;
  systemSettings: SystemSettings | null;
}

const PASS_MARK = 50; // Assuming total marks are out of 100

// CSV export function for subject performance
const exportSubjectPerformanceToCSV = (subjectPerformanceData: SubjectPerformanceData[]) => {
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
    + rows.map(e => e.map(field => `"${String(field).replace(/"/g, '""')}"`).join(",")).join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "subject_performance_report.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// CSV export function for student performance
const exportStudentPerformanceToCSV = (studentPerformanceData: StudentPerformanceData[]) => {
  if (studentPerformanceData.length === 0) {
    alert("No student performance data to export.");
    return;
  }
  const headers = [
    "Student Name", "Student System ID", "Class Name",
    "Subjects Graded", "Average Mark (%)"
  ];

  const rows = studentPerformanceData.map(sp => [
    sp.studentName,
    sp.studentSystemId || "N/A",
    sp.className || "N/A",
    sp.numberOfSubjectsGraded,
    sp.averageMarks !== null ? sp.averageMarks.toFixed(1) : "N/A",
  ]);

  let csvContent = "data:text/csv;charset=utf-8,"
    + headers.join(",") + "\n"
    + rows.map(e => e.map(field => `"${String(field).replace(/"/g, '""')}"`).join(",")).join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "student_performance_summary.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const exportClassPerformanceToCSV = (classPerformanceData: ClassPerformanceData[]) => {
  if (classPerformanceData.length === 0) {
    alert("No class performance data to export.");
    return;
  }
  const headers = [
    "Class Name", "Total Students", "Students Graded", "Class Average Mark (%)",
    "Students Passing", "Students Failing", "Class Pass Rate (%)"
  ];
  const rows = classPerformanceData.map(cp => [
    cp.className,
    cp.totalStudentsInClass,
    cp.studentsWithGrades,
    cp.classAverageMark !== null ? cp.classAverageMark.toFixed(1) : "N/A",
    cp.studentsPassing,
    cp.studentsFailing,
    cp.classPassRate !== null ? cp.classPassRate.toFixed(1) : "N/A",
  ]);
  let csvContent = "data:text/csv;charset=utf-8,"
    + headers.join(",") + "\n"
    + rows.map(e => e.map(field => `"${String(field).replace(/"/g, '""')}"`).join(",")).join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "class_performance_report.csv");
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
      const subjectsQuery = query(collection(db, "courses"), orderBy("name"));
      const gradesQuery = query(collection(db, "grades"));
      const studentsQuery = query(collection(db, "students"), orderBy("fullName"));
      const enrollmentsQuery = query(collection(db, "enrollments"));
      const classesQuery = query(collection(db, "classes"), orderBy("name"));
      const settingsRef = doc(db, "systemSettings", "generalConfig");


      const [subjectsSnapshot, gradesSnapshot, studentsSnapshot, enrollmentsSnapshot, classesSnapshot, settingsSnap] = await Promise.all([
        getDocs(subjectsQuery),
        getDocs(gradesQuery),
        getDocs(studentsQuery),
        getDocs(enrollmentsQuery),
        getDocs(classesQuery),
        getDoc(settingsRef),
      ]);

      const subjects = subjectsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Course));
      const grades = gradesSnapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          createdAt: (data.createdAt as Timestamp)?.toDate(),
          updatedAt: (data.updatedAt as Timestamp)?.toDate(),
        } as Grade;
      });
      const students = studentsSnapshot.docs.map(d => ({ id: d.id, ...d.data()} as Student));
      const enrollments = enrollmentsSnapshot.docs.map(d => ({id: d.id, ...d.data()} as Enrollment));
      const classes = classesSnapshot.docs.map(d => ({id: d.id, ...d.data()} as Class));
      const systemSettingsData = settingsSnap.exists() ? settingsSnap.data() as SystemSettings : null;

      generateReportData(subjects, grades, students, enrollments, classes, systemSettingsData);

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

  const generateReportData = (subjects: Course[], grades: Grade[], students: Student[], enrollments: Enrollment[], classes: Class[], systemSettings: SystemSettings | null) => {
    let totalMarksSumOverall = 0;
    let passCountOverall = 0;
    let highestMarkOverall: number | null = null;
    let lowestMarkOverall: number | null = null;
    const uniqueStudentIdsGraded = new Set(grades.map(g => g.studentId));

    if (grades.length > 0) {
      grades.forEach(grade => {
        const currentMark = grade.totalMarks ?? 0;
        totalMarksSumOverall += currentMark;
        if (grade.status === 'Pass') passCountOverall++;
        if (highestMarkOverall === null || currentMark > highestMarkOverall) highestMarkOverall = currentMark;
        if (lowestMarkOverall === null || currentMark < lowestMarkOverall) lowestMarkOverall = currentMark;
      });
    }

    const averageMarksOverall = grades.length > 0 ? totalMarksSumOverall / grades.length : null;
    const passRateOverall = grades.length > 0 ? (passCountOverall / grades.length) * 100 : null;
    const failRateOverall = grades.length > 0 && passRateOverall !== null ? 100 - passRateOverall : null;

    const subjectPerformance: SubjectPerformanceData[] = subjects.map(subject => {
      const subjectGrades = grades.filter(grade => grade.courseId === subject.id);
      const uniqueStudentIdsGradedInSubject = new Set(subjectGrades.map(g => g.studentId));

      const subjectEnrollments = enrollments.filter(e => e.courseId === subject.id);
      const uniqueStudentIdsEnrolledInSubject = new Set(subjectEnrollments.map(e => e.studentId));

      let subjectTotalMarksSum = 0;
      let subjectPassCount = 0;
      let subjectHighestMark: number | null = null;
      let subjectLowestMark: number | null = null;

      if (subjectGrades.length > 0) {
          subjectGrades.forEach(grade => {
            const currentMark = grade.totalMarks ?? 0;
            subjectTotalMarksSum += currentMark;
            if (grade.status === 'Pass') subjectPassCount++;
            if (subjectHighestMark === null || currentMark > subjectHighestMark) subjectHighestMark = currentMark;
            if (subjectLowestMark === null || currentMark < subjectLowestMark) subjectLowestMark = currentMark;
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
        averageMarks: subjectGrades.length > 0 ? subjectTotalMarksSum / subjectGrades.length : null,
        passCount: subjectPassCount,
        failCount: subjectGrades.length - subjectPassCount,
        passRate: subjectGrades.length > 0 ? (subjectPassCount / subjectGrades.length) * 100 : null,
        highestMark: subjectHighestMark,
        lowestMark: subjectLowestMark,
      };
    });

    const studentPerformance: StudentPerformanceData[] = students.map(student => {
      const studentGrades = grades.filter(grade => grade.studentId === student.id);
      const numberOfSubjectsGraded = studentGrades.length;
      const totalMarksObtainedSum = studentGrades.reduce((sum, grade) => sum + (grade.totalMarks ?? 0), 0);
      const averageMarks = numberOfSubjectsGraded > 0 ? totalMarksObtainedSum / numberOfSubjectsGraded : null;

      return {
        studentId: student.id,
        studentName: student.fullName,
        studentSystemId: student.studentSystemId,
        className: student.className,
        numberOfSubjectsGraded,
        totalMarksObtainedSum,
        averageMarks,
      };
    });

    const classPerformance: ClassPerformanceData[] = classes.map(cls => {
        const studentsInThisClass = students.filter(s => s.classId === cls.id);
        const studentIdsInThisClass = studentsInThisClass.map(s => s.id);
        
        let studentsWithGradesCount = 0;
        let classTotalAverageSum = 0;
        let studentsPassing = 0;
        let studentsFailing = 0;

        studentPerformance.filter(sp => studentIdsInThisClass.includes(sp.studentId)).forEach(sp => {
            if (sp.numberOfSubjectsGraded > 0 && sp.averageMarks !== null) {
                studentsWithGradesCount++;
                classTotalAverageSum += sp.averageMarks;
                if (sp.averageMarks >= PASS_MARK) {
                    studentsPassing++;
                } else {
                    studentsFailing++;
                }
            }
        });
        
        return {
            classId: cls.id,
            className: cls.name,
            totalStudentsInClass: studentsInThisClass.length,
            studentsWithGrades: studentsWithGradesCount,
            classAverageMark: studentsWithGradesCount > 0 ? classTotalAverageSum / studentsWithGradesCount : null,
            studentsPassing,
            studentsFailing,
            classPassRate: studentsWithGradesCount > 0 ? (studentsPassing / studentsWithGradesCount) * 100 : null,
        };
    });


    const marksDistribution = Array(10).fill(null).map((_, i) => ({
      range: i === 0 ? "0-10" : `${i * 10 + 1}-${(i + 1) * 10}`,
      count: 0,
    }));

    grades.forEach(grade => {
      const mark = grade.totalMarks ?? 0; // Use totalMarks
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
      studentPerformance,
      classPerformance,
      marksDistribution,
      totalSubjects: subjects.length,
      totalClasses: classes.length,
      systemSettings,
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

  const { overallStats, subjectPerformance, studentPerformance, classPerformance, marksDistribution } = reportData;


  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Academic Reports</h1>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => exportSubjectPerformanceToCSV(reportData.subjectPerformance)}
            disabled={reportData.subjectPerformance.length === 0 || isLoading}
            className="w-full sm:w-auto"
          >
            <Download className="mr-2 h-5 w-5" /> Export Subject Performance
          </Button>
          <Button
            variant="outline"
            onClick={() => exportStudentPerformanceToCSV(reportData.studentPerformance)}
            disabled={reportData.studentPerformance.length === 0 || isLoading}
            className="w-full sm:w-auto"
          >
            <Download className="mr-2 h-5 w-5" /> Export Student Performance
          </Button>
          <Button
            variant="outline"
            onClick={() => exportClassPerformanceToCSV(reportData.classPerformance)}
            disabled={reportData.classPerformance.length === 0 || isLoading}
            className="w-full sm:w-auto"
          >
            <Download className="mr-2 h-5 w-5" /> Export Class Performance
          </Button>
        </div>
      </div>

      {reportData.overallStats.totalGradeEntries === 0 && reportData.overallStats.totalRegisteredStudents > 0 ? (
        <Card className="text-center py-12">
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
      <Card className="shadow-lg">
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
            <Archive className="h-8 w-8 text-orange-400" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Classes Defined</p>
              <p className="text-2xl font-bold">{reportData.totalClasses}</p>
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
        <Card className="shadow-lg">
            <CardHeader>
            <CardTitle className="text-xl text-primary">Marks Distribution (Based on Total Marks)</CardTitle>
            <CardDescription>Distribution of all student total marks across different ranges (0-100).</CardDescription>
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
          <CardTitle className="text-xl text-primary flex items-center gap-2">
            <Archive className="h-6 w-6"/>
            Class Performance Summary
          </CardTitle>
          <CardDescription>Overview of academic performance for each class.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-25rem)] md:h-auto md:max-h-[60vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Class Name</TableHead>
                  <TableHead className="text-center">Total Students</TableHead>
                  <TableHead className="text-center">Graded Students</TableHead>
                  <TableHead className="text-center">Class Avg. Mark</TableHead>
                  <TableHead className="text-center">Passing</TableHead>
                  <TableHead className="text-center">Failing</TableHead>
                  <TableHead className="text-center">Pass Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classPerformance.length > 0 ? classPerformance.map(cls => (
                  <TableRow key={cls.classId}>
                    <TableCell className="font-medium">{cls.className}</TableCell>
                    <TableCell className="text-center">{cls.totalStudentsInClass}</TableCell>
                    <TableCell className="text-center">{cls.studentsWithGrades}</TableCell>
                    <TableCell className="text-center">{formatNumber(cls.classAverageMark)}%</TableCell>
                    <TableCell className="text-center text-green-600">{cls.studentsPassing}</TableCell>
                    <TableCell className="text-center text-red-600">{cls.studentsFailing}</TableCell>
                    <TableCell className="text-center">
                       {cls.classPassRate !== null ? (
                        <Badge variant={cls.studentsWithGrades === 0 ? 'secondary' : (cls.classPassRate >= PASS_MARK ? 'default' : 'destructive')}
                               className={
                                cls.studentsWithGrades === 0 ? 'bg-muted text-muted-foreground hover:bg-muted' :
                                (cls.classPassRate >= PASS_MARK ? 'bg-green-500 hover:bg-green-600'
                                : 'bg-red-500 hover:bg-red-600')
                               }>
                            {cls.studentsWithGrades === 0 ? 'N/A' : `${formatNumber(cls.classPassRate)}%`}
                        </Badge>
                       ) : 'N/A'}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No classes defined or no student data available for class reports.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>


      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-primary flex items-center gap-2">
            <BookOpen className="h-6 w-6"/>
            Subject-wise Performance Analysis
          </CardTitle>
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

      {studentPerformance.length > 0 && (
         <Card className="shadow-lg">
            <CardHeader>
            <CardTitle className="text-xl text-primary flex items-center gap-2">
                <UserSquare2 className="h-6 w-6"/>
                Student Performance Summary
            </CardTitle>
            <CardDescription>Average performance for each student across all their graded subjects. Click name for detailed report.</CardDescription>
            </CardHeader>
            <CardContent>
            <ScrollArea className="h-[calc(100vh-25rem)] md:h-auto md:max-h-[60vh]">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="min-w-[180px]">Student Name</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead className="text-center">Subjects Graded</TableHead>
                    <TableHead className="text-center">Average Mark (%)</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {studentPerformance.map(student => (
                    <TableRow key={student.studentId}>
                        <TableCell className="font-medium">
                           <Link href={`/admin/dashboard/reports/student/${student.studentId}`} className="hover:underline text-accent">
                                {student.studentName}
                           </Link>
                        </TableCell>
                        <TableCell>{student.studentSystemId || "N/A"}</TableCell>
                        <TableCell>{student.className || "N/A"}</TableCell>
                        <TableCell className="text-center">{student.numberOfSubjectsGraded}</TableCell>
                        <TableCell className="text-center">
                        {student.averageMarks !== null ? (
                            <Badge
                            variant={student.averageMarks >= PASS_MARK ? 'default' : (student.numberOfSubjectsGraded > 0 ? 'destructive' : 'secondary')}
                            className={
                                student.numberOfSubjectsGraded === 0 ? 'bg-muted text-muted-foreground hover:bg-muted' :
                                (student.averageMarks >= PASS_MARK ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600')
                            }
                            >
                            {student.numberOfSubjectsGraded === 0 ? 'N/A' : `${formatNumber(student.averageMarks)}%`}
                            </Badge>
                        ) : (
                            "N/A"
                        )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Link href={`/admin/dashboard/reports/student/${student.studentId}`}>
                            <Button variant="outline" size="sm" className="h-8">
                                <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> View Report
                            </Button>
                          </Link>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </ScrollArea>
            </CardContent>
        </Card>
        )}
      </>
      )}
    </div>
  );
}
