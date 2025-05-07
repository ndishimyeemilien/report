import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, ClipboardList, Users, BarChart3, UsersRound } from "lucide-react"; // Added UsersRound for enrollments
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

async function getStats() {
  try {
    const coursesSnapshot = await getDocs(collection(db, "courses"));
    const gradesSnapshot = await getDocs(collection(db, "grades"));
    const studentsSnapshot = await getDocs(collection(db, "students"));
    const enrollmentsSnapshot = await getDocs(collection(db, "enrollments"));
    return {
      totalCourses: coursesSnapshot.size,
      totalGrades: gradesSnapshot.size,
      totalStudents: studentsSnapshot.size,
      totalEnrollments: enrollmentsSnapshot.size,
      error: null,
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return {
      totalCourses: 0,
      totalGrades: 0,
      totalStudents: 0,
      totalEnrollments: 0,
      error: "Could not load statistics.",
    };
  }
}


export default async function DashboardPage() {
  const { totalCourses, totalGrades, totalStudents, totalEnrollments, error: statsError } = await getStats();

  const stats = [
    { title: "Total Courses", value: totalCourses.toString(), icon: BookOpen, href: "/admin/dashboard/courses", iconColor: "text-blue-500" },
    { title: "Grades Recorded", value: totalGrades.toString(), icon: ClipboardList, href: "/admin/dashboard/grades", iconColor: "text-green-500" },
    { title: "Total Students", value: totalStudents.toString(), icon: Users, href: "/secretary/students", iconColor: "text-purple-500" }, // Link to secretary student page for admin view/management
    { title: "Total Enrollments", value: totalEnrollments.toString(), icon: UsersRound, href: "/secretary/enrollments", iconColor: "text-teal-500" }, // Link to secretary enrollment page
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"> {/* Adjusted for 5 items */}
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
              This is your central hub for managing courses, student grades, viewing reports, and overseeing student and enrollment data.
              Use the navigation sidebar to access different modules.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Secretaries handle student and enrollment management. Teachers manage grades for their assigned courses. Admins have oversight of all areas.
            </p>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border bg-card p-6 shadow-sm">
                    <h3 className="text-lg font-semibold mb-2 text-primary">Key Admin Functions</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        <li>Add and manage courses (assign teachers).</li>
                        <li>View and manage all student grades (override if necessary).</li>
                        <li>Access comprehensive academic reports.</li>
                        <li>Oversee student records and enrollments (managed by Secretary).</li>
                    </ul>
                </div>
                 <div className="rounded-lg border bg-card p-6 shadow-sm">
                    <h3 className="text-lg font-semibold mb-2 text-accent">System Workflow</h3>
                     <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        <li>Admins create courses and assign teachers.</li>
                        <li>Secretaries register students and enroll them in courses.</li>
                        <li>Teachers enter grades for students in their assigned courses.</li>
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

