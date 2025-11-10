// D:/PROCESSES/vscode_projects/AI_Lifecoach/chatbot-template/app/actions/user.actions.ts
"use server";

import { createSupabaseClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export interface UserModelSettings {
  enabledModels: string[];
  selectedModel: string | null;
}

const defaultModelSettings: UserModelSettings = {
  enabledModels: [
    'claude-3-7-sonnet-20250219',
    'claude-3-5-sonnet-20240620',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307'
  ],
  selectedModel: 'claude-3-7-sonnet-20250219'
};

export async function getUserModelSettings(): Promise<UserModelSettings> {
  const supabase = await createSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return defaultModelSettings;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('enabled_models, selected_model')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error(`Error fetching profile for user ${user.id}:`, error);
      if (error.code === 'PGRST116') {
        return defaultModelSettings;
      }
      throw error;
    }

    const settings: UserModelSettings = {
        enabledModels: data?.enabled_models ?? defaultModelSettings.enabledModels,
        selectedModel: data?.selected_model ?? null
    };

    // ... (rest of the function is the same)
    if (settings.selectedModel && !settings.enabledModels.includes(settings.selectedModel)) {
        if (defaultModelSettings.selectedModel && settings.enabledModels.includes(defaultModelSettings.selectedModel)) {
             settings.selectedModel = defaultModelSettings.selectedModel;
        } else if (settings.enabledModels.length > 0) {
            settings.selectedModel = settings.enabledModels[0];
        } else {
            settings.selectedModel = null;
        }
    } else if (!settings.selectedModel && settings.enabledModels.length > 0) {
        if (defaultModelSettings.selectedModel && settings.enabledModels.includes(defaultModelSettings.selectedModel)) {
             settings.selectedModel = defaultModelSettings.selectedModel;
        } else {
            settings.selectedModel = settings.enabledModels[0];
        }
    }
    return settings;
  } catch (err) {
    console.error("Unexpected error in getUserModelSettings:", err);
    return defaultModelSettings;
  }
}

// ... (rest of the file remains the same)
export async function updateUserModelSettings(enabledIds: string[]): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("User not authenticated:", authError);
      return { success: false, error: "User not authenticated." };
    }

    const { data: currentSettings, error: fetchError } = await supabase
      .from('profiles')
      .select('selected_model')
      .eq('id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
       console.error("Error fetching current settings from profiles:", fetchError);
       return { success: false, error: "Failed to fetch current settings." };
    }

    const currentSelectedModel = currentSettings?.selected_model;
    let newSelectedModel = currentSelectedModel;

    if (currentSelectedModel && !enabledIds.includes(currentSelectedModel)) {
      newSelectedModel = enabledIds.length > 0 ? enabledIds[0] : null;
    } else {
      if (currentSelectedModel && !enabledIds.includes(currentSelectedModel)) {
         newSelectedModel = enabledIds.length > 0 ? enabledIds[0] : null;
      } else if (!currentSelectedModel && enabledIds.length > 0) {
         newSelectedModel = enabledIds[0];
      }
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        enabled_models: enabledIds,
        selected_model: newSelectedModel,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error("Error updating user settings in profiles:", updateError);
      return { success: false, error: "Failed to update model settings." };
    }

    revalidatePath("/");
    return { success: true };
  } catch (err: unknown) {
    console.error("Unexpected error in updateUserModelSettings:", err);
    const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
    return { success: false, error: errorMessage };
  }
}

export async function updateUserSelectedModel(modelId: string | null): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("User not authenticated:", authError);
      return { success: false, error: "User not authenticated." };
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        selected_model: modelId,
        updated_at: new Date().toISOString(),
      })
       .eq('id', user.id);

    if (updateError) {
      console.error("Error updating selected model in profiles:", updateError);
      return { success: false, error: "Failed to update selected model." };
    }

    revalidatePath("/");
    return { success: true };
  } catch (err: unknown) {
    console.error("Unexpected error in updateUserSelectedModel:", err);
    const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
    return { success: false, error: errorMessage };
  }
}

export async function getUserPlan(): Promise<string | null> {
  'use server';

  try {
    const supabase = await createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error("Error fetching user plan:", error.message);
      return 'free';
    }

    return profile?.plan ?? 'free';
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
    console.error("Unexpected error in getUserPlan:", errorMessage);
    return 'free';
  }
}

export async function checkFirstSessionStatus(): Promise<boolean> {
  const supabase = await createSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return true;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('has_completed_first_session')
    .eq('id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error("Error fetching first session status:", error);
    return false;
  }

  return data?.has_completed_first_session || false;
}

export async function markFirstSessionCompleted(): Promise<{ success: boolean }> {
  const supabase = await createSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false };
  }

  const { error } = await supabase
    .from('profiles')
    .update({ has_completed_first_session: true })
    .eq('id', user.id);

  if (error) {
    console.error("Error marking first session as completed:", error);
    return { success: false };
  }

  return { success: true };
}