
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, ExternalLink, Loader2 } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserData } from '@/context/UserDataContext';
import { WordPressPost } from '@/types';
import { Badge } from '@/components/ui/badge';

export default function Posts() {
  const { wordpressClient, credentials } = useUserData();
  const [posts, setPosts] = useState<WordPressPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Fetch posts when component mounts
  useEffect(() => {
    if (wordpressClient) {
      fetchPosts();
    }
  }, [wordpressClient]);

  const fetchPosts = async () => {
    if (!wordpressClient) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const fetchedPosts = await wordpressClient.getPosts();
      setPosts(fetchedPosts);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to fetch posts from WordPress');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if credentials are set up
  const needsSetup = !credentials || 
    !credentials.wordpressSiteUrl || 
    !credentials.wordpressUsername || 
    !credentials.wordpressAppPassword;

  // Define columns for the data table
  const columns: ColumnDef<WordPressPost>[] = [
    {
      accessorKey: 'title.rendered',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="pl-0"
        >
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const title = row.getValue('title.rendered') as string;
        const link = row.original.link;
        
        // Decode HTML entities for the title
        const decodedTitle = document.createElement('div');
        decodedTitle.innerHTML = title;
        
        return (
          <div className="flex items-center gap-2 max-w-xl">
            <span className="truncate font-medium">{decodedTitle.textContent}</span>
            <a 
              href={link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80"
            >
              <ExternalLink size={14} />
            </a>
          </div>
        );
      },
    },
    {
      accessorKey: 'date',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue('date'));
        return (
          <div>{date.toLocaleDateString()}</div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return (
          <Badge
            variant={status === 'publish' ? 'default' : 'secondary'}
          >
            {status === 'publish' ? 'Published' : status}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'view_count',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="justify-end"
        >
          Views
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const views = row.getValue('view_count') as number;
        return (
          <div className="text-right font-medium">{views}</div>
        );
      },
    },
  ];

  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Posts</h1>
          <p className="text-muted-foreground">
            Manage your WordPress blog posts
          </p>
        </div>
        
        <Button 
          onClick={() => navigate('/scheduling')}
          className="bg-primary hover:bg-primary/90"
        >
          Schedule New Posts
        </Button>
      </div>
      
      {needsSetup ? (
        <Card>
          <CardHeader>
            <CardTitle>WordPress Connection Required</CardTitle>
            <CardDescription>
              Please configure your WordPress credentials to view your posts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/account')}
              variant="outline"
            >
              Configure WordPress
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>WordPress Posts</CardTitle>
              <CardDescription>
                {posts.length > 0 ? `Showing ${posts.length} posts from your WordPress site` : 'No posts found'}
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchPosts}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading
                </>
              ) : (
                'Refresh'
              )}
            </Button>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-destructive text-center py-4">
                {error}
              </div>
            ) : (
              <DataTable 
                columns={columns} 
                data={posts} 
                searchColumn="title.rendered"
                searchPlaceholder="Search posts..."
              />
            )}
          </CardContent>
        </Card>
      )}
    </MainLayout>
  );
}
