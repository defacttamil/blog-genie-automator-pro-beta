
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { supabase } from '@/integrations/supabase/client';

export async function getUserTimezone(): Promise<string> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: preferences } = await supabase
        .from('user_preferences')
        .select('timezone')
        .eq('id', user.id)
        .single();

      if (preferences?.timezone) return preferences.timezone;

      // store browser tz if new
      const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (browserTimezone) {
        try {
          await supabase.from('user_preferences').upsert({
            id: user.id,
            timezone: browserTimezone
          });
          return browserTimezone;
        } catch (error) {
          console.error('Error storing user timezone:', error);
          return browserTimezone; // Still return the browser timezone even if storage fails
        }
      }
    }
    return 'UTC'; // fallback
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
  return formatInTimeZone(date, timezone, 'PPp');
}
