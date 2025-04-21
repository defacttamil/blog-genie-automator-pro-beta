
import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUserData } from '@/context/UserDataContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { UserCredentials } from '@/types';

export default function Account() {
  const { credentials, updateCredentials } = useUserData();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<UserCredentials>({
    wordpressSiteUrl: '',
    wordpressUsername: '',
    wordpressAppPassword: '',
    geminiApiKey: '',
  });
  
  // Initialize form with existing credentials
  useEffect(() => {
    if (credentials) {
      setFormData(credentials);
    }
  }, [credentials]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!formData.wordpressSiteUrl || !formData.wordpressUsername || !formData.wordpressAppPassword || !formData.geminiApiKey) {
      toast({
        title: "All fields required",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    // Validate WordPress URL
    let url = formData.wordpressSiteUrl;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    setIsSubmitting(true);
    
    try {
      // Update credentials with normalized URL
      updateCredentials({
        ...formData,
        wordpressSiteUrl: url,
      });
      
      toast({
        title: "Settings updated",
        description: "Your account settings have been updated successfully",
      });
    } catch (error) {
      console.error('Error updating credentials:', error);
      toast({
        title: "Update failed",
        description: "Failed to update account settings",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground">
          Manage your WordPress and API credentials
        </p>
      </div>
      
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>WordPress Connection</CardTitle>
            <CardDescription>
              Connect your WordPress site to enable automated blog posting
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="wordpressSiteUrl">WordPress Site URL</Label>
              <Input
                id="wordpressSiteUrl"
                name="wordpressSiteUrl"
                placeholder="https://yourblog.com"
                value={formData.wordpressSiteUrl}
                onChange={handleChange}
              />
              <p className="text-sm text-muted-foreground">
                The URL of your WordPress site (e.g., https://yourblog.com)
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="wordpressUsername">WordPress Username</Label>
              <Input
                id="wordpressUsername"
                name="wordpressUsername"
                placeholder="admin"
                value={formData.wordpressUsername}
                onChange={handleChange}
              />
              <p className="text-sm text-muted-foreground">
                Your WordPress admin username
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="wordpressAppPassword">WordPress Application Password</Label>
              <Input
                id="wordpressAppPassword"
                name="wordpressAppPassword"
                type="password"
                placeholder="••••••••••••••••"
                value={formData.wordpressAppPassword}
                onChange={handleChange}
              />
              <p className="text-sm text-muted-foreground">
                Generate an application password in your WordPress admin panel 
                (Users → Your Profile → Application Passwords)
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="geminiApiKey">Google Gemini API Key</Label>
              <Input
                id="geminiApiKey"
                name="geminiApiKey"
                type="password"
                placeholder="••••••••••••••••"
                value={formData.geminiApiKey}
                onChange={handleChange}
              />
              <p className="text-sm text-muted-foreground">
                Your Google Gemini API key. Get one from the 
                <a 
                  href="https://ai.google.dev/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary ml-1 hover:underline"
                >
                  Google AI Developer website
                </a>
              </p>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Settings'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </MainLayout>
  );
}
