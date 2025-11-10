"use server";

import { createSupabaseClient } from "@/utils/supabase/server";
import Anthropic from '@anthropic-ai/sdk';
import { getContextItemContent } from './context.actions';
import { SYSTEM_PROMPT } from "@/app/config/ai.config";

export interface ClientMessage {
  id: string;
  sender: 'user' | 'ai';
  content: string;
}

export async function getAnthropicResponse(
  messages: ClientMessage[],
  model: string,
  contextItemId?: string | null
): Promise<{ success: boolean; response?: string; error?: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY is not set in environment variables.");
    return { success: false, error: "Server configuration error: API key missing." };
  }
  if (!model) {
     return { success: false, error: "No model selected." };
  }
  if (messages.length === 0) {
     return { success: false, error: "No messages to send." };
  }

  const supabase = await createSupabaseClient();
  const anthropic = new Anthropic({ apiKey });
  let fetchedContextContent: string | null = null;
  if (contextItemId) {
    try {
      fetchedContextContent = await getContextItemContent(contextItemId, supabase);
      if (fetchedContextContent) {
         console.log(`Successfully fetched context: ${contextItemId}`);
      } else {
         console.log(`Could not fetch or find context: ${contextItemId}`);
      }
    } catch (fetchErr) {
       console.error(`Caught error fetching context ${contextItemId}:`, fetchErr);
    }
  }

  const formattedMessages: Anthropic.MessageParam[] = messages.map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'assistant',
    content: msg.content
  }));

  if (fetchedContextContent && formattedMessages.length > 0) {
      const lastMessageIndex = formattedMessages.length - 1;
      if (formattedMessages[lastMessageIndex].role === 'user') {
          const originalContent = formattedMessages[lastMessageIndex].content;
          formattedMessages[lastMessageIndex].content = `${fetchedContextContent}\n\n${originalContent}`;
          console.log(`Prepended context to user message for Anthropic API call.`);
      } else {
          console.warn("Last message not from user, could not prepend context directly.");
      }
  }

  try {
    console.log(`Calling Anthropic API with model: ${model}`);
    const response = await anthropic.messages.create({
      model: model,
      max_tokens: 1024,
      messages: formattedMessages,
    });
    console.log("Anthropic API Response Status:", response.stop_reason);
    type ContentBlock = { type: string; text?: string };
    const textBlocks = response.content
      .filter((block: ContentBlock): block is { type: 'text'; text: string } =>
        block.type === 'text' && typeof block.text === 'string'
      );
    const aiTextResponse = textBlocks
      .map((textBlock) => (textBlock as { text: string }).text)
      .join('\n');
    if (!aiTextResponse && response.content.length > 0 && textBlocks.length === 0) {
       console.warn("Anthropic response contained no usable text content.", response.content);
       return { success: true, response: "" };
    }
    if (!aiTextResponse && response.content.length === 0) {
        console.warn("Anthropic API response was empty.", response);
        return { success: false, error: "Received an empty response from AI." };
    }
    return { success: true, response: aiTextResponse };
  } catch (error: unknown) {
    console.error("Error calling Anthropic API:", error);
    let errorMessage = "An unexpected error occurred while contacting the AI.";
    if (error instanceof Anthropic.APIError) {
        errorMessage = `Anthropic API Error (${error.status}): ${error.message}`;
    } else if (error instanceof Error) {
        errorMessage = error.message;
    }
    return { success: false, error: errorMessage };
  }
}

export async function getOpenRouterResponse(
  messages: ClientMessage[],
  model: string
): Promise<{ success: boolean; response?: string; error?: string }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error("OPENROUTER_API_KEY is not set in environment variables.");
    return { success: false, error: "Server configuration error: API key missing." };
  }
  if (!model) {
     return { success: false, error: "No model selected." };
  }

  const systemPrompt = SYSTEM_PROMPT;

    const formattedMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content
        }))
      ];

    try {
      console.log(`Calling OpenRouter API with model: ${model}`);
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'Theia AI Chatbot'
        },
        body: JSON.stringify({
          model: model,
          messages: formattedMessages,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        console.error("OpenRouter API Error:", errorBody);
        const errorMessage = errorBody.error?.message || `API request failed with status ${response.status}`;
        return { success: false, error: errorMessage };
      }

      const data = await response.json();
      const aiTextResponse = data.choices[0]?.message?.content?.trim();

      if (!aiTextResponse) {
          console.warn("OpenRouter response contained no usable text content.", data);
          return { success: false, error: "Received an empty or invalid response from AI." };
      }

      return { success: true, response: aiTextResponse };
    } catch (error: unknown) {
      console.error("Error calling OpenRouter API:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected network error occurred.";
      return { success: false, error: errorMessage };
    }
  }