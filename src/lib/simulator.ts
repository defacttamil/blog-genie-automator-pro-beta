
/**
 * This is a simulator for blog post scheduling
 * 
 * In a real application, this would be handled by backend services.
 * For this demo, we're simulating the process in the browser.
 */

import { PostSchedule, UserCredentials, Weekday } from '@/types';
import { WordPressClient } from './wordpress';
import { GeminiClient } from './gemini';
import { convertToUTC, getUserTimezone } from '@/utils/timezone';
import { supabase } from '@/integrations/supabase/client';
import { formatInTimeZone } from 'date-fns-tz';

/**
 * Process pending schedules that are due
 */
export async function processSchedules(userId: string, credentials: UserCredentials): Promise<void> {
  try {
    // Get user's timezone
    const timezone = credentials.local_timezone || 'UTC';
    
    // For Supabase UUID format validation
    // This will prevent the "invalid input syntax for type uuid" error
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    
    if (!isValidUUID) {
      console.error('Invalid UUID format:', userId);
      return; // Exit early if user ID is not a valid UUID
    }
    
    // Get pending schedules from Supabase
    const { data: schedules, error } = await supabase
      .from('post_schedules')
      .select('*')
      .eq('status', 'pending')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching schedules:', error);
      return;
    }

    if (!schedules || schedules.length === 0) return;

    // Init clients
    const wordpressClient = new WordPressClient(
      credentials.wordpressSiteUrl,
      credentials.wordpressUsername,
      credentials.wordpressAppPassword
    );
    const geminiClient = new GeminiClient(credentials.geminiApiKey);

    const now = new Date();
    // Process each pending recurring schedule whose next event is due
    for (const schedule of schedules) {
      try {
        const scheduledAt = new Date(schedule.scheduled_at);
        if (scheduledAt <= now) {
          // Convert database record to PostSchedule type
          const postSchedule: PostSchedule = {
            id: schedule.id,
            user_id: schedule.user_id,
            topics: schedule.topics,
            time: schedule.time || "12:00",
            days: schedule.days as Weekday[] || ["Monday"],
            scheduled_at: schedule.scheduled_at,
            status: schedule.status as "pending" | "completed" | "failed",
            error: schedule.error,
            local_timezone: schedule.local_timezone,
            created_at: schedule.created_at,
            updated_at: schedule.updated_at,
          };
          
          // Process posts for each topic
          await processSchedule(postSchedule, wordpressClient, geminiClient);

          // Find next occurrence for recurring schedule:
          const nextFire = getNextScheduleDayUtc(
            postSchedule.days, 
            postSchedule.time,
            postSchedule.local_timezone || timezone, 
            now
          );
          
          await supabase.from('post_schedules').update({
            scheduled_at: nextFire.toISOString(),
            status: 'pending' // Reset status for next run
          }).eq('id', schedule.id);
        }
      } catch (error) {
        console.error('Error processing schedule:', error);
        await supabase.from('post_schedules').update({
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        }).eq('id', schedule.id);
      }
    }
  } catch (e) {
    console.error("Error in processSchedules:", e);
  }
}

async function processSchedule(
  schedule: PostSchedule,
  wordpressClient: WordPressClient,
  geminiClient: GeminiClient
): Promise<void> {
  for (const topic of schedule.topics) {
    const content = await geminiClient.generateBlogContent(topic);
    if (!content) throw new Error(`Failed to generate content for topic: ${topic}`);
    const post = await wordpressClient.createPost(content.title, content.content);
    if (!post) throw new Error(`Failed to create post for topic: ${topic}`);
  }
}

// Find next eligible datetime in UTC for any chosen day after current time
function getNextScheduleDayUtc(
  days: Weekday[],
  time: string,
  tz: string,
  from: Date = new Date()
): Date {
  // Validate days array
  if (!days || !Array.isArray(days) || days.length === 0) {
    days = ["Monday"]; // Default to Monday if days array is invalid
  }

  for (let addDays = 0; addDays < 7; addDays++) {
    const local = new Date(from);
    local.setDate(local.getDate() + addDays);
    const weekday = local.toLocaleDateString('en-US', { weekday: 'long', timeZone: tz }) as Weekday;
    if (days.includes(weekday)) {
      const [h, m] = (time || "12:00").split(':').map(Number);
      local.setHours(h, m, 0, 0);
      // Construct that time in user's tz, then convert to UTC
      const inTzString = formatInTimeZone(local, tz, "yyyy-MM-dd'T'HH:mm:ssXXX");
      const asUtc = new Date(inTzString);
      if (asUtc > from) return asUtc;
    }
  }
  // If somehow none match, return tomorrow as fallback
  const tomorrow = new Date(from);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(12, 0, 0, 0);
  return tomorrow;
}

/**
 * Create a new schedule
 */
export async function createSchedule(
  userId: string,
  topics: string[],
  time: string,
  days: Weekday[]
): Promise<boolean> {
  try {
    const timezone = await getUserTimezone();
    
    // Validate inputs
    if (!topics || topics.length === 0) {
      console.error("No topics provided for scheduling");
      return false;
    }
    
    if (!days || days.length === 0) {
      console.error("No days selected for scheduling");
      return false;
    }
    
    // Validate UUID format for Supabase
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    
    if (!isValidUUID) {
      console.error("Invalid user ID format for database:", userId);
      return false;
    }
    
    // Calculate the next occurrence of the scheduled time
    const nextRun = getNextScheduleDayUtc(days, time, timezone);

    console.log("Creating schedule with:", {
      userId,
      topics,
      time,
      days,
      nextRun: nextRun.toISOString(),
      timezone
    });

    // Insert the schedule with time and days fields
    const { error } = await supabase.from('post_schedules').insert({
      user_id: userId,
      topics,
      time,
      days,
      scheduled_at: nextRun.toISOString(),
      local_timezone: timezone,
      status: 'pending'
    });

    if (error) {
      console.error("Schedule creation error:", error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error creating schedule:', error);
    return false;
  }
}

/**
 * Start the simulator
 * This would normally be a server-side scheduled task
 */
let simulatorInterval: number | null = null;

export function startSimulator(userId: string, credentials: UserCredentials | null): void {
  // Stop any existing simulator
  stopSimulator();
  
  if (!credentials) {
    return;
  }
  
  // Check for due schedules every minute
  simulatorInterval = window.setInterval(() => {
    processSchedules(userId, credentials);
  }, 60000);
  
  // Also check immediately
  processSchedules(userId, credentials);
}

/**
 * Stop the simulator
 */
export function stopSimulator(): void {
  if (simulatorInterval !== null) {
    window.clearInterval(simulatorInterval);
    simulatorInterval = null;
  }
}
