import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, UsersRound, BarChart3 } from "lucide-react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

async function getStats() {
  try {
    const studentsSnapshot = await getDocs(collection(db, "students"));
    const coursesSnapshot = await getDocs(collection(db, "courses"));
    const enrollmentsSnapshot = await getDocs(collection(db, "enrollments"));
    return {
      totalStudents: studentsSnapshot.size,
      totalCourses: coursesSnapshot.size,
      totalEnrollments: enrollmentsSnapshot.size,
      error: null,
    };
  } catch (error) {
    console.error("Error fetching secretary dashboard stats:", error);
    return {
      totalStudents: 0,
      totalCourses: 0,
      totalEnrollments: 0,
      error: "Could not load statistics.",
    };
  }
}

export default async function SecretaryDashboardPage() {
  const { totalStudents, totalCourses, totalEnrollments, error: statsError } = await getStats();

  const stats = [
    { title: "Total Students", value: totalStudents.toString(), icon: Users, href: "/secretary/students", iconColor: "text-purple-500" },
    { title: "Total Courses", value: totalCourses.toString(), icon: BookOpen, href: "/secretary/courses", iconColor: "text-blue-500" },
    { title: "Manage Enrollments", value: totalEnrollments.toString() + " Active", icon: UsersRound, href: "/secretary/enrollments", iconColor: "text-green-500" },
  ];

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-8 text-3xl font-bold tracking-tight text-foreground">Secretary Dashboard</h1>
      
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
           <Link href={stat.href} key={stat.title}>
            <Card className={`hover:shadow-lg transition-shadow duration-200`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold`}>{stat.value}</div>
                <p className="text-xs text-muted-foreground pt-1">View & Manage</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-12">
        <Card>
          <CardHeader>
            <CardTitle>Welcome, Secretary!</CardTitle>
            <CardDescription>
              Manage student records, courses, and class enrollments efficiently.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Add and manage student information in the "Students" section.</li>
                <li>Create and update course details under "Courses".</li>
                <li>Assign students to their respective courses in "Enrollments".</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

