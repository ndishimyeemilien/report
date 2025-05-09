import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, ClipboardList, Users, BarChart3, UsersRound, UserCog, Percent } from "lucide-react"; 
import Link from "next/link";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

async function getStats() {
  try {
    const coursesSnapshot = await getDocs(collection(db, "courses"));
    const gradesSnapshot = await getDocs(collection(db, "grades"));
    const studentsSnapshot = await getDocs(collection(db, "students"));
    const enrollmentsSnapshot = await getDocs(collection(db, "enrollments"));
    const teachersQuery = query(collection(db, "users"), where("role", "==", "Teacher"));
    const teachersSnapshot = await getDocs(teachersQuery);

    let totalPasses = 0;
    gradesSnapshot.forEach(doc => {
      const gradeData = doc.data();
      if (gradeData.status === 'Pass') {
        totalPasses++;
      }
    });
    const overallPassRate = gradesSnapshot.size > 0 ? (totalPasses / gradesSnapshot.size) * 100 : 0;

    return {
      totalCourses: coursesSnapshot.size,
      totalGrades: gradesSnapshot.size,
      overallPassRate: overallPassRate,
      totalTeachers: teachersSnapshot.size,
      totalStudents: studentsSnapshot.size,
      totalEnrollments: enrollmentsSnapshot.size,
      error: null,
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return {
      totalCourses: 0,
      totalGrades: 0,
      overallPassRate: 0,
      totalTeachers: 0,
      totalStudents: 0,
      totalEnrollments: 0,
      error: "Could not load statistics.",
    };
  }
}


export default async function DashboardPage() {
  const { totalCourses, totalGrades, overallPassRate,totalTeachers, totalStudents, totalEnrollments, error: statsError } = await getStats();

  const stats = [
    { title: "Total Subjects", value: totalCourses.toString(), icon: BookOpen, href: "/admin/dashboard/courses", iconColor: "text-blue-500" }, // Changed from Total Courses
    { title: "Grades Recorded", value: totalGrades.toString(), icon: ClipboardList, href: "/admin/dashboard/grades", iconColor: "text-green-500" },
    { title: "Overall Pass Rate", value: overallPassRate.toFixed(1) + "%", icon: Percent, href: "/admin/dashboard/reports", iconColor: "text-teal-500" }, // Using Percent icon
    { title: "Total Teachers", value: totalTeachers.toString(), icon: UserCog, href: "/admin/dashboard/courses", iconColor: "text-orange-500" }, // Assuming courses page shows teachers
    { title: "Total Students", value: totalStudents.toString(), icon: Users, href: "/secretary/students", iconColor: "text-purple-500" }, 
    { title: "Total Enrollments", value: totalEnrollments.toString(), icon: UsersRound, href: "/secretary/enrollments", iconColor: "text-indigo-500" }, 
    { title: "View Reports", value: "Analytics", icon: BarChart3, href: "/admin/dashboard/reports", iconColor: "text-yellow-500" },
  ];

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-8 text-3xl font-bold tracking-tight text-foreground">Admin Dashboard</h1>
      
      {statsError && (
        <Card className="mb-6 bg-destructive/10 border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive-foreground">{statsError}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"> {/* Adjusted for potentially more items */}
        {stats.map((stat) => (
           <Link href={stat.href} key={stat.title}>
            <Card className={`hover:shadow-lg transition-shadow duration-200`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold`}>{stat.value}</div>
                <p className="text-xs text-muted-foreground pt-1">{stat.title === "View Reports" ? "Go to Reports" : "View Details"}</p>
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
              This is your central hub for managing subjects (grouped by category/combination), student grades, viewing reports, and overseeing student and enrollment data.
              Use the navigation sidebar to access different modules.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Secretaries handle student and enrollment management. Teachers manage grades for their assigned subjects. Admins have oversight of all areas.
            </p>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border bg-card p-6 shadow-sm">
                    <h3 className="text-lg font-semibold mb-2 text-primary">Key Admin Functions</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        <li>Manage subjects (add to predefined categories/combinations, assign teachers).</li>
                        <li>View and manage all student grades (override if necessary).</li>
                        <li>Access comprehensive academic reports.</li>
                        <li>Oversee student records and enrollments (managed by Secretary).</li>
                    </ul>
                </div>
                 <div className="rounded-lg border bg-card p-6 shadow-sm">
                    <h3 className="text-lg font-semibold mb-2 text-accent">System Workflow</h3>
                     <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        <li>Admins define subjects within categories/combinations and assign teachers.</li>
                        <li>Secretaries register students and enroll them in classes (which link to subjects).</li>
                        <li>Teachers enter grades for students in their assigned subjects.</li>
                        <li>Admins monitor overall academic performance via reports.</li>
                    </ul>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
