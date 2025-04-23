
/**
 * This is a simulator for blog post scheduling
 * 
 * In a real application, this would be handled by backend services.
 * For this demo, we're simulating the process in the browser.
 */

import { PostSchedule, UserCredentials } from '@/types';
import { WordPressClient } from './wordpress';
import { GeminiClient } from './gemini';
import { convertToUTC, getUserTimezone } from '@/utils/timezone';
import { supabase } from '@/integrations/supabase/client';

// Storage keys
const SCHEDULES_KEY_PREFIX = 'blog_genie_schedules_';

/**
 * Process pending schedules that are due
 */
export async function processSchedules(userId: string, credentials: UserCredentials): Promise<void> {
  try {
    // Get user's timezone
    const timezone = await getUserTimezone();
    
    // Get pending schedules from Supabase
    const { data: schedules } = await supabase
      .from('post_schedules')
      .select('*')
      .eq('status', 'pending')
      .eq('user_id', userId);

    if (!schedules || schedules.length === 0) {
      return;
    }

    // Initialize clients
    const wordpressClient = new WordPressClient(
      credentials.wordpressSiteUrl,
      credentials.wordpressUsername,
      credentials.wordpressAppPassword
    );
    
    const geminiClient = new GeminiClient(credentials.geminiApiKey);

    const now = new Date();

    // Process each pending schedule that's due
    for (const schedule of schedules) {
      const scheduledDate = new Date(schedule.scheduled_at);
      
      if (scheduledDate <= now) {
        console.log(`Processing scheduled post: ${schedule.id}`);
        
        try {
          // Process the schedule
          await processSchedule(schedule, wordpressClient, geminiClient);
          
          // Mark as completed
          await supabase
            .from('post_schedules')
            .update({ status: 'completed' })
            .eq('id', schedule.id);
            
        } catch (error) {
          console.error('Error processing schedule:', error);
          
          // Mark as failed
          await supabase
            .from('post_schedules')
            .update({
              status: 'failed',
              error: error instanceof Error ? error.message : 'Unknown error'
            })
            .eq('id', schedule.id);
        }
      }
    }
  } catch (error) {
    console.error('Error in processSchedules:', error);
  }
}

/**
 * Process a single schedule
 */
async function processSchedule(
  schedule: PostSchedule,
  wordpressClient: WordPressClient,
  geminiClient: GeminiClient
): Promise<void> {
  // Process each topic in the schedule
  for (const topic of schedule.topics) {
    // Generate blog content
    const content = await geminiClient.generateBlogContent(topic);
    
    if (!content) {
      throw new Error(`Failed to generate content for topic: ${topic}`);
    }
    
    // Create post
    const post = await wordpressClient.createPost(content.title, content.content);
    
    if (!post) {
      throw new Error(`Failed to create post for topic: ${topic}`);
    }
  }
}

/**
 * Create a new schedule
 */
export async function createSchedule(
  userId: string,
  topics: string[],
  scheduledDate: Date
): Promise<boolean> {
  try {
    const timezone = await getUserTimezone();
    const utcDate = convertToUTC(scheduledDate, timezone);

    const { error } = await supabase.from('post_schedules').insert({
      user_id: userId,
      topics,
      scheduled_at: utcDate.toISOString(),
      local_timezone: timezone
    });

    if (error) {
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
