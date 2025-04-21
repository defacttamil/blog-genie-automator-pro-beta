
import { format, formatInTimeZone } from 'date-fns-tz';
import { supabase } from '@/integrations/supabase/client';

export async function getUserTimezone(): Promise<string> {
  try {
    // First try to get user's stored preference
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('timezone')
      .single();

    if (preferences?.timezone) {
      return preferences.timezone;
    }

    // If no stored preference, get browser timezone and store it
    const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    if (browserTimezone) {
      await supabase.from('user_preferences').upsert({
        timezone: browserTimezone
      });
      return browserTimezone;
    }

    return 'UTC'; // Fallback to UTC
  } catch (error) {
    console.error('Error getting user timezone:', error);
    return 'UTC';
  }
}

export function convertToUTC(date: Date, timezone: string): Date {
  const utcDate = new Date(formatInTimeZone(date, timezone, "yyyy-MM-dd'T'HH:mm:ssXXX"));
  return utcDate;
}

export function formatLocalTime(date: Date, timezone: string): string {
  return format(date, 'PPp', { timeZone: timezone });
}
