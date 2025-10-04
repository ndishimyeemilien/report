'use server';
/**
 * @fileOverview An AI flow for generating remarks based on student performance.
 *
 * - generateRemark - A function that generates a remark for a student's grade.
 */

import { ai } from '@/ai/genkit';
import {
  GenerateRemarkInputSchema,
  type GenerateRemarkInput,
  GenerateRemarkOutputSchema,
  type GenerateRemarkOutput
} from '@/types/ai';


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
