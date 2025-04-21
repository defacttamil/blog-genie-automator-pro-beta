
import { WordPressPost, WordPressStats } from "@/types";

/**
 * WordPress API client for interacting with WordPress sites
 */
export class WordPressClient {
  private siteUrl: string;
  private username: string;
  private appPassword: string;
  
  constructor(siteUrl: string, username: string, appPassword: string) {
    // Ensure the site URL ends with a slash
    this.siteUrl = siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`;
    this.username = username;
    this.appPassword = appPassword;
  }
  
  /**
   * Get authentication headers for WP API requests
   */
  private getAuthHeaders() {
    const token = btoa(`${this.username}:${this.appPassword}`);
    return {
      'Authorization': `Basic ${token}`,
      'Content-Type': 'application/json',
    };
  }
  
  /**
   * Fetch posts from the WordPress site
   */
  async getPosts(): Promise<WordPressPost[]> {
    try {
      const response = await fetch(
        `${this.siteUrl}wp-json/wp/v2/posts?_embed=true&per_page=10`, 
        { headers: this.getAuthHeaders() }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.statusText}`);
      }
      
      const posts = await response.json();
      
      // Simulate view counts since WordPress doesn't provide this out of the box
      return posts.map((post: WordPressPost) => ({
        ...post,
        view_count: Math.floor(Math.random() * 1000) // Simulated view count
      }));
    } catch (error) {
      console.error('Error fetching WordPress posts:', error);
      return [];
    }
  }
  
  /**
   * Create a new post on the WordPress site
   */
  async createPost(title: string, content: string, featuredImageId?: number): Promise<WordPressPost | null> {
    try {
      const postData: any = {
        title,
        content,
        status: 'publish',
      };
      
      if (featuredImageId) {
        postData.featured_media = featuredImageId;
      }
      
      const response = await fetch(
        `${this.siteUrl}wp-json/wp/v2/posts`,
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(postData),
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to create post: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating WordPress post:', error);
      return null;
    }
  }
  
  /**
   * Upload an image to the WordPress media library
   */
  async uploadImage(imageBlob: Blob, filename: string): Promise<number | null> {
    try {
      const formData = new FormData();
      formData.append('file', imageBlob, filename);
      
      const response = await fetch(
        `${this.siteUrl}wp-json/wp/v2/media`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${this.username}:${this.appPassword}`)}`,
          },
          body: formData,
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to upload image: ${response.statusText}`);
      }
      
      const media = await response.json();
      return media.id;
    } catch (error) {
      console.error('Error uploading image to WordPress:', error);
      return null;
    }
  }
  
  /**
   * Get stats from the WordPress site (simulated)
   */
  async getStats(): Promise<WordPressStats> {
    // In a real implementation, you would fetch this data from WordPress
    // For now, we'll simulate it
    try {
      const postsResponse = await fetch(
        `${this.siteUrl}wp-json/wp/v2/posts?per_page=1`, 
        { headers: this.getAuthHeaders() }
      );
      
      if (!postsResponse.ok) {
        throw new Error(`Failed to fetch posts: ${postsResponse.statusText}`);
      }
      
      const totalPosts = parseInt(postsResponse.headers.get('X-WP-Total') || '0', 10);
      
      return {
        totalPosts,
        totalViews: Math.floor(totalPosts * (Math.random() * 500 + 100)), // Simulated view count
      };
    } catch (error) {
      console.error('Error fetching WordPress stats:', error);
      return {
        totalPosts: 0,
        totalViews: 0,
      };
    }
  }
}
