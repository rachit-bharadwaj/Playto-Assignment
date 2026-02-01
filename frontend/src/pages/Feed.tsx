import { useQuery } from "@tanstack/react-query";
import { getPosts } from "@/api/posts";
import { PostCard } from "@/components/PostCard";
import { LeaderboardWidget } from "@/components/LeaderboardWidget";
import { CreatePostForm } from "@/components/CreatePostForm";

export function Feed() {
  const { data: posts, isLoading, error } = useQuery({
    queryKey: ["posts"],
    queryFn: getPosts,
  });

  return (
    <div className="container max-w-screen-md mx-auto py-8 px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-2 space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Community Feed</h1>
        
        <CreatePostForm />

        {isLoading && (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-48 rounded-xl border bg-card animate-pulse" />
                ))}
            </div>
        )}
        
        {error && (
            <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm font-medium">
                Failed to load posts. Please try again.
            </div>
        )}

        {posts?.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
        
        {posts?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
                No posts yet. Be the first to say something!
            </div>
        )}
      </div>

      <div className="hidden md:block">
        <div className="sticky top-24">
            <LeaderboardWidget />
        </div>
      </div>
    </div>
  );
}
