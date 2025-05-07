export interface Course {
  id: string;
  name: string;
  code: string;
  description?: string;
  teacherId?: string; // ID of the user assigned as teacher
  teacherName?: string; // Denormalized teacher name for display
  createdAt: Date;
  updatedAt: Date;
}

export interface Student {
  id: string; // Firebase document ID
  fullName: string;
  studentSystemId?: string; // Optional: School's unique ID for the student
  email?: string; // Optional
  // Add other student-specific fields as needed, e.g., dateOfBirth, contactInfo etc.
  createdAt: Date;
  updatedAt: Date;
}

export interface Enrollment {
  id: string; // Firebase document ID
  studentId: string;
  studentName: string; // Denormalized
  courseId: string;
  courseName: string; // Denormalized (e.g. "Mathematics (MATH101)")
  enrolledAt: Date;
}

export interface Grade {
  id: string;
  studentId: string; // Link to the Student document
  studentName: string; // Denormalized from Student
  courseId: string;
  courseName: string; // Denormalized from Course
  marks: number;
  status: 'Pass' | 'Fail';
  remarks?: string;
  enteredByTeacherId?: string; // UID of the teacher who entered/last modified
  enteredByTeacherEmail?: string; // Email of the teacher
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'Admin' | 'Teacher' | 'Secretary';

export interface UserProfile {
  uid: string;
  email: string | null;
  role: UserRole;
}

