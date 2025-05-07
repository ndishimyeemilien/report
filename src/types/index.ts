
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

export interface Grade {
  id: string;
  studentName: string;
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

export type UserRole = 'Admin' | 'Teacher';

export interface UserProfile {
  uid: string;
  email: string | null;
  role: UserRole;
  // assignedCourseIds?: string[]; // This might be derived by querying courses where teacherId matches user.uid
  // For simplicity, we'll assume teachers find their courses by querying the 'courses' collection.
}
