import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getPost } from "@/api/posts";
import { PostCard } from "@/components/PostCard";
import { CommentList } from "@/components/CommentList";
import { LeaderboardWidget } from "@/components/LeaderboardWidget";
import { CreateCommentForm } from "@/components/CreateCommentForm";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PostDetail() {
  const { id } = useParams<{ id: string }>();
  
  const { data: post, isLoading, error } = useQuery({
    queryKey: ["post", id],
    queryFn: () => getPost(id!),
    enabled: !!id,
  });

  if (isLoading) return <div className="container max-w-screen-md mx-auto py-12 px-4 animate-pulse">Loading...</div>;
  if (error || !post) return <div className="container py-12 px-4 text-destructive">Post not found.</div>;

  return (
    <div className="container max-w-screen-md mx-auto py-8 px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-2 space-y-6">
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2 text-muted-foreground hover:text-foreground">
             <Link to="/">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to Feed
             </Link>
        </Button>

        <PostCard post={post} showCommentsLink={false} />
        
        <div className="pt-4">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                Discussion
                <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {post.comments?.length || 0} (Showing roots)
                </span>
            </h3>

            <CreateCommentForm postId={post.id} className="mb-8" />
            
            <CommentList comments={post.comments} postId={post.id} />
        </div>
      </div>

      <div className="hidden md:block">
         <div className="sticky top-24">
            <LeaderboardWidget />
        </div>
      </div>
    </div>
  );
}
