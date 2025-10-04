/**
 * @fileOverview Type definitions and Zod schemas for AI flows.
 */

import { z } from 'genkit';

// === Contextual Chat Flow ===
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


// === Generate Remark Flow ===
export const GenerateRemarkInputSchema = z.object({
  studentName: z.string().describe("The name of the student."),
  courseName: z.string().describe("The name of the course or subject."),
  totalMarks: z.number().describe("The total marks obtained by the student (out of 100)."),
  status: z.enum(['Pass', 'Fail']).describe("The student's pass/fail status."),
});
export type GenerateRemarkInput = z.infer<typeof GenerateRemarkInputSchema>;

export const GenerateRemarkOutputSchema = z.object({
  remark: z.string().describe("A concise, encouraging, and constructive remark for the student based on their performance."),
});
export type GenerateRemarkOutput = z.infer<typeof GenerateRemarkOutputSchema>;
