
<<<<<<< HEAD
=======

>>>>>>> 5dbc128 (mjhh)
export interface Course {
  id: string;
  name: string; // This will now be the subject name, e.g., Mathematics
  code: string; // Subject code, e.g., MATH101
<<<<<<< HEAD
  description?: string;
  teacherId?: string; // ID of the user assigned as teacher
  teacherName?: string; // Denormalized teacher name for display
=======
  description?: string | null; // Allow null for deletion
  teacherId?: string; // ID of the user assigned as teacher
  teacherName?: string | null; // Denormalized teacher name for display, allow null
  department?: string | null; // Optional: Department the subject belongs to
>>>>>>> 5dbc128 (mjhh)
  
  category: string; // e.g., "General Education", "TVET"
  combination: string; // e.g., "MCB", "Software Development"

  createdAt: Date;
  updatedAt: Date;
}

export interface Student {
  id: string; // Firebase document ID
  fullName: string;
<<<<<<< HEAD
  studentSystemId?: string; // Optional: School's unique ID for the student
  email?: string; // Optional
  classId?: string; // ID of the Class the student is assigned to
  className?: string; // Denormalized name of the Class
  dateOfBirth?: string; // New field for date of birth
  placeOfBirth?: string; // New field for place of birth
=======
  studentSystemId?: string; 
  email?: string; 
  classId?: string; 
  className?: string; 
  dateOfBirth?: string; 
  placeOfBirth?: string; 
  gender?: 'Male' | 'Female' | 'Other' | ''; // Added gender field
>>>>>>> 5dbc128 (mjhh)
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
<<<<<<< HEAD
  studentId: string; // Link to the Student document
  studentName: string; // Denormalized from Student
  courseId: string; // This refers to the ID of a Course (subject)
  courseName: string; // Denormalized from Course (subject)
  marks: number;
  status: 'Pass' | 'Fail';
  remarks?: string;
  term?: string; // e.g., "Term 1", "Term 2"
  enteredByTeacherId?: string; // UID of the teacher who entered/last modified
  enteredByTeacherEmail?: string; // Email of the teacher
=======
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
>>>>>>> 5dbc128 (mjhh)
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
<<<<<<< HEAD
  assignedCourseNames?: string[]; // Added to show assigned courses for teachers
=======
  assignedCourseNames?: string[]; 
  teacherGroupId?: string | null; 
  teacherGroupName?: string | null; 
>>>>>>> 5dbc128 (mjhh)
}

export interface Class {
  id: string;
<<<<<<< HEAD
  name: string; // e.g., "Grade 10A", "Form 3 Blue"
  description?: string;
  academicYear?: string; // e.g., "2023-2024"
  secretaryId?: string; // UID of the secretary who manages the class
  secretaryName?: string; // Denormalized name of the secretary
  assignedCoursesCount?: number; // New: Count of courses assigned to this class
=======
  name: string; 
  description?: string;
  academicYear?: string; 
  secretaryId?: string; 
  secretaryName?: string; 
  assignedCoursesCount?: number; 
>>>>>>> 5dbc128 (mjhh)
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
<<<<<<< HEAD
=======
  schoolName?: string; // New: Name of the school
>>>>>>> 5dbc128 (mjhh)
  defaultAcademicYear?: string;
  defaultTerm?: string;
  updatedAt?: Date;
  updatedBy?: string; // UID of admin who last updated
}
<<<<<<< HEAD
=======

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
>>>>>>> 5dbc128 (mjhh)
