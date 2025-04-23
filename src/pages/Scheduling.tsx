import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock, Loader2 } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useUserData } from '@/context/UserDataContext';
import { useToast } from '@/hooks/use-toast';

export default function Scheduling() {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState('12:00');
  const [topics, setTopics] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { credentials, createSchedule } = useUserData();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check if credentials are set up
  const needsSetup = !credentials || 
    !credentials.wordpressSiteUrl || 
    !credentials.wordpressUsername || 
    !credentials.wordpressAppPassword || 
    !credentials.geminiApiKey;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date) {
      toast({
        title: "Date required",
        description: "Please select a date for scheduling",
        variant: "destructive",
      });
      return;
    }
    
    if (!topics.trim()) {
      toast({
        title: "Topics required",
        description: "Please enter at least one topic",
        variant: "destructive",
      });
      return;
    }
    
    // Parse topics
    const topicsArray = topics
      .split(/[\n,]+/) // Split by new line or comma
      .map(topic => topic.trim())
      .filter(topic => topic.length > 0);
    
    if (topicsArray.length === 0) {
      toast({
        title: "Invalid topics",
        description: "Please enter valid topics separated by commas or new lines",
        variant: "destructive",
      });
      return;
    }
    
    // Combine date and time
    const [hours, minutes] = time.split(':').map(Number);
    const scheduledDate = new Date(date);
    scheduledDate.setHours(hours, minutes);
    
    // Check if date is in the past
    if (scheduledDate < new Date()) {
      toast({
        title: "Invalid schedule time",
        description: "Schedule time must be in the future",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Now passing Date object directly instead of ISO string
      const success = await createSchedule(topicsArray, scheduledDate);
      
      if (success) {
        toast({
          title: "Posts scheduled",
          description: `Successfully scheduled ${topicsArray.length} post${topicsArray.length > 1 ? 's' : ''}`,
        });
        
        // Clear the form
        setDate(undefined);
        setTime('12:00');
        setTopics('');
        
        // Navigate to dashboard
        navigate('/dashboard');
      } else {
        toast({
          title: "Scheduling failed",
          description: "Failed to schedule posts",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Scheduling error:', error);
      toast({
        title: "Scheduling error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Schedule Posts</h1>
        <p className="text-muted-foreground">
          Schedule automatic blog post generation and publishing
        </p>
      </div>
      
      {needsSetup ? (
        <Card>
          <CardHeader>
            <CardTitle>Account Setup Required</CardTitle>
            <CardDescription>
              Please configure your WordPress and Gemini API credentials to schedule posts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/account')}
              variant="outline"
            >
              Complete Setup
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Create Post Schedule</CardTitle>
              <CardDescription>
                Schedule automatic blog posts with AI-generated content
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Schedule Date and Time</Label>
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[240px]">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div>
                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-[120px]"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="topics">Blog Topics</Label>
                <Textarea
                  id="topics"
                  placeholder="Enter blog topics (one per line or comma-separated)
Example:
10 Ways to Improve SEO Rankings
Best Productivity Tools for 2023
How to Start a Successful Blog"
                  value={topics}
                  onChange={(e) => setTopics(e.target.value)}
                  className="min-h-[200px]"
                />
                <p className="text-sm text-muted-foreground">
                  Each topic will generate a separate blog post at the scheduled time.
                </p>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard')}
              >
                Cancel
              </Button>
              
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  'Schedule Posts'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}
    </MainLayout>
  );
}
