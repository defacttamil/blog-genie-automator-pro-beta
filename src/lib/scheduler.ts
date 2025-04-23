
/**
 * Blog post scheduler service
 * 
 * In a real production app, this would be implemented as a backend service
 * using proper scheduling with cron jobs or a task queue.
 * 
 * For this demo, we'll simulate the scheduler with local storage and periodic checks.
 */

import { WordPressClient } from './wordpress';
import { GeminiClient } from './gemini';
import { PostSchedule } from '@/types';

// Scheduler singleton instance
let schedulerInstance: PostScheduler | null = null;

export class PostScheduler {
  private intervalId: number | null = null;
  private scheduleKey: string;
  private wordpressClient: WordPressClient | null = null;
  private geminiClient: GeminiClient | null = null;
  
  constructor(userId: string) {
    this.scheduleKey = `blog_genie_schedules_${userId}`;
  }
  
  /**
   * Set the WordPress and Gemini clients
   */
  setClients(wordpressClient: WordPressClient, geminiClient: GeminiClient) {
    this.wordpressClient = wordpressClient;
    this.geminiClient = geminiClient;
  }
  
  /**
   * Start the scheduler
   */
  start() {
    if (this.intervalId !== null) {
      this.stop();
    }
    
    // Check for due schedules every minute
    this.intervalId = window.setInterval(() => this.checkSchedules(), 60000);
    
    // Also check immediately
    this.checkSchedules();
  }
  
  /**
   * Stop the scheduler
   */
  stop() {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  
  /**
   * Check for schedules that are due to run
   */
  private async checkSchedules() {
    if (!this.wordpressClient || !this.geminiClient) {
      console.warn('Cannot check schedules: WordPress or Gemini client not set');
      return;
    }
    
    try {
      // Get all schedules from storage
      const schedules: PostSchedule[] = JSON.parse(
        localStorage.getItem(this.scheduleKey) || '[]'
      );
      
      if (schedules.length === 0) {
        return;
      }
      
      const now = new Date();
      let hasChanges = false;
      
      // Find schedules that are due
      for (const schedule of schedules) {
        if (
          schedule.status === 'pending' && 
          new Date(schedule.scheduled_at) <= now
        ) {
          // Process this schedule
          console.log(`Processing scheduled post: ${schedule.id}`);
          
          // Update status to processing
          schedule.status = 'completed'; // Optimistic update
          hasChanges = true;
          
          // For each topic in the schedule, generate and publish a post
          for (const topic of schedule.topics) {
            try {
              // Generate blog content
              const content = await this.geminiClient.generateBlogContent(topic);
              
              if (!content) {
                throw new Error('Failed to generate content');
              }
              
              // Generate image prompt
              const imagePrompt = await this.geminiClient.generateImagePrompt(topic);
              
              // In a real app, we would use the image prompt to generate an image
              // with a service like DALL-E, Stable Diffusion, or a stock photo API
              // For now, we'll skip the image upload
              
              // Create post
              const post = await this.wordpressClient.createPost(
                content.title,
                content.content
              );
              
              if (!post) {
                throw new Error('Failed to create post');
              }
              
              console.log(`Published post: ${content.title}`);
            } catch (error) {
              console.error(`Error processing topic "${topic}":`, error);
              // If any topic fails, mark the schedule as failed
              schedule.status = 'failed';
              schedule.error = error instanceof Error ? error.message : 'Unknown error';
            }
          }
        }
      }
      
      // Save updated schedules
      if (hasChanges) {
        localStorage.setItem(this.scheduleKey, JSON.stringify(schedules));
      }
    } catch (error) {
      console.error('Error checking schedules:', error);
    }
  }
  
  /**
   * Get or create scheduler singleton instance
   */
  static getInstance(userId: string): PostScheduler {
    if (!schedulerInstance) {
      schedulerInstance = new PostScheduler(userId);
    }
    return schedulerInstance;
  }
}
