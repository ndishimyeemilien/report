
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Course } from "@/types";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { collection, getDocs, query, where, Timestamp, orderBy } from "firebase/firestore";
import { useEffect, useState } from "react";
import { BookOpen, Loader2, AlertTriangle, Info, Briefcase } from "lucide-react"; // Added Briefcase
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function TeacherCoursesPage() {
  const { userProfile, loading: authLoading } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignedCourses = async () => {
    if (!userProfile) return;
    setIsLoading(true);
    setError(null);
    try {
      const q = query(
        collection(db, "courses"), 
        where("teacherId", "==", userProfile.uid),
        orderBy("name")
      );
      const querySnapshot = await getDocs(q);
      const coursesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate(),
        updatedAt: (doc.data().updatedAt as Timestamp)?.toDate(),
      })) as Course[];
      setCourses(coursesData);
    } catch (err: any) {
      console.error("Error fetching assigned courses: ", err);
      setError("Failed to load your courses. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && userProfile) {
      fetchAssignedCourses();
    } else if (!authLoading && !userProfile) {
      setError("User not authenticated.");
      setIsLoading(false);
    }
  }, [userProfile, authLoading]);

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Loading your courses...</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">My Assigned Courses</h1>
      </div>

      {error && (
        <Card className="bg-destructive/10 border-destructive">
          <CardHeader className="flex flex-row items-center gap-2">
             <AlertTriangle className="h-6 w-6 text-destructive" />
            <CardTitle className="text-destructive">Error Loading Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive-foreground">{error}</p>
            <Button onClick={fetchAssignedCourses} variant="outline" className="mt-4">Try Again</Button>
          </CardContent>
        </Card>
      )}

      {!error && courses.length === 0 && (
        <Card className="text-center py-12">
          <CardHeader>
            <div className="mx-auto bg-secondary rounded-full p-3 w-fit">
             <Info className="h-12 w-12 text-muted-foreground" data-ai-hint="information empty" />
            </div>
            <CardTitle className="mt-4 text-2xl">No Courses Assigned</CardTitle>
            <CardDescription>
              You have not been assigned to any courses yet. Please contact an administrator.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {!error && courses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Courses</CardTitle>
            <CardDescription>List of courses you are assigned to teach and manage grades for.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-20rem)]">
              <div className="space-y-4">
                {courses.map((course) => (
                  <Card key={course.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg text-primary">{course.name} ({course.code})</CardTitle>
                          <CardDescription className="pt-1 text-sm">
                            {course.description || "No description provided."}
                          </CardDescription>
                           {course.department && (
                            <Badge variant="outline" className="mt-2 text-xs">
                              <Briefcase className="mr-1.5 h-3 w-3" />
                              Department: {course.department}
                            </Badge>
                          )}
                        </div>
                        <Link href={`/teacher/grades?courseId=${course.id}&courseName=${encodeURIComponent(course.name + ' (' + course.code + ')')}`}>
                          <Button variant="outline">Manage Grades</Button>
                        </Link>
                      </div>
                    </CardHeader>
                     <CardContent className="text-xs text-muted-foreground">
                        <p>Created: {formatDate(course.createdAt)}</p>
                        <p>Last Updated: {formatDate(course.updatedAt)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
