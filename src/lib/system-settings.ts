// lib/system-settings.ts
import { supabase } from '@/lib/supabase';
import { SystemSettings } from '@/types/system-settings';

export async function getSystemSettings(): Promise<SystemSettings | null> {
  try {
    const { data: settings, error } = await supabase
      .from('system_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching system settings:', error);
      return null;
    }

    return settings;
  } catch (error) {
    console.error('Error fetching system settings:', error);
    return null;
  }
}