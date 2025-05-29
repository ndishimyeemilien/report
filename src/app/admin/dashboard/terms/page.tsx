
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TermForm } from "@/components/terms/TermForm"; 
import type { AcademicTerm } from "@/types";
import { db } from "@/lib/firebase";
import { collection, deleteDoc, doc, getDocs, query, orderBy, Timestamp, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { PlusCircle, Edit3, Trash2, CalendarClock, Loader2, AlertTriangle, CheckCircle } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";

export default function ManageAcademicTermsPage() {
  const [terms, setTerms] = useState<AcademicTerm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<AcademicTerm | null>(null);
  const { toast } = useToast();

  const fetchTerms = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const q = query(collection(db, "academicTerms"), orderBy("startDate", "desc"));
      const querySnapshot = await getDocs(q);
      const termsData = querySnapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: (d.data().createdAt as Timestamp)?.toDate(), 
        updatedAt: (d.data().updatedAt as Timestamp)?.toDate(),
      })) as AcademicTerm[];
      setTerms(termsData);
    } catch (err: any) {
      console.error("Error fetching academic terms: ", err);
      setError("Failed to load academic terms. Please try again.");
      toast({ title: "Error", description: "Failed to load academic terms.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTerms();
  }, []);

  const handleEdit = (term: AcademicTerm) => {
    setEditingTerm(term);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingTerm(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (termId: string, termName: string) => {
    try {
      await deleteDoc(doc(db, "academicTerms", termId));
      toast({ title: "Term Deleted", description: `Academic term "${termName}" has been deleted.` });
      fetchTerms(); 
    } catch (error: any) {
      console.error("Error deleting term: ", error);
      toast({ title: "Delete Failed", description: error.message || "Could not delete term.", variant: "destructive" });
    }
  };

  const handleSetCurrentTerm = async (termId: string, termName: string) => {
    setIsLoading(true);
    try {
      // First, set all other terms' isCurrent to false
      const batch = terms.map(t => {
        if (t.id !== termId && t.isCurrent) {
          return updateDoc(doc(db, "academicTerms", t.id), { isCurrent: false });
        }
        return Promise.resolve();
      });
      await Promise.all(batch);

      // Then, set the selected term's isCurrent to true
      await updateDoc(doc(db, "academicTerms", termId), { isCurrent: true });
      toast({ title: "Current Term Set", description: `"${termName}" is now the current academic term.` });
      fetchTerms(); // Refetch to update UI
    } catch (error: any) {
      console.error("Error setting current term: ", error);
      toast({ title: "Update Failed", description: "Could not set current term.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatDateString = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), "MMM dd, yyyy");
    } catch {
      return dateString; // Fallback if parsing fails
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
          <CalendarClock className="mr-3 h-8 w-8 text-primary" /> Manage Academic Terms
        </h1>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew} className="bg-accent hover:bg-accent/90">
              <PlusCircle className="mr-2 h-5 w-5" /> Add New Term
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg bg-card">
            <DialogHeader>
              <DialogTitle className="text-xl">{editingTerm ? "Edit Academic Term" : "Add New Academic Term"}</DialogTitle>
              <DialogDescription>
                {editingTerm ? "Update the details of this academic term." : "Fill in the details to add a new academic term."}
              </DialogDescription>
            </DialogHeader>
            <TermForm 
              initialData={editingTerm} 
              onClose={() => {
                setIsFormOpen(false);
                setEditingTerm(null);
                fetchTerms(); 
              }} 
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg text-muted-foreground">Loading academic terms...</p>
        </div>
      )}

      {!isLoading && error && (
        <Card className="bg-destructive/10 border-destructive">
          <CardHeader className="flex flex-row items-center gap-2">
             <AlertTriangle className="h-6 w-6 text-destructive" />
            <CardTitle className="text-destructive">Error Loading Terms</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive-foreground">{error}</p>
            <Button onClick={fetchTerms} variant="outline" className="mt-4">Try Again</Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && terms.length === 0 && (
        <Card className="text-center py-12">
          <CardHeader>
            <div className="mx-auto bg-secondary rounded-full p-3 w-fit">
             <CalendarClock className="h-12 w-12 text-muted-foreground" data-ai-hint="calendar empty" />
            </div>
            <CardTitle className="mt-4 text-2xl">No Academic Terms Found</CardTitle>
            <CardDescription>
              Get started by adding academic terms (e.g., Term 1 2024, Semester 2 2023-2024).
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {!isLoading && !error && terms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Academic Term List</CardTitle>
            <CardDescription>A list of all defined academic terms in the system.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-22rem)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Term Name</TableHead>
                    <TableHead>Academic Year</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead className="text-center">Is Current?</TableHead>
                    <TableHead className="text-right w-[200px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {terms.map((term) => (
                    <TableRow key={term.id}>
                      <TableCell className="font-medium">{term.name}</TableCell>
                      <TableCell>{term.academicYear}</TableCell>
                      <TableCell>{formatDateString(term.startDate)}</TableCell>
                      <TableCell>{formatDateString(term.endDate)}</TableCell>
                      <TableCell className="text-center">
                        {term.isCurrent ? (
                          <Badge className="bg-green-500 hover:bg-green-600">
                            <CheckCircle className="mr-1.5 h-3.5 w-3.5" /> Current
                          </Badge>
                        ) : (
                          <Badge variant="outline">No</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {!term.isCurrent && (
                            <Button variant="outline" size="sm" onClick={() => handleSetCurrentTerm(term.id, term.name)} disabled={isLoading}>
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Set Current'}
                            </Button>
                          )}
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleEdit(term)}>
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
                                  This action cannot be undone. This will permanently delete the term "{term.name} ({term.academicYear})".
                                  This might affect grade entries and reports associated with this term.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(term.id, term.name)} className="bg-destructive hover:bg-destructive/90">
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
