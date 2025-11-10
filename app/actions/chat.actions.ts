"use server";

import { createSupabaseClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { getContextItemContent } from './context.actions';
import { ClientMessage, getOpenRouterResponse } from './ai.actions';
import { MODEL_TITLE } from "@/app/config/ai.config";

interface ConversationMessage {
  sender: 'user' | 'theia' | 'ai';
  content: string;
}

// ... (startNewChat function remains the same)
export async function startNewChat(
  chatId: string,
  initialUserPrompt: string,
  selectedModelId: string | null,
  contextItemId?: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("User not authenticated:", authError);
      return { success: false, error: "User not authenticated." };
    }

    const initialChatName = initialUserPrompt.split(' ').slice(0, 5).join(' ') + (initialUserPrompt.split(' ').length > 5 ? '...' : '');
    let fetchedContextContent: string | null = null;
    if (contextItemId) {
       try {
         fetchedContextContent = await getContextItemContent(contextItemId, supabase);
         if (fetchedContextContent) console.log(`Successfully fetched context for new chat: ${contextItemId}`);
         else console.log(`Could not fetch or find context for new chat: ${contextItemId}`);
       } catch (fetchErr) {
          console.error(`Caught error fetching context ${contextItemId} for new chat:`, fetchErr);
       }
    }

    const finalUserPrompt = fetchedContextContent
       ? `${fetchedContextContent}\n\n${initialUserPrompt}`
       : initialUserPrompt;

    const { error: chatInsertError } = await supabase
      .from('chats')
      .insert({
        id: chatId,
        user_id: user.id,
        model_id: selectedModelId,
        name: initialChatName
      });

    if (chatInsertError) {
      console.error("Error inserting chat record:", chatInsertError);
       if (chatInsertError.code === '23505') {
         return { success: false, error: "Chat ID already exists. Please try again." };
      }
      return { success: false, error: "Failed to create chat session." };
    }

    const { error: messageInsertError } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        user_id: user.id,
        sender: 'user',
        content: finalUserPrompt,
        model_id: selectedModelId
      });

    if (messageInsertError) {
      console.error("Error inserting initial user message:", messageInsertError);
      return { success: false, error: "Failed to save initial message." };
    }

    revalidatePath("/");
    console.log(`Successfully created chat ${chatId} with initial name: "${initialChatName}"`);
    return { success: true };
  } catch (err: unknown) {
    console.error("Unexpected error in startNewChat:", err);
    const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
    return { success: false, error: errorMessage };
  }
}


export async function addMessage(
   chatId: string,
   sender: 'user' | 'ai',
   content: string,
   modelId?: string | null
 ): Promise<{ success: boolean; error?: string }> {
   try {
     const supabase = await createSupabaseClient();
     const { data: { user }, error: authError } = await supabase.auth.getUser();

     if (authError || !user) {
       console.error("User not authenticated for addMessage:", authError);
       return { success: false, error: "User not authenticated." };
     }

     const { error: transactionError } = await supabase.rpc('add_chat_message', {
         p_chat_id: chatId,
         p_user_id: user.id,
         p_sender: sender,
         p_content: content,
         p_model_id: modelId
     });

     if (transactionError) {
       console.error("Error in add_chat_message transaction:", transactionError);
       return { success: false, error: "Failed to save message and update chat." };
     }

     return { success: true };
   } catch (err: unknown) {
     console.error("Unexpected error in addMessage:", err);
     const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
     return { success: false, error: errorMessage };
   }
 }

// ... (rest of the file remains the same)

export async function getChatHistory(): Promise<{ id: string; title: string }[]> {
  try {
    const supabase = await createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("User not authenticated for getChatHistory:", authError);
      return [];
    }

    const { data, error } = await supabase
      .from('chats')
      .select('id, name, created_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error("Error fetching chat history:", error);
      return [];
    }

    return data.map(chat => ({
      id: chat.id,
      title: chat.name || `Chat ${chat.id.substring(0, 8)}...`
    }));
  } catch (err: unknown) {
    console.error("Unexpected error in getChatHistory:", err);
    return [];
  }
}

interface MessageFromDB {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  created_at: string;
}

export async function getMessagesForChat(chatId: string): Promise<MessageFromDB[]> {
  try {
    const supabase = await createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("User not authenticated for getMessagesForChat:", authError);
      return [];
    }

    const { data, error } = await supabase
      .from('messages')
      .select('id, sender, content, created_at')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error("Error fetching messages for chat:", error);
      return [];
    }

    return data.map(msg => ({
      ...msg,
      sender: msg.sender as 'user' | 'ai'
    }));
  } catch (err: unknown) {
    console.error("Unexpected error in getMessagesForChat:", err);
    return [];
  }
}

