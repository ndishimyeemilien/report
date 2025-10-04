'use server';
/**
 * @fileOverview A server action for the remark generation AI flow.
 *
 * This file exports an async function that can be called from client components
 * to execute the remark generation flow.
 */

import { generateRemarkFlow } from '@/ai/flows/definition/generate-remark';
import type { GenerateRemarkInput, GenerateRemarkOutput } from '@/types/ai';

export async function generateRemark(
  input: GenerateRemarkInput
): Promise<GenerateRemarkOutput> {
  return await generateRemarkFlow(input);
}
