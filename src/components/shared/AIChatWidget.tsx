"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, User, Send, Loader2, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { contextualChat } from '@/ai/flows/contextual-chat-flow';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
}

export function AIChatWidget() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        { id: 'initial-ai-message', text: t('aiWelcomeMessage', { role: userProfile?.role || 'User' }), sender: 'ai' }
      ]);
    }
  }, [isOpen, messages.length, t, userProfile]);

  useEffect(() => {
    // Scroll to the bottom whenever messages change
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: `user-${Date.now()}`, text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const chatHistory = messages.map(msg => `${msg.sender}: ${msg.text}`).join('\n');
      const response = await contextualChat({
        userRole: userProfile?.role || 'Unknown',
        userEmail: userProfile?.email || 'Unknown',
        question: input,
        chatHistory: chatHistory,
      });

      const aiMessage: Message = { id: `ai-${Date.now()}`, text: response.answer, sender: 'ai' };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error("AI chat error:", error);
      const errorMessage: Message = { id: `ai-error-${Date.now()}`, text: t('aiErrorMessage'), sender: 'ai' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!userProfile) return null;

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-16 h-16 bg-primary hover:bg-primary/90 shadow-lg"
          aria-label={t('openAIChat')}
        >
          <Bot className="w-8 h-8 text-primary-foreground" />
        </Button>
      </div>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col" side="right">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="flex items-center gap-2">
                <Bot className="h-6 w-6 text-primary"/>
                <span>{t('aiAssistantTitle')}</span>
                <Badge variant="outline">{userProfile.role}</Badge>
            </SheetTitle>
             <SheetClose asChild>
                <Button variant="ghost" size="icon" className="absolute top-3 right-3">
                    <X className="h-5 w-5" />
                    <span className="sr-only">Close</span>
                </Button>
             </SheetClose>
          </SheetHeader>
          
          <ScrollArea className="flex-grow p-4 bg-muted/30" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex items-start gap-3",
                    message.sender === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  {message.sender === 'ai' && (
                     <Avatar className="w-8 h-8 border">
                        <AvatarFallback className="bg-primary text-primary-foreground"><Bot size={18}/></AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "max-w-xs md:max-w-md rounded-lg px-4 py-2 text-sm",
                      message.sender === 'user'
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-card-foreground border"
                    )}
                  >
                    {message.text}
                  </div>
                   {message.sender === 'user' && (
                     <Avatar className="w-8 h-8 border">
                        <AvatarFallback className="bg-secondary text-secondary-foreground">
                            {userProfile?.email?.substring(0, 2).toUpperCase() || <User size={18}/>}
                        </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
               {isLoading && (
                    <div className="flex items-start gap-3 justify-start">
                        <Avatar className="w-8 h-8 border">
                            <AvatarFallback className="bg-primary text-primary-foreground"><Bot size={18}/></AvatarFallback>
                        </Avatar>
                        <div className="max-w-xs md:max-w-md rounded-lg px-4 py-2 text-sm bg-card text-card-foreground border flex items-center">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground"/>
                        </div>
                    </div>
                )}
            </div>
          </ScrollArea>

          <SheetFooter className="p-4 border-t bg-background">
            <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
              <Input
                id="message"
                placeholder={t('askAiPlaceholder')}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                autoComplete="off"
                disabled={isLoading}
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                <span className="sr-only">Send</span>
              </Button>
            </form>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
