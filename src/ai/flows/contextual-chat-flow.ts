'use server';
/**
 * @fileOverview A server action for the contextual chat AI flow.
 *
 * This file exports an async function that can be called from client components
 * to execute the contextual chat flow.
 */

import { contextualChatFlow } from '@/ai/flows/definition/contextual-chat';
import type { ContextualChatInput, ContextualChatOutput } from '@/types/ai';

export async function contextualChat(
  input: ContextualChatInput
): Promise<ContextualChatOutput> {
  return await contextualChatFlow(input);
}
