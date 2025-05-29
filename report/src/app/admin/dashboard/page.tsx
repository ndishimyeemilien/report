
// console.log("Admin Dashboard: File re-evaluation attempt - v13 - explicit line 13 check"); // Line 2

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"; // Line 4
import { BookOpen, ClipboardList, Users, BarChart3, UsersRound, UserCog, Percent, ListChecks, Loader2, Users2, Archive, CalendarClock, Group, MessageSquare, PersonStanding, VenetianMask } from "lucide-react"; // Line 5
import Link from "next/link"; // Line 6
import { collection, getDocs, query, where, Timestamp, orderBy, limit } from "firebase/firestore"; // Line 7
import { db } from "@/lib/firebase"; // Line 8
import type { Grade, Student } from "@/types"; // Line 9
import { ScrollArea } from "@/components/ui/scroll-area"; // Line 10
import { useEffect, useState } from "react"; // Line 11
import { Button } from "@/components/ui/button"; // Line 12
import { cn } from "@/lib/utils"; // THIS IS NOW LINE 13

// Line 15 is empty

interface DashboardStats { // Line 16
  totalCourses: number;
  totalClasses: number;
  totalAcademicTerms: number;
  totalTeacherGroups: number;
  totalGrades: number;
  overallPassRate: number;
  totalTeachers: number;
  totalStudents: number;
  totalMaleStudents: number;
  totalFemaleStudents: number;
  totalOtherGenderStudents: number;
  totalEnrollments: number;
  totalRegisteredUsers: number;
  recentGrades: Grade[];
  error: string | null;
  loading: boolean;
}

