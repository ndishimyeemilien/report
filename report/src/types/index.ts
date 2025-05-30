
export interface Course {
  id: string;
  name: string; 
  code: string; 
  description?: string | null; 
  teacherId?: string; 
  teacherName?: string | null; 
  department?: string | null; 
  
  category: string; 
  combination: string; 

  createdAt: Date;
  updatedAt: Date;
}

export interface Student {
  id: string; 
  fullName: string;
  studentSystemId?: string; 
  email?: string; 
  classId?: string; 
  className?: string; 
  dateOfBirth?: string; 
  placeOfBirth?: string; 
  gender?: 'Male' | 'Female' | 'Other' | ''; 
  createdAt: Date;
  updatedAt: Date;
}

export interface Enrollment {
  id: string; 
  studentId: string;
  studentName: string; 
  courseId: string; 
  courseName: string; 
  enrolledAt: Date;
}

export interface Grade {
  id: string;
  studentId: string; 
  studentName: string; 
  courseId: string; 
  courseName: string; 
  ca1?: number | null;
  ca2?: number | null;
  exam?: number | null;
  totalMarks?: number | null;
  status: 'Pass' | 'Fail';
  remarks?: string;
  term?: string; 
  enteredByTeacherId?: string; 
  enteredByTeacherEmail?: string; 
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'Admin' | 'Teacher' | 'Secretary';

export interface UserProfile {
  uid: string;
  email: string | null;
  role: UserRole;
  schoolId?: string; // ID of the school this user belongs to/manages
  createdAt?: Date;
  updatedAt?: Date;
  assignedCourseNames?: string[]; 
  teacherGroupId?: string | null; 
  teacherGroupName?: string | null; 
}

export interface Class {
  id: string;
  name: string; 
  description?: string;
  academicYear?: string; 
  secretaryId?: string; 
  secretaryName?: string; 
  assignedCoursesCount?: number; 
  createdAt: Date;
  updatedAt: Date;
}

export interface ClassCourseAssignment {
  id: string; 
  classId: string;
  className: string; 
  courseId: string; 
  courseName: string; 
  assignedAt: Date;
}

export type SchoolType = 'REB' | 'TVET' | 'Other';

export interface School {
  id: string;
  name: string;
  type: SchoolType;
  adminUids: string[]; // Array of UIDs for users who are admins of this school
  createdAt: Date;
  updatedAt: Date;
  // Potentially more fields like address, contact, logoUrl etc.
}

export interface SystemSettings {
  id?: string; 
  schoolName?: string; 
  defaultAcademicYear?: string;
  defaultTerm?: string;
  updatedAt?: Date;
  updatedBy?: string; 
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused';

export interface DailyAttendanceRecord {
  id?: string; 
  classId: string;
  className: string; 
  subjectId: string;
  subjectName: string; 
  date: string; 
  attendanceData: Record<string, AttendanceStatus>; 
  markedByTeacherId: string;
  markedByTeacherEmail?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AcademicTerm {
  id: string;
  name: string; 
  academicYear: string; 
  startDate: string; 
  endDate: string; 
  isCurrent?: boolean; 
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string; 
}

export interface TeacherGroup {
    id: string;
    name: string;
    description?: string | null;
    memberTeacherIds: string[]; 
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string; 
}

export interface Feedback {
  id?: string;
  name?: string; 
  message: string;
  userId?: string; 
  userEmail?: string; 
  createdAt: Date;
  status?: 'new' | 'read' | 'archived'; 
}
