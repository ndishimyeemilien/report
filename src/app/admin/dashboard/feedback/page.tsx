
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, Timestamp } from "firebase/firestore";
import type { Feedback } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle, MessageSquare, UserCircle } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchFeedbacks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const q = query(collection(db, "feedbacks"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const feedbacksData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate(),
      })) as Feedback[];
      setFeedbacks(feedbacksData);
    } catch (err: any) {
      console.error("Error fetching feedbacks: ", err);
      setError("Failed to load feedback. Please try again.");
      toast({ title: "Error", description: "Failed to load feedback.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const formatDate = (date: Date | undefined) => {
    if (!date) return "N/A";
    return format(date, "PPP p"); // e.g., Jun 21, 2024, 2:30 PM
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
          <MessageSquare className="mr-3 h-8 w-8 text-primary" /> User Feedback
        </h1>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg text-muted-foreground">Loading feedback...</p>
        </div>
      )}

      {!isLoading && error && (
        <Card className="bg-destructive/10 border-destructive">
          <CardHeader className="flex flex-row items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <CardTitle className="text-destructive">Error Loading Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive-foreground">{error}</p>
            <Button onClick={fetchFeedbacks} variant="outline" className="mt-4">Try Again</Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && feedbacks.length === 0 && (
        <Card className="text-center py-12">
          <CardHeader>
            <div className="mx-auto bg-secondary rounded-full p-3 w-fit">
              <MessageSquare className="h-12 w-12 text-muted-foreground" data-ai-hint="empty message box" />
            </div>
            <CardTitle className="mt-4 text-2xl">No Feedback Submitted Yet</CardTitle>
            <CardDescription>When users submit feedback, it will appear here.</CardDescription>
          </CardHeader>
        </Card>
      )}

      {!isLoading && !error && feedbacks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Submitted Feedback</CardTitle>
            <CardDescription>List of all feedback received from users.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-22rem)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Submitted By</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead className="w-[180px]">Date Submitted</TableHead>
                    {/* <TableHead className="text-right w-[100px]">Status</TableHead> */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feedbacks.map((fb) => (
                    <TableRow key={fb.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{fb.name || "Anonymous"}</span>
                          {fb.userEmail && (
                            <span className="text-xs text-muted-foreground">{fb.userEmail}</span>
                          )}
                           {!fb.name && !fb.userEmail && (
                            <span className="text-xs text-muted-foreground italic">User not logged in</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-pre-wrap max-w-xl">{fb.message}</TableCell>
                      <TableCell>{formatDate(fb.createdAt)}</TableCell>
                      {/* <TableCell className="text-right">
                        <Badge variant={fb.status === 'new' ? 'default' : (fb.status === 'read' ? 'secondary' : 'outline')}>
                          {fb.status || 'New'}
                        </Badge>
                      </TableCell> */}
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
