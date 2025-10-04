
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Edit, CheckSquare } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Course, Grade } from "@/types";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TeacherStats {
  assignedCourses: number;
  gradesEntered: number;
  error: string | null;
}

export default function TeacherDashboardPage() {
  const { userProfile, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<TeacherStats>({ assignedCourses: 0, gradesEntered: 0, error: null });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !userProfile) return;

    const fetchStats = async () => {
      setIsLoading(true);
      let assignedCourses = 0;
      let gradesEntered = 0;
      let error: string | null = null;

      try {
        // Fetch assigned courses
        const coursesQuery = query(collection(db, "courses"), where("teacherId", "==", userProfile.uid));
        const coursesSnapshot = await getDocs(coursesQuery);
        assignedCourses = coursesSnapshot.size;

        // Fetch grades entered by this teacher
        const gradesQuery = query(collection(db, "grades"), where("enteredByTeacherId", "==", userProfile.uid));
        const gradesSnapshot = await getDocs(gradesQuery);
        gradesEntered = gradesSnapshot.size;

      } catch (err) {
        console.error("Error fetching teacher stats:", err);
        error = "Could not load statistics.";
      }
      setStats({ assignedCourses, gradesEntered, error });
      setIsLoading(false);
    };

    fetchStats();
  }, [userProfile, authLoading]);


  const dashboardItems = [
    { title: "My Assigned Courses", value: stats.assignedCourses.toString(), icon: BookOpen, href: "/teacher/courses", bgColor: "bg-blue-100", textColor: "text-blue-700", iconColor: "text-blue-500" },
    { title: "Enter / View Grades", value: "Manage", icon: Edit, href: "/teacher/grades", bgColor: "bg-green-100", textColor: "text-green-700", iconColor: "text-green-500" },
    { title: "Grades Entered by You", value: stats.gradesEntered.toString(), icon: CheckSquare, href: "/teacher/grades?filter=mine", bgColor: "bg-teal-100", textColor: "text-teal-700", iconColor: "text-teal-500" },
    { title: "Manage Attendance", value: "Mark", icon: CheckSquare, href: "/teacher/attendance", bgColor: "bg-purple-100", textColor: "text-purple-700", iconColor: "text-purple-500" },
  ];

  if (authLoading || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }


  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-8 text-3xl font-bold tracking-tight text-foreground">Teacher Dashboard</h1>
      
      {stats.error && (
        <Card className="mb-6 bg-destructive/10 border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive-foreground">{stats.error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {dashboardItems.map((item) => (
           <Link href={item.href} key={item.title}>
            <Card className={'hover:shadow-lg transition-shadow duration-200'}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{item.title}</CardTitle>
                <item.icon className={cn('h-5 w-5', item.iconColor)} />
              </CardHeader>
              <CardContent>
                <div className={cn('text-3xl font-bold', item.textColor)}>{item.value}</div>
                <p className="text-xs text-muted-foreground pt-1">
                    {item.title === "Enter / View Grades" || item.title === "Manage Attendance" ? "Go to Management" : "View Details"}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-12">
        <Card>
          <CardHeader>
            <CardTitle>Welcome, {userProfile?.email || "Teacher"}!</CardTitle>
            <CardDescription>
              This is your portal to manage grades and attendance for your assigned courses.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>View your assigned courses in the "My Courses" section.</li>
                <li>Enter and update student grades via the "Enter Grades" section.</li>
                <li>Mark student attendance in the "Attendance" section.</li>
                <li>Keep track of grades you've entered.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
