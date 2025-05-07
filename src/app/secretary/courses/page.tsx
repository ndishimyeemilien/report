
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Course } from "@/types";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, Timestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import { BookOpen, Loader2, AlertTriangle, UserCheck } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button"; // For Try Again button

export default function SecretaryCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const q = query(collection(db, "courses"), orderBy("name", "asc"));
      const querySnapshot = await getDocs(q);
      const coursesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate(),
        updatedAt: (doc.data().updatedAt as Timestamp)?.toDate(),
      })) as Course[];
      setCourses(coursesData);
    } catch (err: any) {
      console.error("Error fetching courses: ", err);
      setError("Failed to load courses. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">View Courses</h1>
        {/* Secretary role does not add/edit courses in Lite version */}
      </div>

      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg text-muted-foreground">Loading courses...</p>
        </div>
      )}

      {!isLoading && error && (
        <Card className="bg-destructive/10 border-destructive">
          <CardHeader className="flex flex-row items-center gap-2">
             <AlertTriangle className="h-6 w-6 text-destructive" />
            <CardTitle className="text-destructive">Error Loading Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive-foreground">{error}</p>
            <Button onClick={fetchCourses} variant="outline" className="mt-4">Try Again</Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && courses.length === 0 && (
        <Card className="text-center py-12">
          <CardHeader>
            <div className="mx-auto bg-secondary rounded-full p-3 w-fit">
             <BookOpen className="h-12 w-12 text-muted-foreground" data-ai-hint="book education" />
            </div>
            <CardTitle className="mt-4 text-2xl">No Courses Found</CardTitle>
            <CardDescription>
              There are no courses in the system yet. An Admin needs to add them.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {!isLoading && !error && courses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Course List</CardTitle>
            <CardDescription>A list of all available courses in the system. (View-only)</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-20rem)]">
              <div className="space-y-4">
                {courses.map((course) => (
                  <Card key={course.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg text-primary">{course.name} ({course.code})</CardTitle>
                        <CardDescription className="pt-1 text-sm">
                          {course.description || "No description provided."}
                        </CardDescription>
                         {course.teacherName && (
                          <Badge variant="secondary" className="mt-2 text-xs">
                            <UserCheck className="mr-1.5 h-3 w-3" />
                            Teacher: {course.teacherName}
                          </Badge>
                        )}
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

