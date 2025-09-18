
'use server';
/**
 * @fileOverview An AI flow for generating remarks based on student performance.
 *
 * - generateRemark - A function that generates a remark for a student's grade.
 * - GenerateRemarkInput - The input type for the generateRemark function.
 * - GenerateRemarkOutput - The return type for the generateRemark function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateRemarkInputSchema = z.object({
  studentName: z.string().describe("The name of the student."),
  courseName: z.string().describe("The name of the course or subject."),
  totalMarks: z.number().describe("The total marks obtained by the student (out of 100)."),
  status: z.enum(['Pass', 'Fail']).describe("The student's pass/fail status."),
});
export type GenerateRemarkInput = z.infer<typeof GenerateRemarkInputSchema>;

const GenerateRemarkOutputSchema = z.object({
  remark: z.string().describe("A concise, encouraging, and constructive remark for the student based on their performance."),
});
export type GenerateRemarkOutput = z.infer<typeof GenerateRemarkOutputSchema>;


export async function generateRemark(input: GenerateRemarkInput): Promise<GenerateRemarkOutput> {
  return generateRemarkFlow(input);
}


const prompt = ai.definePrompt({
  name: 'generateRemarkPrompt',
  input: { schema: GenerateRemarkInputSchema },
  output: { schema: GenerateRemarkOutputSchema },
  prompt: `You are an expert educator providing feedback. Based on the student's performance details below, write a short, constructive, and encouraging remark. The remark should be in English.

Student Name: {{{studentName}}}
Course: {{{courseName}}}
Total Marks: {{{totalMarks}}}/100
Status: {{{status}}}

Generate a remark that is 1-2 sentences long. If the student passed, congratulate them and suggest an area for continued focus. If they failed, be encouraging and suggest a specific area for improvement.
`,
});

const generateRemarkFlow = ai.defineFlow(
  {
    name: 'generateRemarkFlow',
    inputSchema: GenerateRemarkInputSchema,
    outputSchema: GenerateRemarkOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
