
/**
 * Google Gemini API client for generating blog content
 */
export class GeminiClient {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  /**
   * Generate blog content based on a topic
   */
  async generateBlogContent(topic: string): Promise<{ title: string; content: string } | null> {
    try {
      const prompt = `
        Write a comprehensive, engaging blog post about "${topic}".
        The blog post should:
        1. Have a catchy title
        2. Be around 800 words
        3. Include an introduction, 3-5 main sections with headings, and a conclusion
        4. Use a conversational, informative tone
        5. Include some actionable tips where applicable
        
        Format the response as:
        
        TITLE: [The title]
        
        CONTENT:
        [The full blog post content with HTML formatting]
      `;
      
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });
      
      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      const generatedText = data.candidates[0].content.parts[0].text;
      
      // Parse the response to extract title and content
      const titleMatch = generatedText.match(/TITLE:\s*(.+?)(?:\n|$)/);
      const contentMatch = generatedText.match(/CONTENT:\s*([\s\S]+)/);
      
      if (!titleMatch || !contentMatch) {
        throw new Error('Failed to parse Gemini API response');
      }
      
      return {
        title: titleMatch[1].trim(),
        content: contentMatch[1].trim(),
      };
    } catch (error) {
      console.error('Error generating content with Gemini API:', error);
      return null;
    }
  }
  
  /**
   * Generate an image prompt based on a topic
   */
  async generateImagePrompt(topic: string): Promise<string | null> {
    try {
      const prompt = `Generate a detailed image description for a blog post about "${topic}". 
      The description should be specific and visual, suitable for generating an image with an AI image generator.
      Make it brief but descriptive, no more than 2-3 sentences.`;
      
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });
      
      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.candidates[0].content.parts[0].text.trim();
    } catch (error) {
      console.error('Error generating image prompt with Gemini API:', error);
      return null;
    }
  }
}
