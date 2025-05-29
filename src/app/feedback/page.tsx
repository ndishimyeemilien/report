
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, type FieldValue } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { Loader2, MessageSquare } from "lucide-react";
import Link from "next/link";

export default function FeedbackPage() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter your feedback message.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);

    const feedbackData: {
      name?: string;
      message: string;
      createdAt: FieldValue;
      userId?: string;
      userEmail?: string | null;
    } = {
      message: message.trim(),
      createdAt: serverTimestamp(),
    };

    if (name.trim()) {
      feedbackData.name = name.trim();
    }

    if (currentUser) {
      feedbackData.userId = currentUser.uid;
      feedbackData.userEmail = currentUser.email;
    }

    try {
      await addDoc(collection(db, "feedbacks"), feedbackData);
      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback! We appreciate you taking the time.",
      });
      setName("");
      setMessage("");
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Submission Failed",
        description: "Could not submit your feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
            <MessageSquare className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Submit Feedback</CardTitle>
          <CardDescription>
            We value your input! Please share any suggestions or issues you have.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name (Optional)</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Your Message</Label>
              <Textarea
                id="message"
                placeholder="Tell us what you think..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Feedback
            </Button>
          </form>
        </CardContent>
      </Card>
       <p className="mt-6 text-center text-sm">
        <Link href="/" className="text-primary hover:underline">
          &larr; Back to Home
        </Link>
      </p>
    </div>
  );
}
