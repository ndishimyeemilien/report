export interface Course {
  id: string;
  name: string;
  code: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Grade {
  id: string;
  studentName: string; 
  courseId: string;
  courseName: string;
  marks: number;
  status: 'Pass' | 'Fail';
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  role: 'Admin'; // For now, only Admin role
  // Add other profile fields if needed
}
