import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Loader2 } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { useUserData } from '@/context/UserDataContext';
import { useToast } from '@/hooks/use-toast';
import { Weekday } from '@/types';

const WEEKDAYS: Weekday[] = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];

export default function Scheduling() {
  const [time, setTime] = useState('12:00');
  const [topics, setTopics] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDays, setSelectedDays] = useState<Weekday[]>([]);
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
    if (!selectedDays.length) {
      toast({ title: "Choose days", description: "Pick at least one day", variant: "destructive" });
      return;
    }
    if (!topics.trim()) {
      toast({ title: "Topics required", description: "Please enter at least one topic", variant: "destructive" });
      return;
    }
    // Parse topics
    const topicsArray = topics.split(/[\n,]+/).map(t => t.trim()).filter(Boolean);
    if (!topicsArray.length) {
      toast({ title: "Invalid topics", description: "Please enter valid topics separated by commas or new lines", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      // topic, time, days are passed now
      const success = await createSchedule(topicsArray, time, selectedDays);
      if (success) {
        toast({
          title: "Recurring posts scheduled",
          description: `Post(s) scheduled for ${selectedDays.join(', ')} at ${time}`,
        });
        setTime('12:00');
        setTopics('');
        setSelectedDays([]);
        navigate('/dashboard');
      } else {
        toast({ title: "Scheduling failed", description: "Failed to schedule posts", variant: "destructive" });
      }
    } catch (error) {
      console.error('Scheduling error:', error);
      toast({ title: "Scheduling error", description: "An unexpected error occurred", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleDay = (day: Weekday) => {
    setSelectedDays((days) => days.includes(day)
      ? days.filter(d => d !== day)
      : [...days, day]);
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
                <Label>Select Days of Week</Label>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map((day) => (
                    <Button
                      type="button"
                      key={day}
                      variant={selectedDays.includes(day) ? "default" : "outline"}
                      onClick={() => toggleDay(day)}
                      className="px-4"
                    >
                      {day.slice(0, 3)}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Time (Local)</Label>
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
              
              <div className="space-y-2">
                <Label htmlFor="topics">Blog Topics</Label>
                <Textarea
                  id="topics"
                  placeholder="Enter blog topics (one per line or comma-separated)..."
                  value={topics}
                  onChange={(e) => setTopics(e.target.value)}
                  className="min-h-[150px]"
                />
                <p className="text-sm text-muted-foreground">
                  Each topic will generate a post on each scheduled day at the selected time.
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
