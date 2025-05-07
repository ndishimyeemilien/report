"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, getDocs, query, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Course, Grade } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, Legend as RechartsLegend } from "recharts";
import { Loader2, AlertTriangle, BarChart3, Percent, CheckCircle, XCircle, TrendingUp, TrendingDown, ListChecks } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ReportData {
  overallStats: {
    totalStudentsGraded: number;
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
    totalStudents: number;
    averageMarks: number | null;
    passCount: number;
    failCount: number;
    passRate: number | null;
    highestMark: number | null;
    lowestMark: number | null;
  }>;
  marksDistribution: Array<{
    range: string;
    count: number;
  }>;
  totalCourses: number;
  totalGrades: number;
}

const PASS_MARK = 40;

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
    let passCount = 0;
    let highestMarkOverall: number | null = null;
    let lowestMarkOverall: number | null = null;

    if (grades.length > 0) {
      grades.forEach(grade => {
        totalMarks += grade.marks;
        if (grade.status === 'Pass') passCount++;
        if (highestMarkOverall === null || grade.marks > highestMarkOverall) highestMarkOverall = grade.marks;
        if (lowestMarkOverall === null || grade.marks < lowestMarkOverall) lowestMarkOverall = grade.marks;
      });
    }
    
    const averageMarksOverall = grades.length > 0 ? totalMarks / grades.length : null;
    const passRateOverall = grades.length > 0 ? (passCount / grades.length) * 100 : null;
    const failRateOverall = grades.length > 0 ? 100 - (passRateOverall || 0) : null;

    // Course Performance
    const coursePerformance = courses.map(course => {
      const courseGrades = grades.filter(grade => grade.courseId === course.id);
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
        totalStudents: courseGrades.length,
        averageMarks: courseGrades.length > 0 ? courseTotalMarks / courseGrades.length : null,
        passCount: coursePassCount,
        failCount: courseGrades.length - coursePassCount,
        passRate: courseGrades.length > 0 ? (coursePassCount / courseGrades.length) * 100 : null,
        highestMark: courseHighestMark,
        lowestMark: courseLowestMark,
      };
    });

    // Marks Distribution
    const marksDistribution = Array(10).fill(null).map((_, i) => ({
      range: `${i * 10 + 1}-${(i + 1) * 10}`,
      count: 0,
    }));
    // Adjust first range to be 0-10
    marksDistribution[0].range = "0-10";

    grades.forEach(grade => {
      const mark = grade.marks;
      if (mark === 0) { // Handle 0 specifically for the 0-10 range
        marksDistribution[0].count++;
      } else {
        const rangeIndex = Math.min(Math.floor((mark -1) / 10), 9) ; // -1 to correctly bin 10, 20, etc.
        if (rangeIndex >=0 && rangeIndex < marksDistribution.length) {
           marksDistribution[rangeIndex].count++;
        }
      }
    });
    
    setReportData({
      overallStats: {
        totalStudentsGraded: grades.length,
        averageMarks: averageMarksOverall,
        passRate: passRateOverall,
        failRate: failRateOverall,
        highestMark: highestMarkOverall,
        lowestMark: lowestMarkOverall,
      },
      coursePerformance,
      marksDistribution,
      totalCourses: courses.length,
      totalGrades: grades.length,
    });
  };

  const chartConfig = {
    count: {
      label: "Students",
      color: "hsl(var(--chart-1))",
    },
  };

  const formatNumber = (num: number | null, precision = 1) => {
    if (num === null || num === undefined) return "N/A";
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

  if (!reportData || (reportData.totalCourses === 0 && reportData.totalGrades === 0) ) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
         <h1 className="text-3xl font-bold tracking-tight text-foreground">Academic Reports</h1>
        </div>
        <Card className="text-center py-12">
          <CardHeader>
            <div className="mx-auto bg-secondary rounded-full p-3 w-fit">
             <BarChart3 className="h-12 w-12 text-muted-foreground" data-ai-hint="chart analytics"/>
            </div>
            <CardTitle className="mt-4 text-2xl">No Data for Reports</CardTitle>
            <CardDescription>
              There are no courses or grades recorded in the system yet.
              Please add courses and grades to generate reports.
            </CardDescription>
          </CardHeader>
           <CardContent>
            <Link href="/dashboard/courses">
              <Button variant="outline" className="mr-2">Add Courses</Button>
            </Link>
            <Link href="/dashboard/grades">
              <Button>Add Grades</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const { overallStats, coursePerformance, marksDistribution, totalGrades } = reportData;


  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Academic Reports</h1>
        {/* Future: Add date range filters or export options */}
      </div>

      {totalGrades === 0 ? (
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
                <Link href="/dashboard/grades">
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
          <CardDescription>Summary of academic performance across all courses.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="flex items-center space-x-3 rounded-md border p-4 bg-card hover:shadow-md transition-shadow">
            <Users className="h-8 w-8 text-accent" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Students Graded</p>
              <p className="text-2xl font-bold">{overallStats.totalStudentsGraded}</p>
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
              <p className="text-sm font-medium text-muted-foreground">Pass Rate</p>
              <p className="text-2xl font-bold">{formatNumber(overallStats.passRate)}%</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 rounded-md border p-4 bg-card hover:shadow-md transition-shadow">
            <XCircle className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fail Rate</p>
              <p className="text-2xl font-bold">{formatNumber(overallStats.failRate)}%</p>
            </div>
          </div>
           <div className="flex items-center space-x-3 rounded-md border p-4 bg-card hover:shadow-md transition-shadow">
            <TrendingUp className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Highest Mark</p>
              <p className="text-2xl font-bold">{formatNumber(overallStats.highestMark, 0)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 rounded-md border p-4 bg-card hover:shadow-md transition-shadow">
            <TrendingDown className="h-8 w-8 text-orange-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Lowest Mark</p>
              <p className="text-2xl font-bold">{formatNumber(overallStats.lowestMark, 0)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Marks Distribution Chart */}
      <Card className="mb-8 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-primary">Marks Distribution</CardTitle>
          <CardDescription>Distribution of student marks across different ranges.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={marksDistribution} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="range" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                 <RechartsLegend content={<ChartLegendContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Course Performance Table */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-primary">Course-wise Performance</CardTitle>
          <CardDescription>Detailed performance metrics for each course.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-25rem)] md:h-auto md:max-h-[60vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead className="text-center">Students</TableHead>
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
                    <TableCell className="text-center">{course.totalStudents}</TableCell>
                    <TableCell className="text-center">{formatNumber(course.averageMarks)}%</TableCell>
                    <TableCell className="text-center">
                       {course.passRate !== null ? (
                        <Badge variant={course.passRate >= PASS_MARK ? 'default' : (course.passRate > 0 ? 'secondary' : 'destructive')}
                               className={course.passRate >= PASS_MARK ? 'bg-green-500 hover:bg-green-600' : (course.passRate > 0 ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-red-500 hover:bg-red-600')}>
                            {formatNumber(course.passRate)}%
                        </Badge>
                       ) : 'N/A'}
                    </TableCell>
                    <TableCell className="text-center">{formatNumber(course.highestMark, 0)}</TableCell>
                    <TableCell className="text-center">{formatNumber(course.lowestMark, 0)}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No courses with grades found or no courses available.
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
