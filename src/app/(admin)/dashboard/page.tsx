import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, ClipboardList, Users } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  // In a real app, these numbers would come from Firestore queries
  const stats = [
    { title: "Total Courses", value: "0", icon: BookOpen, href: "/dashboard/courses", bgColor: "bg-blue-100", textColor: "text-blue-700", iconColor: "text-blue-500" },
    { title: "Grades Recorded", value: "0", icon: ClipboardList, href: "/dashboard/grades", bgColor: "bg-green-100", textColor: "text-green-700", iconColor: "text-green-500" },
    { title: "Total Students (Future)", value: "N/A", icon: Users, href: "#", bgColor: "bg-purple-100", textColor: "text-purple-700", iconColor: "text-purple-500", disabled: true },
  ];

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-8 text-3xl font-bold tracking-tight text-foreground">Admin Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
           <Link href={stat.disabled ? "#" : stat.href} key={stat.title} className={stat.disabled ? "pointer-events-none" : ""}>
            <Card className={`hover:shadow-lg transition-shadow duration-200 ${stat.disabled ? "opacity-60" : ""}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${stat.textColor}`}>{stat.value}</div>
                {!stat.disabled && <p className="text-xs text-muted-foreground pt-1">View Details</p>}
                {stat.disabled && <p className="text-xs text-muted-foreground pt-1">Coming Soon</p>}
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
              This is your central hub for managing courses and student grades. 
              Use the navigation sidebar to access different modules.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Future enhancements will include student management, comprehensive report generation, and more analytics.
            </p>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border bg-card p-6 shadow-sm">
                    <h3 className="text-lg font-semibold mb-2 text-primary">Quick Start</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        <li>Add new courses via the "Courses" section.</li>
                        <li>Enter student grades under the "Grades" section.</li>
                        <li>Monitor key statistics on this dashboard.</li>
                    </ul>
                </div>
                 <div className="rounded-lg border bg-card p-6 shadow-sm">
                    <h3 className="text-lg font-semibold mb-2 text-accent">Tips for Usage</h3>
                     <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        <li>Ensure course codes are unique.</li>
                        <li>Regularly back up important data (manual for Lite version).</li>
                        <li>Keep an eye out for future updates and features!</li>
                    </ul>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