export async function updateChatName(chatId: string, newName: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "User not authenticated." };
    }
    if (!newName || newName.trim().length === 0) {
      return { success: false, error: "Chat name cannot be empty." };
    }

    const { error } = await supabase
      .from('chats')
      .update({
          name: newName.trim(),
          updated_at: new Date().toISOString()
      })
      .eq('id', chatId)
      .eq('user_id', user.id);

    if (error) {
      console.error("Error updating chat name:", error);
      return { success: false, error: "Failed to update chat name." };
    }

    revalidatePath('/')

    return { success: true };
  } catch (err: unknown) {
    console.error("Unexpected error in updateChatName:", err);
    const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
    return { success: false, error: errorMessage };
  }
}

export async function deleteChat(chatId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "User not authenticated." };
    }
    if (!chatId) {
      return { success: false, error: "Chat ID is required." };
    }

    const { error } = await supabase
      .from('chats')
      .delete()
      .eq('id', chatId)
      .eq('user_id', user.id);

    if (error) {
      console.error("Error deleting chat:", error);
      if (error.code === 'PGRST116') {
         return { success: true };
      }
      return { success: false, error: "Failed to delete chat." };
    }

    revalidatePath('/');
    return { success: true };
  } catch (err: unknown) {
    console.error("Unexpected error in deleteChat:", err);
    const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
    return { success: false, error: errorMessage };
  }
}

export async function createChatSession(chatId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("[createChatSession LOG] Starting chat creation for ID:", chatId);
    const supabase = await createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log("[createChatSession LOG] User fetch result:", { userId: user?.id, authError: authError?.message });

    if (authError || !user) {
      console.error("[createChatSession LOG] User not authenticated:", authError);
      return { success: false, error: "User not authenticated." };
    }

    console.log("[createChatSession LOG] Attempting to insert chat into DB for user:", user.id);
    const { error: insertError } = await supabase
      .from('chats')
      .insert({
        id: chatId,
        user_id: user.id,
        name: 'Begin a New Path'
      });

    if (insertError) {
      console.error("[createChatSession LOG] DB insert error details:", insertError);
      return { success: false, error: "Could not create a new chat session." };
    }

    console.log("[createChatSession LOG] Chat session created successfully for:", chatId);
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
    console.error("[createChatSession LOG] Unexpected error:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

export async function generateAndUpdateChatTitle(
  chatId: string,
  messages: ConversationMessage[] // Accept messages as an argument
): Promise<{ success: boolean; error?: string; newTitle?: string }> {
  try {
    const supabase = await createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated." };
    }

    // 1. Fetch the current chat to check its name (this part remains)
    const { data: currentChat, error: fetchError } = await supabase
      .from('chats')
      .select('name')
      .eq('id', chatId)
      .single();

    if (fetchError) {
      console.error("Title Generation: Could not fetch chat details.", fetchError);
      return { success: false, error: "Could not fetch chat details." };
    }

    if (currentChat.name !== 'Begin a New Path') {
      console.log(`Title Generation: Skipped, title is already set to "${currentChat.name}".`);
      return { success: true, newTitle: currentChat.name };
    }

    // 2. We need at least 5 messages for a good title.
    // This check now uses the messages passed from the client.
    if (messages.length < 5) {
      console.error(`Title Generation: Not enough messages provided (${messages.length}). Need at least 5.`);
      return { success: false, error: "Not enough conversation context to generate a title." };
    }

    // 3. Create a conversation snippet from the passed messages
    const conversationSnippet = messages
        .slice(0, 6) // Use the first 6 messages for context
        .map(m => `${m.sender === 'user' ? 'User' : 'AI'}: ${m.content}`)
        .join('\n\n');

    console.log("--- Generating Chat Title ---");
    console.log("Using conversation snippet passed from client.");
    console.log("----------------------------");

    // 4. Construct the prompt for the AI (remains the same)
    const titlePromptConversation: ClientMessage[] = [
        {
            id: '1',
            sender: 'user',
            content: `Conversation Snippet:\n"""\n${conversationSnippet}\n"""\n\nAnalyze the conversation. Summarize the core topic or problem in a concise, 3-5 word title. Focus on the user's main subject, avoiding conversational pleasantries. Do not use quotation marks or any other punctuation. This is to appear as a Title. Exclude all extraneous data in the response. Only a simple 3-5 word text response.`
        }
    ];

    const result = await getOpenRouterResponse(titlePromptConversation, MODEL_TITLE);

    if (!result.success || !result.response) {
      console.error("Title Generation: AI failed to generate a title.", result.error);
      return { success: false, error: "AI could not generate a title." };
    }

    const newTitle = result.response.trim().replace(/["']/g, "");

    const { error: updateError } = await supabase
      .from('chats')
      .update({ name: newTitle })
      .eq('id', chatId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error("Title Generation: Failed to update chat name.", updateError);
      return { success: false, error: "Could not save the new title." };
    }

    console.log(`Successfully generated and updated title for chat ${chatId} to: "${newTitle}"`);

    return { success: true, newTitle  };
  } catch (err) {
    console.error("Unexpected error in generateAndUpdateChatTitle:", err);
    return { success: false, error: "An unexpected error occurred." };
  }
}