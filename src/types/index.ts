

export interface Course {
  id: string;
  name: string; // This will now be the subject name, e.g., Mathematics
  code: string; // Subject code, e.g., MATH101
  description?: string;
  teacherId?: string; // ID of the user assigned as teacher
  teacherName?: string; // Denormalized teacher name for display
  
  category: string; // e.g., "General Education", "TVET"
  combination: string; // e.g., "MCB", "Software Development"
  // Note: The actual subjects like 'Mathematics', 'Chemistry' that were in the user's example
  // are now represented by the 'name' field of this Course interface.
  // A "Course" entity is an individual subject belonging to a category and combination.

  createdAt: Date;
  updatedAt: Date;
}

export interface Student {
  id: string; // Firebase document ID
  fullName: string;
  studentSystemId?: string; // Optional: School's unique ID for the student
  email?: string; // Optional
  classId?: string; // ID of the Class the student is assigned to
  className?: string; // Denormalized name of the Class
  // Add other student-specific fields as needed, e.g., dateOfBirth, contactInfo etc.
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
  assignedCourseNames?: string[]; // Added to show assigned courses for teachers
}

export interface Class {
  id: string;
  name: string; // e.g., "Grade 10A", "Form 3 Blue"
  description?: string;
  academicYear?: string; // e.g., "2023-2024"
  secretaryId?: string; // UID of the secretary who manages the class
  secretaryName?: string; // Denormalized name of the secretary
  createdAt: Date;
  updatedAt: Date;
}

// Represents the assignment of a "Course" (which is now a subject) to a "Class" (student group)
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
  defaultAcademicYear?: string;
  defaultTerm?: string;
  updatedAt?: Date;
  updatedBy?: string; // UID of admin who last updated
}

