
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TeacherGroupForm } from "@/components/groups/TeacherGroupForm"; 
import type { TeacherGroup } from "@/types";
import { db } from "@/lib/firebase";
import { collection, deleteDoc, doc, getDocs, query, orderBy, Timestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import { PlusCircle, Edit3, Trash2, Group as GroupIcon, Loader2, AlertTriangle, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function ManageTeacherGroupsPage() {
  const [groups, setGroups] = useState<TeacherGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<TeacherGroup | null>(null);
  const { toast } = useToast();

  const fetchGroups = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const q = query(collection(db, "teacherGroups"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const groupsData = querySnapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: (d.data().createdAt as Timestamp)?.toDate(), 
        updatedAt: (d.data().updatedAt as Timestamp)?.toDate(),
      })) as TeacherGroup[];
      setGroups(groupsData);
    } catch (err: any) {
      console.error("Error fetching teacher groups: ", err);
      setError("Failed to load teacher groups. Please try again.");
      toast({ title: "Error", description: "Failed to load teacher groups.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleEdit = (group: TeacherGroup) => {
    setEditingGroup(group);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingGroup(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (groupId: string, groupName: string) => {
    // Future: Check if group has members or is linked to other entities before deleting
    try {
      await deleteDoc(doc(db, "teacherGroups", groupId));
      toast({ title: "Group Deleted", description: `Teacher group "${groupName}" has been deleted.` });
      fetchGroups(); 
    } catch (error: any) {
      console.error("Error deleting group: ", error);
      toast({ title: "Delete Failed", description: error.message || "Could not delete group.", variant: "destructive" });
    }
  };
  
  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return format(date, "MMM dd, yyyy");
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
          <GroupIcon className="mr-3 h-8 w-8 text-primary" /> Manage Teacher Groups
        </h1>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew} className="bg-accent hover:bg-accent/90">
              <PlusCircle className="mr-2 h-5 w-5" /> Add New Group
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg bg-card">
            <DialogHeader>
              <DialogTitle className="text-xl">{editingGroup ? "Edit Teacher Group" : "Add New Teacher Group"}</DialogTitle>
              <DialogDescription>
                {editingGroup ? "Update the details of this teacher group and manage members." : "Fill in the details to add a new teacher group and assign members."}
              </DialogDescription>
            </DialogHeader>
            <TeacherGroupForm 
              initialData={editingGroup} 
              onClose={() => {
                setIsFormOpen(false);
                setEditingGroup(null);
                fetchGroups(); 
              }} 
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg text-muted-foreground">Loading teacher groups...</p>
        </div>
      )}

      {!isLoading && error && (
        <Card className="bg-destructive/10 border-destructive">
          <CardHeader className="flex flex-row items-center gap-2">
             <AlertTriangle className="h-6 w-6 text-destructive" />
            <CardTitle className="text-destructive">Error Loading Groups</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive-foreground">{error}</p>
            <Button onClick={fetchGroups} variant="outline" className="mt-4">Try Again</Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && groups.length === 0 && (
        <Card className="text-center py-12">
          <CardHeader>
            <div className="mx-auto bg-secondary rounded-full p-3 w-fit">
             <GroupIcon className="h-12 w-12 text-muted-foreground" data-ai-hint="group people empty" />
            </div>
            <CardTitle className="mt-4 text-2xl">No Teacher Groups Found</CardTitle>
            <CardDescription>
              Get started by adding teacher groups (e.g., Science Department, Senior 1 Teachers).
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {!isLoading && !error && groups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Teacher Group List</CardTitle>
            <CardDescription>A list of all defined teacher groups in the system.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-22rem)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Group Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-center">Members</TableHead>
                    <TableHead>Created On</TableHead>
                    <TableHead className="text-right w-[150px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups.map((group) => (
                    <TableRow key={group.id}>
                      <TableCell className="font-medium">{group.name}</TableCell>
                      <TableCell className="max-w-xs truncate" title={group.description || ""}>{group.description || "N/A"}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">
                          <Users className="mr-1.5 h-3.5 w-3.5" />
                          {group.memberTeacherIds?.length || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(group.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleEdit(group)}>
                            <Edit3 className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="icon" className="h-8 w-8">
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the group "{group.name}".
                                  This might affect teacher assignments to this group.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(group.id, group.name)} className="bg-destructive hover:bg-destructive/90">
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
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
