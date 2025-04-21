
/**
 * This is a simulator for blog post scheduling
 * 
 * In a real application, this would be handled by backend services.
 * For this demo, we're simulating the process in the browser.
 */

import { PostSchedule, UserCredentials } from '@/types';
import { WordPressClient } from './wordpress';
import { GeminiClient } from './gemini';

// Storage keys
const SCHEDULES_KEY_PREFIX = 'blog_genie_schedules_';

/**
 * Process pending schedules that are due
 */
export async function processSchedules(userId: string, credentials: UserCredentials): Promise<void> {
  const schedulesKey = `${SCHEDULES_KEY_PREFIX}${userId}`;
  const schedulesJson = localStorage.getItem(schedulesKey);
  
  if (!schedulesJson) {
    return;
  }
  
  const schedules: PostSchedule[] = JSON.parse(schedulesJson);
  const now = new Date();
  let hasChanges = false;
  
  // Initialize clients
  const wordpressClient = new WordPressClient(
    credentials.wordpressSiteUrl,
    credentials.wordpressUsername,
    credentials.wordpressAppPassword
  );
  
  const geminiClient = new GeminiClient(credentials.geminiApiKey);
  
  // Process each pending schedule that's due
  for (const schedule of schedules) {
    if (schedule.status === 'pending' && new Date(schedule.scheduledDate) <= now) {
      console.log(`Processing scheduled post: ${schedule.id}`);
      
      try {
        // Process the schedule
        await processSchedule(schedule, wordpressClient, geminiClient);
        
        // Mark as completed
        schedule.status = 'completed';
        hasChanges = true;
      } catch (error) {
        console.error('Error processing schedule:', error);
        
        // Mark as failed
        schedule.status = 'failed';
        schedule.error = error instanceof Error ? error.message : 'Unknown error';
        hasChanges = true;
      }
    }
  }
  
  // Save updated schedules
  if (hasChanges) {
    localStorage.setItem(schedulesKey, JSON.stringify(schedules));
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