export default function DashboardPage() {
  // const { t } = useTranslation(); // Intentionally removed due to persistent module error
  console.log("Admin Dashboard: Rendering with hardcoded title - v13 - line 13 is cn import"); 
  const [statsData, setStatsData] = useState<DashboardStats>({
    totalCourses: 0,
    totalClasses: 0,
    totalAcademicTerms: 0,
    totalTeacherGroups: 0,
    totalGrades: 0,
    overallPassRate: 0,
    totalTeachers: 0,
    totalStudents: 0,
    totalMaleStudents: 0,
    totalFemaleStudents: 0,
    totalOtherGenderStudents: 0,
    totalEnrollments: 0,
    totalRegisteredUsers: 0,
    recentGrades: [],
    error: null,
    loading: true,
  });

  useEffect(() => {
    const getStats = async () => {
      setStatsData(prev => ({ ...prev, loading: true, error: null }));
      try {
        const coursesSnapshot = await getDocs(collection(db, "courses"));
        const classesSnapshot = await getDocs(collection(db, "classes"));
        const termsSnapshot = await getDocs(collection(db, "academicTerms"));
        const groupsSnapshot = await getDocs(collection(db, "teacherGroups"));
        const gradesSnapshot = await getDocs(collection(db, "grades"));
        const studentsSnapshot = await getDocs(collection(db, "students"));
        const enrollmentsSnapshot = await getDocs(collection(db, "enrollments"));
        const teachersQuery = query(collection(db, "users"), where("role", "==", "Teacher"));
        const teachersSnapshot = await getDocs(teachersQuery);
        const allUsersSnapshot = await getDocs(collection(db, "users"));


        const recentGradesQuery = query(collection(db, "grades"), orderBy("createdAt", "desc"), limit(5));
        const recentGradesSnapshot = await getDocs(recentGradesQuery);
        const recentGrades = recentGradesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: (doc.data().createdAt as Timestamp)?.toDate(),
          updatedAt: (doc.data().updatedAt as Timestamp)?.toDate(),
        })) as Grade[];

        let totalPasses = 0;
        gradesSnapshot.forEach(doc => {
          const gradeData = doc.data();
          if (gradeData.status === 'Pass') {
            totalPasses++;
          }
        });
        const overallPassRate = gradesSnapshot.size > 0 ? (totalPasses / gradesSnapshot.size) * 100 : 0;
        
        let maleStudents = 0;
        let femaleStudents = 0;
        let otherGenderStudents = 0;
        studentsSnapshot.forEach(doc => {
          const studentData = doc.data() as Student;
          if (studentData.gender === 'Male') maleStudents++;
          else if (studentData.gender === 'Female') femaleStudents++;
          else if (studentData.gender === 'Other') otherGenderStudents++;
        });


        setStatsData({
          totalCourses: coursesSnapshot.size,
          totalClasses: classesSnapshot.size,
          totalAcademicTerms: termsSnapshot.size,
          totalTeacherGroups: groupsSnapshot.size,
          totalGrades: gradesSnapshot.size,
          overallPassRate: overallPassRate,
          totalTeachers: teachersSnapshot.size,
          totalStudents: studentsSnapshot.size,
          totalMaleStudents: maleStudents,
          totalFemaleStudents: femaleStudents,
          totalOtherGenderStudents: otherGenderStudents,
          totalEnrollments: enrollmentsSnapshot.size,
          totalRegisteredUsers: allUsersSnapshot.size,
          recentGrades,
          error: null,
          loading: false,
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        setStatsData({
          totalCourses: 0,
          totalClasses: 0,
          totalAcademicTerms: 0,
          totalTeacherGroups: 0,
          totalGrades: 0,
          overallPassRate: 0,
          totalTeachers: 0,
          totalStudents: 0,
          totalMaleStudents: 0,
          totalFemaleStudents: 0,
          totalOtherGenderStudents: 0,
          totalEnrollments: 0,
          totalRegisteredUsers: 0,
          recentGrades: [],
          error: "Could not load statistics.",
          loading: false,
        });
      }
    };
    getStats();
  }, []);

  const {
    totalCourses, totalClasses, totalAcademicTerms, totalTeacherGroups,
    totalGrades, overallPassRate, totalTeachers, totalStudents,
    totalMaleStudents, totalFemaleStudents, totalOtherGenderStudents,
    totalEnrollments, totalRegisteredUsers, recentGrades,
    error: statsError, loading: statsLoading
  } = statsData;

  const statsCards = [
    { title: "Total Subjects", value: totalCourses.toString(), icon: BookOpen, href: "/admin/dashboard/courses", iconColor: "text-blue-500" },
    { title: "Total Classes", value: totalClasses.toString(), icon: Archive, href: "/admin/dashboard/classes", iconColor: "text-orange-400" },
    { title: "Academic Terms", value: totalAcademicTerms.toString(), icon: CalendarClock, href: "/admin/dashboard/terms", iconColor: "text-lime-500" },
    { title: "Teacher Groups", value: totalTeacherGroups.toString(), icon: Group, href: "/admin/dashboard/groups", iconColor: "text-cyan-500" },
    { title: "Grades Recorded", value: totalGrades.toString(), icon: ClipboardList, href: "/admin/dashboard/grades", iconColor: "text-green-500" },
    { title: "Overall Pass Rate", value: overallPassRate.toFixed(1) + "%", icon: Percent, href: "/admin/dashboard/reports", iconColor: "text-teal-500" },
    { title: "View Feedback", value: "Messages", icon: MessageSquare, href: "/admin/dashboard/feedback", iconColor: "text-purple-500" },
    { title: "Total Registered Users", value: totalRegisteredUsers.toString(), icon: Users2, href: "/admin/dashboard/users", iconColor: "text-sky-500" },
    { title: "Total Teachers", value: totalTeachers.toString(), icon: UserCog, href: "/admin/dashboard/teachers", iconColor: "text-orange-500" },
    { title: "Total Students", value: totalStudents.toString(), icon: Users, href: "/secretary/students", iconColor: "text-purple-500" },
    { title: "Male Students", value: totalMaleStudents.toString(), icon: PersonStanding, href: "/secretary/students", iconColor: "text-blue-400" },
    { title: "Female Students", value: totalFemaleStudents.toString(), icon: VenetianMask, href: "/secretary/students", iconColor: "text-pink-400" },
    { title: "Other Gender Students", value: totalOtherGenderStudents.toString(), icon: Users, href: "/secretary/students", iconColor: "text-gray-400" },
    { title: "Total Enrollments", value: totalEnrollments.toString(), icon: UsersRound, href: "/secretary/enrollments", iconColor: "text-indigo-500" },
    { title: "View Reports", value: "Analytics", icon: BarChart3, href: "/admin/dashboard/reports", iconColor: "text-yellow-500" },
  ];

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  if (statsLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Using a hardcoded title as a workaround for persistent i18next module not found error */}
      <h1 className="mb-8 text-3xl font-bold tracking-tight text-foreground">Admin Dashboard</h1> 
      
      {statsError && (
        <Card className="mb-6 bg-destructive/10 border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive-foreground">{statsError}</p>
            <Button onClick={() => window.location.reload()} variant="outline">Try Again</Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {statsCards.map((stat) => (
           <Link href={stat.href} key={stat.title}>
            <Card className={cn('hover:shadow-lg transition-shadow duration-200', stat.title === "View Feedback" ? "bg-purple-50 dark:bg-purple-900/30" : "")}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <stat.icon className={cn("h-5 w-5", stat.iconColor)} />
              </CardHeader>
              <CardContent>
                <div className={cn("text-3xl font-bold")}>{stat.value}</div>
                <p className="text-xs text-muted-foreground pt-1">{stat.title === "View Reports" || stat.title === "View Feedback" ? "Go to Page" : "View Details"}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-12">
        <Card>
          <CardHeader>
            <CardTitle>Welcome to Report-Manager Lite!</CardTitle>
            <CardDescription>
              This is your central hub for managing subjects, classes, academic terms, teacher groups, student grades, user feedback, viewing reports, and overseeing user accounts.
              Use the navigation sidebar to access different modules.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-lg border bg-card p-6 shadow-sm">
                    <h3 className="text-lg font-semibold mb-2 text-primary">Key Admin Functions</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        <li><Link href="/admin/dashboard/courses" className="hover:underline text-accent">Manage subjects</Link>.</li>
                        <li><Link href="/admin/dashboard/classes" className="hover:underline text-accent">Manage classes</Link>.</li>
                        <li><Link href="/admin/dashboard/terms" className="hover:underline text-accent">Manage academic terms</Link>.</li>
                        <li><Link href="/admin/dashboard/groups" className="hover:underline text-accent">Manage teacher groups</Link>.</li>
                        <li><Link href="/admin/dashboard/grades" className="hover:underline text-accent">View and manage all student grades</Link>.</li>
                        <li><Link href="/admin/dashboard/reports" className="hover:underline text-accent">Access comprehensive academic reports</Link>.</li>
                        <li><Link href="/admin/dashboard/feedback" className="hover:underline text-accent">View user feedback</Link>.</li>
                        <li>Oversee student records (via <Link href="/secretary/students" className="hover:underline text-accent">Students</Link>) and enrollments (via <Link href="/secretary/enrollments" className="hover:underline text-accent">Enrollments</Link>).</li>
                        <li><Link href="/admin/dashboard/teachers" className="hover:underline text-accent">Manage Teacher accounts</Link>.</li>
                        <li><Link href="/admin/dashboard/users" className="hover:underline text-accent">View all registered users</Link>.</li>
                    </ul>
                </div>
                 <div className="rounded-lg border bg-card p-6 shadow-sm">
                    <h3 className="text-lg font-semibold mb-2 text-accent">System Workflow</h3>
                     <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        <li>Admins define subjects, academic terms, and teacher groups.</li>
                        <li>Secretaries register students, assign them to classes, and enroll them.</li>
                        <li>Teachers enter grades for students in their assigned subjects for specific terms.</li>
                        <li>Admins monitor overall academic performance via reports and manage user access.</li>
                        <li>Users can submit feedback for system improvement.</li>
                    </ul>
                </div>
            </div>
            <div className="mt-8">
                <h3 className="text-lg font-semibold mb-3 text-primary flex items-center">
                    <ListChecks className="mr-2 h-5 w-5" />
                    Recent Grades Entered
                </h3>
                {recentGrades.length > 0 ? (
                <ScrollArea className="h-40 rounded-md border p-3">
                    <ul className="space-y-2">
                    {recentGrades.map((grade) => (
                        <li key={grade.id} className="text-sm text-muted-foreground p-2 rounded-md hover:bg-muted/50 transition-colors">
                        <span className="font-medium text-foreground">{grade.studentName}</span> - {grade.courseName}: <span className="font-semibold text-primary">{grade.totalMarks ?? grade.marks}</span>
                        <span className="text-xs block text-muted-foreground/80">On: {formatDate(grade.createdAt)} by {grade.enteredByTeacherEmail?.split('@')[0] || 'System'}</span>
                        </li>
                    ))}
                    </ul>
                </ScrollArea>
                ) : (
                <p className="text-sm text-muted-foreground italic">No grades have been entered recently.</p>
                )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
    

    