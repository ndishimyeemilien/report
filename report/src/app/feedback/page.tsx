
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
import { Loader2, MessageSquare, ArrowLeft } from "lucide-react"; // Added ArrowLeft
import Link from "next/link";
import { useTranslation } from "react-i18next";

export default function FeedbackPage() {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast({
        title: t("feedbackMessageRequiredTitle"),
        description: t("feedbackMessageRequiredDesc"),
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
      status?: 'new' | 'read' | 'archived';
    } = {
      message: message.trim(),
      createdAt: serverTimestamp(),
      status: 'new',
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
        title: t("feedbackSubmittedTitle"),
        description: t("feedbackSubmittedDesc"),
      });
      setName("");
      setMessage("");
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: t("feedbackSubmissionFailedTitle"),
        description: t("feedbackSubmissionFailedDesc"),
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
          <CardTitle className="text-2xl">{t('feedbackPageTitle', 'Submit Feedback')}</CardTitle>
          <CardDescription>
            {t('feedbackPageDescription', 'We value your input! Please share any suggestions or issues you have.')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">{t('feedbackNameLabel', 'Name (Optional)')}</Label>
              <Input
                id="name"
                type="text"
                placeholder={t('feedbackNamePlaceholder', 'Your name')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">{t('feedbackMessageLabel', 'Your Message')}</Label>
              <Textarea
                id="message"
                placeholder={t('feedbackMessagePlaceholder', 'Tell us what you think...')}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('submitFeedbackButton', 'Submit Feedback')}
            </Button>
          </form>
        </CardContent>
      </Card>
       <p className="mt-6 text-center text-sm">
        <Link href="/" className="text-primary hover:underline flex items-center justify-center">
          <ArrowLeft className="mr-1 h-4 w-4" /> {t('backToHomeLink', 'Back to Home')}
        </Link>
      </p>
    </div>
  );
}
