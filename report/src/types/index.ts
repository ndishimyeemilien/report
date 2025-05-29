

export interface Course {
  id: string;
  name: string; // This will now be the subject name, e.g., Mathematics
  code: string; // Subject code, e.g., MATH101
  description?: string | null; // Allow null for deletion
  teacherId?: string; // ID of the user assigned as teacher
  teacherName?: string | null; // Denormalized teacher name for display, allow null
  department?: string | null; // Optional: Department the subject belongs to
  
  category: string; // e.g., "General Education", "TVET"
  combination: string; // e.g., "MCB", "Software Development"

  createdAt: Date;
  updatedAt: Date;
}

export interface Student {
  id: string; // Firebase document ID
  fullName: string;
  studentSystemId?: string; 
  email?: string; 
  classId?: string; 
  className?: string; 
  dateOfBirth?: string; 
  placeOfBirth?: string; 
  gender?: 'Male' | 'Female' | 'Other' | ''; // Added gender field
  createdAt: Date;
  updatedAt: Date;
}

export interface Enrollment {
  id: string; // Firebase document ID
  studentId: string;
  studentName: string; // Denormalized
  courseId: string; // This refers to the ID of a Course (subject)
  courseName: string; // Denormalized (e.g. "Mathematics (MATH101)")
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
  term?: string; // e.g., "Term 1", "Term 2"
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
  id: string; // Firebase document ID
  classId: string;
  className: string; // Denormalized
  courseId: string; // Refers to the ID of a Course (subject)
  courseName: string; // Denormalized (e.g. "Mathematics (MATH101)")
  assignedAt: Date;
}

export interface SystemSettings {
  id?: string; // Document ID, e.g., "generalConfig"
  schoolName?: string; // New: Name of the school
  defaultAcademicYear?: string;
  defaultTerm?: string;
  updatedAt?: Date;
  updatedBy?: string; // UID of admin who last updated
}

// --- New types for Attendance ---
export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused';

export interface DailyAttendanceRecord {
  id?: string; 
  classId: string;
  className: string; 
  subjectId: string;
  subjectName: string; 
  date: string; // ISO string: YYYY-MM-DD
  attendanceData: Record<string, AttendanceStatus>; // Key: studentId, Value: status
  markedByTeacherId: string;
  markedByTeacherEmail?: string;
  createdAt: Date;
  updatedAt: Date;
}
// --- End of New types for Attendance ---

// --- New type for Academic Terms ---
export interface AcademicTerm {
  id: string;
  name: string; // e.g., "Term 1", "First Semester"
  academicYear: string; // e.g., "2023-2024"
  startDate: string; // ISO string: YYYY-MM-DD
  endDate: string; // ISO string: YYYY-MM-DD
  isCurrent?: boolean; // Optional: to mark the currently active term
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string; // UID of admin who created
}
// --- End of New type for Academic Terms ---

// --- New type for Teacher Groups ---
export interface TeacherGroup {
    id: string;
    name: string;
    description?: string | null;
    memberTeacherIds: string[]; // Array of UserProfile uids who are teachers
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string; // UID of admin who created
}
// --- End of New type for Teacher Groups ---

// --- New type for Feedback ---
export interface Feedback {
  id?: string;
  name?: string; // Optional
  message: string;
  userId?: string; // Optional: UID of logged-in user
  userEmail?: string; // Optional: Email of logged-in user
  createdAt: Date;
  status?: 'new' | 'read' | 'archived'; // Optional: for admin tracking
}
// --- End of New type for Feedback ---
