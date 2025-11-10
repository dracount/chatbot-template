"use server";

import { createSupabaseClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { SupabaseClient } from "@supabase/supabase-js";

// Interface for context items, exported for use in other files
export interface ContextItem {
  id: string;
  user_id: string;
  name: string;
  content: string;
  created_at: string;
  updated_at: string;
}

/**
 * Helper function to fetch the content of a single context item by its ID.
 * Exported so other actions (like chat actions) can use it.
 */
export async function getContextItemContent(itemId: string | null | undefined, supabase: SupabaseClient): Promise<string | null> {
  if (!itemId) return null;

  const { data: contextItem, error: contextError } = await supabase
      .from('context_items')
      .select('content, name')
      .eq('id', itemId)
      .maybeSingle();

  if (contextError) {
    console.error(`Error fetching context item ${itemId}:`, contextError);
    return null;
  }

  if (!contextItem) {
    console.warn(`Context item with ID ${itemId} not found.`);
    return null;
  }

  return `--- Context: ${contextItem.name} ---\n${contextItem.content}\n--- End Context ---`;
}

/**
 * Fetches all context items for the authenticated user.
 */
export async function getContextItems(): Promise<ContextItem[]> {
  try {
    const supabase = await createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("User not authenticated for getContextItems:", authError);
      return [];
    }

    const { data, error } = await supabase
      .from('context_items')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error("Error fetching context items:", error);
      return [];
    }

    return data as ContextItem[];

  } catch (err: unknown) {
    console.error("Unexpected error in getContextItems:", err);
    return [];
  }
}

/**
 * Adds a new context item for the authenticated user.
 */
export async function addContextItem(
  name: string,
  content: string
): Promise<{ success: boolean; error?: string; newItem?: ContextItem }> {
  try {
    const supabase = await createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "User not authenticated." };
    }
    if (!name || name.trim().length === 0) {
      return { success: false, error: "Context item name cannot be empty." };
    }
    if (!content || content.trim().length === 0) {
      return { success: false, error: "Context item content cannot be empty." };
    }

    const { data, error } = await supabase
      .from('context_items')
      .insert({
        user_id: user.id,
        name: name.trim(),
        content: content.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting context item:", error);
      return { success: false, error: "Failed to add context item." };
    }

    revalidatePath('/context');
    return { success: true, newItem: data as ContextItem };

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
    return { success: false, error: errorMessage };
  }
}

/**
 * Updates an existing context item owned by the authenticated user.
 */
export async function updateContextItem(
  itemId: string,
  newName: string,
  newContent: string
): Promise<{ success: boolean; error?: string; updatedItem?: ContextItem }> {
  try {
    const supabase = await createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "User not authenticated." };
    }
    if (!itemId || !newName.trim() || !newContent.trim()) {
      return { success: false, error: "All fields are required." };
    }

    const { data, error } = await supabase
      .from('context_items')
      .update({
        name: newName.trim(),
        content: newContent.trim(),
      })
      .eq('id', itemId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: "Context item not found or you do not have permission to update it." };
      }
      return { success: false, error: "Failed to update context item." };
    }

    revalidatePath('/context');
    return { success: true, updatedItem: data as ContextItem };

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
    return { success: false, error: errorMessage };
  }
}

/**
 * Deletes a specific context item owned by the authenticated user.
 */
export async function deleteContextItem(
  itemId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "User not authenticated." };
    }
    if (!itemId) {
      return { success: false, error: "Item ID is required." };
    }

    const { error } = await supabase
      .from('context_items')
      .delete()
      .eq('id', itemId)
      .eq('user_id', user.id);

    if (error) {
      return { success: false, error: "Failed to delete context item." };
    }

    revalidatePath('/context');
    return { success: true };

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
    return { success: false, error: errorMessage };
  }
}

/**
 * Fetches a single context item by its ID for the authenticated user.
 */
export async function getContextItemById(itemId: string): Promise<ContextItem | null> {
  if (!itemId) {
    return null;
  }
  try {
    const supabase = await createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    const { data, error } = await supabase
      .from('context_items')
      .select('*')
      .eq('id', itemId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') {
         console.error("Error fetching single context item:", error);
      }
      return null;
    }

    return data as ContextItem;
  } catch (err: unknown) {
    console.error("Unexpected error in getContextItemById:", err);
    return null;
  }
}