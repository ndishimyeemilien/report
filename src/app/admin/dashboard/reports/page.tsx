
"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Course, Grade } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, Legend as RechartsLegend } from "recharts"; // Aliased BarChart to avoid conflict
import { Loader2, AlertTriangle, BarChart3, Percent, CheckCircle, XCircle, TrendingUp, TrendingDown, ListChecks, FileSpreadsheet, Users } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ReportData {
  overallStats: {
    totalStudentsGraded: number; // Number of unique student names with grades
    totalGradeEntries: number; // Total number of grade entries
    averageMarks: number | null;
    passRate: number | null;
    failRate: number | null;
    highestMark: number | null;
    lowestMark: number | null;
  };
  coursePerformance: Array<{
    courseId: string;
    courseName: string;
    courseCode: string;
    totalStudentsInCourse: number; // Number of unique students graded in this course
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
  totalCourses: number;
}

const PASS_MARK = 40; // Assuming 40 is the pass mark

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAndProcessData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const coursesQuery = query(collection(db, "courses"), orderBy("name"));
      const gradesQuery = query(collection(db, "grades"));

      const [coursesSnapshot, gradesSnapshot] = await Promise.all([
        getDocs(coursesQuery),
        getDocs(gradesQuery),
      ]);

      const courses = coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
      const grades = gradesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: (data.createdAt as Timestamp)?.toDate(),
          updatedAt: (data.updatedAt as Timestamp)?.toDate(),
        } as Grade;
      });
      
      generateReportData(courses, grades);

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

  const generateReportData = (courses: Course[], grades: Grade[]) => {
    // Overall Stats
    let totalMarks = 0;
    let passCountOverall = 0;
    let highestMarkOverall: number | null = null;
    let lowestMarkOverall: number | null = null;
    const uniqueStudentNames = new Set(grades.map(g => g.studentName.toLowerCase()));


    if (grades.length > 0) {
      grades.forEach(grade => {
        totalMarks += grade.marks;
        if (grade.status === 'Pass') passCountOverall++;
        if (highestMarkOverall === null || grade.marks > highestMarkOverall) highestMarkOverall = grade.marks;
        if (lowestMarkOverall === null || grade.marks < lowestMarkOverall) lowestMarkOverall = grade.marks;
      });
    }
    
    const averageMarksOverall = grades.length > 0 ? totalMarks / grades.length : null;
    const passRateOverall = grades.length > 0 ? (passCountOverall / grades.length) * 100 : null;
    const failRateOverall = grades.length > 0 && passRateOverall !== null ? 100 - passRateOverall : null;

    // Course Performance
    const coursePerformance = courses.map(course => {
      const courseGrades = grades.filter(grade => grade.courseId === course.id);
      const uniqueStudentsInCourse = new Set(courseGrades.map(g => g.studentName.toLowerCase()));
      let courseTotalMarks = 0;
      let coursePassCount = 0;
      let courseHighestMark: number | null = null;
      let courseLowestMark: number | null = null;

      if (courseGrades.length > 0) {
          courseGrades.forEach(grade => {
            courseTotalMarks += grade.marks;
            if (grade.status === 'Pass') coursePassCount++;
            if (courseHighestMark === null || grade.marks > courseHighestMark) courseHighestMark = grade.marks;
            if (courseLowestMark === null || grade.marks < courseLowestMark) courseLowestMark = grade.marks;
          });
      }

      return {
        courseId: course.id,
        courseName: course.name,
        courseCode: course.code,
        teacherName: course.teacherName,
        totalStudentsInCourse: uniqueStudentsInCourse.size,
        averageMarks: courseGrades.length > 0 ? courseTotalMarks / courseGrades.length : null,
        passCount: coursePassCount,
        failCount: courseGrades.length - coursePassCount,
        passRate: courseGrades.length > 0 ? (coursePassCount / courseGrades.length) * 100 : null,
        highestMark: courseHighestMark,
        lowestMark: courseLowestMark,
      };
    });

    // Marks Distribution (0-10, 11-20, ..., 91-100)
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
      else rangeIndex = 9; // 91-100

      if (rangeIndex >=0 && rangeIndex < marksDistribution.length) {
         marksDistribution[rangeIndex].count++;
      }
    });
    
    setReportData({
      overallStats: {
        totalStudentsGraded: uniqueStudentNames.size,
        totalGradeEntries: grades.length,
        averageMarks: averageMarksOverall,
        passRate: passRateOverall,
        failRate: failRateOverall,
        highestMark: highestMarkOverall,
        lowestMark: lowestMarkOverall,
      },
      coursePerformance,
      marksDistribution,
      totalCourses: courses.length,
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

  if (!reportData || (reportData.totalCourses === 0 && reportData.overallStats.totalGradeEntries === 0) ) {
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
              There are no courses or grades recorded in the system yet.
              Please add courses and grades to generate reports.
            </CardDescription>
          </CardHeader>
           <CardContent>
            <Link href="/admin/dashboard/courses">
              <Button variant="outline" className="mr-2">Add Courses</Button>
            </Link>
            <Link href="/admin/dashboard/grades">
              <Button>Add Grades</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const { overallStats, coursePerformance, marksDistribution } = reportData;


  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Academic Reports</h1>
      </div>

      {reportData.overallStats.totalGradeEntries === 0 ? (
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
      {/* Overall Statistics */}
      <Card className="mb-8 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-primary">Overall Performance Snapshot</CardTitle>
          <CardDescription>Summary of academic performance across all courses and students.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
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

      {/* Marks Distribution Chart */}
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

      {/* Course Performance Table */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-primary">Course-wise Performance Analysis</CardTitle>
          <CardDescription>Detailed performance metrics for each course, including assigned teacher.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-25rem)] md:h-auto md:max-h-[60vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Course Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead className="min-w-[150px]">Teacher</TableHead>
                  <TableHead className="text-center">Graded Students</TableHead>
                  <TableHead className="text-center">Avg. Marks</TableHead>
                  <TableHead className="text-center">Pass Rate</TableHead>
                  <TableHead className="text-center">Highest</TableHead>
                  <TableHead className="text-center">Lowest</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coursePerformance.length > 0 ? coursePerformance.map(course => (
                  <TableRow key={course.courseId}>
                    <TableCell className="font-medium">{course.courseName}</TableCell>
                    <TableCell>{course.courseCode}</TableCell>
                    <TableCell>{course.teacherName || <span className="italic text-muted-foreground">Not Assigned</span>}</TableCell>
                    <TableCell className="text-center">{course.totalStudentsInCourse}</TableCell>
                    <TableCell className="text-center">{formatNumber(course.averageMarks)}%</TableCell>
                    <TableCell className="text-center">
                       {course.passRate !== null ? (
                        <Badge variant={course.passRate >= PASS_MARK ? 'default' : (course.totalStudentsInCourse > 0 ? 'destructive' : 'secondary')}
                               className={
                                course.totalStudentsInCourse === 0 ? 'bg-muted text-muted-foreground hover:bg-muted' :
                                course.passRate >= PASS_MARK ? 'bg-green-500 hover:bg-green-600' 
                                : 'bg-red-500 hover:bg-red-600'
                               }>
                            {course.totalStudentsInCourse === 0 ? 'N/A' : `${formatNumber(course.passRate)}%`}
                        </Badge>
                       ) : 'N/A'}
                    </TableCell>
                    <TableCell className="text-center">{course.totalStudentsInCourse > 0 ? formatNumber(course.highestMark, 0) : 'N/A'}</TableCell>
                    <TableCell className="text-center">{course.totalStudentsInCourse > 0 ? formatNumber(course.lowestMark, 0) : 'N/A'}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No courses available or no grades recorded for any course.
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
