
"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where, Timestamp, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserProfile, Course, TeacherGroup } from "@/types"; 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, AlertTriangle, UserCog, Users, BookOpen, Group } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ManageTeachersPage() {
  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeachersAndRelatedData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const teachersQuery = query(
        collection(db, "users"),
        where("role", "==", "Teacher"),
        orderBy("createdAt", "desc")
      );
      const teacherGroupsQuery = query(collection(db, "teacherGroups"));

      const [teachersSnapshot, teacherGroupsSnapshot] = await Promise.all([
        getDocs(teachersQuery),
        getDocs(teacherGroupsQuery),
      ]);
      
      const teacherGroups = teacherGroupsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeacherGroup));

      let teachersData = teachersSnapshot.docs.map(doc => {
        const data = doc.data();
        let groupName: string | null = null;
        let groupId: string | null = null;
        
        const foundGroup = teacherGroups.find(group => group.memberTeacherIds?.includes(doc.id));
        if (foundGroup) {
          groupName = foundGroup.name;
          groupId = foundGroup.id;
        }

        return {
          uid: doc.id,
          email: data.email,
          role: data.role,
          createdAt: (data.createdAt as Timestamp)?.toDate(),
          updatedAt: (data.updatedAt as Timestamp)?.toDate(),
          assignedCourseNames: [], 
          teacherGroupName: groupName,
          teacherGroupId: groupId,
        } as UserProfile;
      });

      const coursePromises = teachersData.map(async (teacher) => {
        const assignedCoursesQuery = query(collection(db, "courses"), where("teacherId", "==", teacher.uid));
        const assignedCoursesSnapshot = await getDocs(assignedCoursesQuery);
        const courseNames = assignedCoursesSnapshot.docs.map(doc => (doc.data() as Course).name);
        return { ...teacher, assignedCourseNames: courseNames };
      });

      teachersData = await Promise.all(coursePromises);
      setTeachers(teachersData);

    } catch (err: any) {
      console.error("Error fetching teachers and related data:", err);
      setError("Failed to load teacher data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachersAndRelatedData();
  }, []);

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
          <UserCog className="mr-3 h-8 w-8 text-primary" /> Manage Teachers
        </h1>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg text-muted-foreground">Loading teachers...</p>
        </div>
      )}

      {!isLoading && error && (
        <Card className="bg-destructive/10 border-destructive">
          <CardHeader className="flex flex-row items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <CardTitle className="text-destructive">Error Loading Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive-foreground">{error}</p>
            <Button onClick={fetchTeachersAndRelatedData} variant="outline" className="mt-4">Try Again</Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && teachers.length === 0 && (
        <Card className="text-center py-12">
          <CardHeader>
            <div className="mx-auto bg-secondary rounded-full p-3 w-fit">
              <Users className="h-12 w-12 text-muted-foreground" data-ai-hint="users group empty" />
            </div>
            <CardTitle className="mt-4 text-2xl">No Teachers Found</CardTitle>
            <CardDescription>
              There are no users registered with the 'Teacher' role yet.
              Teachers can be registered through the registration form.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {!isLoading && !error && teachers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Teacher List</CardTitle>
            <CardDescription>A list of all registered teachers, their assigned subjects, and groups.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-22rem)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Teacher Email</TableHead>
                    <TableHead className="min-w-[150px]">Assigned Subjects</TableHead>
                    <TableHead className="min-w-[150px]">Assigned Group</TableHead>
                    <TableHead>Registered On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teachers.map((teacher) => (
                    <TableRow key={teacher.uid}>
                      <TableCell className="font-medium">{teacher.email}</TableCell>
                      <TableCell>
                        {teacher.assignedCourseNames && teacher.assignedCourseNames.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {teacher.assignedCourseNames.map(name => (
                              <Badge key={name} variant="outline" className="text-xs">
                                <BookOpen className="mr-1 h-3 w-3"/>
                                {name}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">No subjects</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {teacher.teacherGroupName ? (
                           <Badge variant="secondary" className="text-xs">
                             <Group className="mr-1 h-3 w-3" />
                             {teacher.teacherGroupName}
                           </Badge>
                        ) : (
                          <span className="text-muted-foreground italic">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(teacher.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" disabled>
                          Edit Details (Future)
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
