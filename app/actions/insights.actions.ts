"use server";

import { createSupabaseClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Adds a new insight for the authenticated user.
 * A title is automatically generated from the content.
 */
export async function addInsightAction(
  content: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("User not authenticated for addInsight:", authError);
      return { success: false, error: "User not authenticated." };
    }

    // Automatically generate a title from the first few words of the content
    const title = content.split(' ').slice(0, 5).join(' ') + '...';

    const { error: insertError } = await supabase
      .from('insights')
      .insert({
        user_id: user.id,
        title: title,
        content: content,
      });

    if (insertError) {
      console.error("Error inserting insight:", insertError);
      return { success: false, error: "Failed to save insight." };
    }

    // Revalidate the dashboard path so the new insight appears immediately
    revalidatePath('/dashboard');

    return { success: true };

  } catch (err) {
    console.error("Unexpected error in addInsightAction:", err);
    return { success: false, error: "An unexpected error occurred." };
  }
}

/**
 * Fetches all insights for the authenticated user.
 */
export async function getInsights(): Promise<{ id: string; title: string; content: string; date: string; }[]> {
  try {
    const supabase = await createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
      .from('insights')
      .select('id, title, content, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching insights:", error);
      return [];
    }
    
    // Format the date for consistency
    return data.map(item => ({...item, date: item.created_at }));

  } catch (err) {
    console.error("Unexpected error in getInsights:", err);
    return [];
  }
}

/**
 * Deletes a specific insight owned by the authenticated user.
 */
export async function deleteInsightAction(
  insightId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("User not authenticated for deleteInsight:", authError);
      return { success: false, error: "User not authenticated." };
    }

    if (!insightId) {
      return { success: false, error: "Insight ID is required." };
    }

    const { error: deleteError } = await supabase
      .from('insights')
      .delete()
      .eq('id', insightId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error("Error deleting insight:", deleteError);
      return { success: false, error: "Failed to remove the insight." };
    }
    
    revalidatePath('/dashboard');

    return { success: true };

  } catch (err) {
    console.error("Unexpected error in deleteInsightAction:", err);
    return { success: false, error: "An unexpected error occurred." };
  }
}