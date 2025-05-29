
"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailyAttendanceRecord, Course, Student, Class, ClassCourseAssignment, AttendanceStatus } from "@/types"; 
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { collection, doc, getDocs, query, orderBy, Timestamp, where, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { Loader2, AlertTriangle, Filter, CheckCircle, Calendar as CalendarIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, parseISO } from "date-fns";

export default function TeacherAttendancePage() {
  const { userProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [allClasses, setAllClasses] = useState<Class[]>([]);
  const [allClassAssignments, setAllClassAssignments] = useState<ClassCourseAssignment[]>([]);
  const [teacherAssignedSubjects, setTeacherAssignedSubjects] = useState<Course[]>([]);
  
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  const [studentsInSelectedClass, setStudentsInSelectedClass] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceStatus>>({}); // studentId: status

  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const [isAttendanceDataLoading, setIsAttendanceDataLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch initial data: classes, teacher's subjects, class assignments
  useEffect(() => {
    if (!userProfile || authLoading) {
      setIsLoadingInitialData(false);
      return;
    }
    setIsLoadingInitialData(true);
    const fetchData = async () => {
      try {
        const classesQuery = query(collection(db, "classes"), orderBy("name"));
        const teacherSubjectsQuery = query(collection(db, "courses"), where("teacherId", "==", userProfile.uid), orderBy("name"));
        const classAssignmentsQuery = query(collection(db, "classAssignments"));

        const [classesSnap, teacherSubjectsSnap, classAssignmentsSnap] = await Promise.all([
          getDocs(classesQuery),
          getDocs(teacherSubjectsQuery),
          getDocs(classAssignmentsQuery),
        ]);

        setAllClasses(classesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Class)));
        setTeacherAssignedSubjects(teacherSubjectsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Course)));
        setAllClassAssignments(classAssignmentsSnap.docs.map(d => ({ id: d.id, ...d.data() } as ClassCourseAssignment)));
      } catch (err) {
        console.error("Error fetching initial data for attendance page: ", err);
        toast({ title: "Error", description: "Could not load necessary page data.", variant: "destructive" });
      } finally {
        setIsLoadingInitialData(false);
      }
    };
    fetchData();
  }, [userProfile, authLoading, toast]);

  const availableSubjectsForSelectedClass = useMemo(() => {
    if (!selectedClassId || !userProfile) return [];
    const subjectIdsInClass = allClassAssignments
      .filter(ca => ca.classId === selectedClassId)
      .map(ca => ca.courseId);
    return teacherAssignedSubjects.filter(ts => subjectIdsInClass.includes(ts.id));
  }, [selectedClassId, allClassAssignments, teacherAssignedSubjects, userProfile]);

  // Fetch students for the selected class AND existing attendance for selected class/subject/date
  const fetchStudentAndAttendanceData = useCallback(async () => {
    if (!selectedClassId || !selectedSubjectId || !selectedDate || !userProfile) {
      setStudentsInSelectedClass([]);
      setAttendanceRecords({});
      setIsAttendanceDataLoading(false);
      return;
    }
    setIsAttendanceDataLoading(true);
    try {
      // Fetch students
      const studentsInClassQuery = query(collection(db, "students"), where("classId", "==", selectedClassId), orderBy("fullName"));
      const studentsSnapshot = await getDocs(studentsInClassQuery);
      const classStudents = studentsSnapshot.docs.map(sDoc => ({id: sDoc.id, ...sDoc.data()} as Student));
      setStudentsInSelectedClass(classStudents);

      // Fetch existing attendance record for the day
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      const attendanceDocId = `${selectedClassId}_${selectedSubjectId}_${formattedDate}`;
      const attendanceRef = doc(db, "dailyAttendance", attendanceDocId);
      const attendanceSnap = await getDoc(attendanceRef);

      const initialAttendance: Record<string, AttendanceStatus> = {};
      if (attendanceSnap.exists()) {
        const record = attendanceSnap.data() as DailyAttendanceRecord;
        // Ensure all students in class have an entry, default to Present if not in record
        classStudents.forEach(student => {
            initialAttendance[student.id] = record.attendanceData[student.id] || 'Present';
        });
      } else {
        // Default all students to 'Present' if no record exists
        classStudents.forEach(student => {
          initialAttendance[student.id] = 'Present';
        });
      }
      setAttendanceRecords(initialAttendance);

    } catch (err: any) {
      console.error("Error fetching students or attendance: ", err);
      toast({ title: "Error", description: `Failed to load student or attendance data.`, variant: "destructive" });
      setAttendanceRecords({});
    } finally {
      setIsAttendanceDataLoading(false);
    }
  }, [selectedClassId, selectedSubjectId, selectedDate, userProfile, toast]);

  useEffect(() => {
    if (selectedClassId && selectedSubjectId && selectedDate) {
      fetchStudentAndAttendanceData();
    } else {
      setStudentsInSelectedClass([]);
      setAttendanceRecords({});
    }
  }, [selectedClassId, selectedSubjectId, selectedDate, fetchStudentAndAttendanceData]);

  useEffect(() => {
    setSelectedSubjectId(null); // Reset subject when class changes
  }, [selectedClassId]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceRecords(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSaveAttendance = async () => {
    if (!selectedClassId || !selectedSubjectId || !selectedDate || !userProfile || studentsInSelectedClass.length === 0) {
      toast({ title: "Missing Information", description: "Please select class, subject, date, and ensure students are loaded.", variant: "destructive"});
      return;
    }
    setIsSaving(true);

    const formattedDate = format(selectedDate, "yyyy-MM-dd");
    const attendanceDocId = `${selectedClassId}_${selectedSubjectId}_${formattedDate}`;
    const attendanceRef = doc(db, "dailyAttendance", attendanceDocId);
    
    const currentClass = allClasses.find(c => c.id === selectedClassId);
    const currentSubject = teacherAssignedSubjects.find(s => s.id === selectedSubjectId);

    const dataToSave: Omit<DailyAttendanceRecord, 'id'> = {
      classId: selectedClassId,
      className: currentClass?.name || "Unknown Class",
      subjectId: selectedSubjectId,
      subjectName: currentSubject?.name || "Unknown Subject",
      date: formattedDate,
      attendanceData: attendanceRecords,
      markedByTeacherId: userProfile.uid,
      markedByTeacherEmail: userProfile.email || undefined,
      updatedAt: serverTimestamp() as unknown as Date,
      createdAt: serverTimestamp() as unknown as Date, // Will be set on create, ignored on update
    };

    try {
      const docSnap = await getDoc(attendanceRef);
      if (docSnap.exists()) {
        // Update existing document, but don't overwrite createdAt
        const { createdAt, ...updateData } = dataToSave;
        await setDoc(attendanceRef, updateData, { merge: true });
      } else {
        // Create new document
        await setDoc(attendanceRef, dataToSave);
      }
      toast({ title: "Attendance Saved", description: `Attendance for ${formattedDate} submitted successfully.` });
    } catch (error: any) {
      console.error("Error saving attendance: ", error);
      toast({ title: "Save Failed", description: error.message || "Could not save attendance.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };


  if (authLoading || isLoadingInitialData) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /> <p className="ml-2 text-muted-foreground">Loading page data...</p></div>;
  }
  if (!userProfile) {
    return <div className="flex justify-center items-center h-64"><AlertTriangle className="h-12 w-12 text-destructive" /> <p className="ml-2 text-destructive-foreground">User not authenticated.</p></div>;
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2"><CheckCircle className="text-primary" /> Mark Attendance</CardTitle>
          <CardDescription>Select class, subject, and date to mark student attendance.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select 
              onValueChange={(value) => { setSelectedClassId(value); setSelectedSubjectId(null); }} 
              value={selectedClassId || ""}
              disabled={allClasses.length === 0 || isAttendanceDataLoading}
          >
              <SelectTrigger><SelectValue placeholder={allClasses.length === 0 ? "No classes available" : "Select a Class"} /></SelectTrigger>
              <SelectContent>
                  {allClasses.length === 0 && <SelectItem value="no-classes" disabled>No classes found</SelectItem>}
                  {allClasses.map(cls => (<SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>))}
              </SelectContent>
          </Select>

          <Select 
              onValueChange={setSelectedSubjectId} 
              value={selectedSubjectId || ""}
              disabled={!selectedClassId || availableSubjectsForSelectedClass.length === 0 || isAttendanceDataLoading}
          >
              <SelectTrigger><SelectValue placeholder={!selectedClassId ? "Select class first" : (availableSubjectsForSelectedClass.length === 0 ? "No subjects for this class" : "Select a Subject")} /></SelectTrigger>
              <SelectContent>
                  {!selectedClassId && <SelectItem value="select-class" disabled>Select class first</SelectItem>}
                  {selectedClassId && availableSubjectsForSelectedClass.length === 0 && <SelectItem value="no-subjects" disabled>No assigned subjects for this class</SelectItem>}
                  {availableSubjectsForSelectedClass.map(subject => (<SelectItem key={subject.id} value={subject.id}>{subject.name} ({subject.code})</SelectItem>))}
              </SelectContent>
          </Select>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={("w-full justify-start text-left font-normal")}
                disabled={isAttendanceDataLoading}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </CardContent>
      </Card>

      {isAttendanceDataLoading && selectedClassId && selectedSubjectId && selectedDate && (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg text-muted-foreground">Loading attendance data...</p>
        </div>
      )}

      {!isAttendanceDataLoading && (!selectedClassId || !selectedSubjectId || !selectedDate) && (
        <Card className="text-center py-12">
            <CardHeader>
                <div className="mx-auto bg-secondary rounded-full p-3 w-fit">
                <Filter className="h-12 w-12 text-muted-foreground" data-ai-hint="filter selection"/>
                </div>
                <CardTitle className="mt-4 text-2xl">Select Class, Subject & Date</CardTitle>
                <CardDescription>Please make your selections above to view or mark attendance.</CardDescription>
            </CardHeader>
        </Card>
      )}
      
      {!isAttendanceDataLoading && selectedClassId && selectedSubjectId && selectedDate && studentsInSelectedClass.length === 0 && (
        <Card className="text-center py-12">
          <CardHeader>
            <div className="mx-auto bg-secondary rounded-full p-3 w-fit">
            <Users className="h-12 w-12 text-muted-foreground" data-ai-hint="users empty"/>
            </div>
            <CardTitle className="mt-4 text-2xl">No Students in Class</CardTitle>
            <CardDescription>
              No students are currently assigned to {allClasses.find(c => c.id === selectedClassId)?.name || 'this class'}.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {!isAttendanceDataLoading && selectedClassId && selectedSubjectId && selectedDate && studentsInSelectedClass.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Attendance for: {allClasses.find(c => c.id === selectedClassId)?.name} - {teacherAssignedSubjects.find(s => s.id === selectedSubjectId)?.name}</CardTitle>
            <CardDescription>Date: {format(selectedDate, "PPP")}. Mark each student's status.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-32rem)]">
              <div className="space-y-4">
                {studentsInSelectedClass.map((student) => (
                  <Card key={student.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{student.fullName} <span className="text-sm text-muted-foreground">({student.studentSystemId || 'N/A'})</span></p>
                      <RadioGroup
                        defaultValue={attendanceRecords[student.id] || 'Present'}
                        onValueChange={(value) => handleStatusChange(student.id, value as AttendanceStatus)}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Present" id={`${student.id}-present`} />
                          <Label htmlFor={`${student.id}-present`}>Present</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Absent" id={`${student.id}-absent`} />
                          <Label htmlFor={`${student.id}-absent`}>Absent</Label>
                        </div>
                        {/* Add Late and Excused later if needed */}
                      </RadioGroup>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
            <div className="mt-6 flex justify-end">
              <Button onClick={handleSaveAttendance} disabled={isSaving || isAttendanceDataLoading} className="bg-accent hover:bg-accent/90">
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Attendance
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
