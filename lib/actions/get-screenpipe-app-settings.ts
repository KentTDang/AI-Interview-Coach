import { invoke } from '@tauri-apps/api/core';

// Generic function to get the screenpipe settings.
export async function getScreenpipeAppSettings<T = any>(): Promise<T> {
  try {
    // The command now returns a JSON string; parse it before returning.
    const result = await invoke<string>('get_screenpipe_app_settings');
    return JSON.parse(result);
  } catch (error) {
    console.error('Error fetching screenpipe settings:', error);
    throw error;
  }
}

// Function to update screenpipe settings.
export async function updateScreenpipeAppSettings(newSettings: any): Promise<void> {
  try {
    // Convert newSettings to JSON string before sending.
    const settingsJson = JSON.stringify(newSettings);
    await invoke<void>('update_screenpipe_app_settings', { new_settings: settingsJson });
  } catch (error) {
    console.error('Error updating screenpipe settings:', error);
    throw error;
  }
}
