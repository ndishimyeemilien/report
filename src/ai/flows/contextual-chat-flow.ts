'use server';
/**
 * @fileOverview An AI flow that provides contextual answers based on user role.
 *
 * - contextualChat - A function that provides role-aware answers.
 * - ContextualChatInput - The input type for the contextualChat function.
 * - ContextualChatOutput - The return type for the contextualChat function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const ContextualChatInputSchema = z.object({
  userRole: z.string().describe("The role of the user (e.g., 'Admin', 'Teacher', 'Secretary')."),
  userEmail: z.string().describe("The email of the user asking the question."),
  question: z.string().describe("The user's question."),
  chatHistory: z.string().describe("The recent history of the conversation for context."),
});
export type ContextualChatInput = z.infer<typeof ContextualChatInputSchema>;

export const ContextualChatOutputSchema = z.object({
  answer: z.string().describe("The AI's contextual answer to the user's question."),
});
export type ContextualChatOutput = z.infer<typeof ContextualChatOutputSchema>;

export async function contextualChat(input: ContextualChatInput): Promise<ContextualChatOutput> {
  return contextualChatFlow(input);
}

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

const contextualChatFlow = ai.defineFlow(
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
