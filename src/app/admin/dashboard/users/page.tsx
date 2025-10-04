
"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, Timestamp, orderBy, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserProfile, UserStatus } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, AlertTriangle, Users2, ShieldCheck, UserCog, UserCircle, Check, X, Hourglass } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ManageUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null); // Track which user is being updated
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const usersQuery = query(collection(db, "users"), orderBy("createdAt", "desc"));
      const usersSnapshot = await getDocs(usersQuery);
      const usersData = usersSnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate(),
        updatedAt: (doc.data().updatedAt as Timestamp)?.toDate(),
      })) as UserProfile[];
      setUsers(usersData);
    } catch (err: any) {
      console.error("Error fetching users:", err);
      setError("Failed to load user data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateStatus = async (userId: string, newStatus: UserStatus) => {
    setIsUpdating(userId);
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { status: newStatus });
      toast({
        title: "User Status Updated",
        description: `User has been ${newStatus}.`,
      });
      // Here you would trigger an email notification in a real app
      fetchUsers(); // Refresh the user list
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: "Could not update user status. Please try again.",
        variant: "destructive",
      });
      console.error("Error updating user status:", error);
    } finally {
      setIsUpdating(null);
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Admin': return <ShieldCheck className="mr-2 h-4 w-4 text-red-500" />;
      case 'Teacher': return <UserCog className="mr-2 h-4 w-4 text-blue-500" />;
      case 'Secretary': return <UserCircle className="mr-2 h-4 w-4 text-green-500" />;
      default: return <Users2 className="mr-2 h-4 w-4 text-gray-500" />;
    }
  };
  
  const getRoleVariant = (role: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (role) {
      case 'Admin': return "destructive";
      case 'Teacher': return "default";
      case 'Secretary': return "secondary";
      default: return "outline";
    }
  };

  const getStatusBadge = (status: UserStatus) => {
    switch (status) {
      case 'approved': return <Badge variant="default" className="bg-green-500 hover:bg-green-600"><Check className="mr-1 h-3 w-3" />Approved</Badge>;
      case 'pending': return <Badge variant="secondary" className="bg-amber-500 hover:bg-amber-600"><Hourglass className="mr-1 h-3 w-3" />Pending</Badge>;
      case 'rejected': return <Badge variant="destructive"><X className="mr-1 h-3 w-3" />Rejected</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
          <Users2 className="mr-3 h-8 w-8 text-primary" /> Manage Registered Users
        </h1>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg text-muted-foreground">Loading users...</p>
        </div>
      )}

      {!isLoading && error && (
        <Card className="bg-destructive/10 border-destructive">
          <CardHeader className="flex flex-row items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <CardTitle className="text-destructive">Error Loading Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive-foreground">{error}</p>
            <Button onClick={fetchUsers} variant="outline" className="mt-4">Try Again</Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && users.length === 0 && (
        <Card className="text-center py-12">
          <CardHeader>
            <div className="mx-auto bg-secondary rounded-full p-3 w-fit">
              <Users2 className="h-12 w-12 text-muted-foreground" data-ai-hint="users group empty" />
            </div>
            <CardTitle className="mt-4 text-2xl">No Users Found</CardTitle>
            <CardDescription>
              There are no users registered in the system yet.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {!isLoading && !error && users.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>User List</CardTitle>
            <CardDescription>A list of all registered users in the system and their status.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-22rem)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">User Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registered On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.uid} className={isUpdating === user.uid ? 'opacity-50' : ''}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleVariant(user.role)} className="text-xs capitalize">
                          {getRoleIcon(user.role)}
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        {user.role !== 'Admin' && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" disabled={isUpdating === user.uid}>
                                {isUpdating === user.uid ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Actions'}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleUpdateStatus(user.uid, 'approved')} 
                                disabled={user.status === 'approved'}
                              >
                                <Check className="mr-2 h-4 w-4 text-green-500" /> Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleUpdateStatus(user.uid, 'rejected')}
                                disabled={user.status === 'rejected'}
                                className="text-red-600 focus:text-red-600"
                              >
                                <X className="mr-2 h-4 w-4" /> Reject
                              </DropdownMenuItem>
                               <DropdownMenuItem 
                                onClick={() => handleUpdateStatus(user.uid, 'pending')}
                                disabled={user.status === 'pending'}
                              >
                                <Hourglass className="mr-2 h-4 w-4 text-amber-500" /> Set to Pending
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
