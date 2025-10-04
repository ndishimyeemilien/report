/**
 * @fileOverview The Genkit flow definition for contextual chat.
 *
 * This file defines the AI prompt and the flow logic. It does not use the
 * 'use server' directive and can safely define and export complex objects.
 */

import { ai } from '@/ai/genkit';
import {
  ContextualChatInputSchema,
  ContextualChatOutputSchema,
} from '@/types/ai';

const prompt = ai.definePrompt({
  name: 'contextualChatPrompt',
  input: { schema: ContextualChatInputSchema },
  output: { schema: ContextualChatOutputSchema },
  prompt: `You are an intelligent AI assistant for an application called "Report-Manager Lite".
Your purpose is to help users manage school data like subjects, classes, grades, and reports.

You MUST tailor your response based on the user's role.
- An 'Admin' can do everything: manage users, subjects, classes, terms, groups, and view all reports and grades.
- A 'Teacher' can manage grades and attendance ONLY for the subjects they are assigned to.
- A 'Secretary' can manage student records, classes, and enrollments.

CURRENT USER:
- Role: {{{userRole}}}
- Email: {{{userEmail}}}

CONVERSATION HISTORY (for context):
{{{chatHistory}}}

USER'S QUESTION:
"{{{question}}}"

Based on the user's role and their question, provide a helpful and concise answer. If the user asks to perform an action they are not permitted to do, politely inform them and suggest who can perform the action (e.g., "Managing subjects is an Admin task. Please contact your system administrator."). If the question is outside the scope of school management, politely decline to answer.
`,
});

export const contextualChatFlow = ai.defineFlow(
  {
    name: 'contextualChatFlow',
    inputSchema: ContextualChatInputSchema,
    outputSchema: ContextualChatOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
