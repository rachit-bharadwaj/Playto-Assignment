import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Heart } from "lucide-react";
import { type Post, likePost } from "@/api/posts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

interface PostCardProps {
  post: Post;
  showCommentsLink?: boolean;
}

export function PostCard({ post, showCommentsLink = true }: PostCardProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const likeMutation = useMutation({
    mutationFn: (id: number) => likePost(id, user?.username),
    onMutate: async () => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["posts"] });
      const previousPosts = queryClient.getQueryData<Post[]>(["posts"]);

      queryClient.setQueryData<Post[]>(["posts"], (old) => {
        if (!old) return [];
        return old.map((p) =>
          p.id === post.id ? { ...p, likes_count: p.likes_count + 1 } : p
        );
      });
      
      // Also update single post cache if it exists
      queryClient.setQueryData<Post>(["post", String(post.id)], (old) => {
          if (!old) return undefined;
          return { ...old, likes_count: old.likes_count + 1 };
      })

      return { previousPosts };
    },
    onError: (_err, _newTodo, context) => {
      queryClient.setQueryData(["posts"], context?.previousPosts);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
       queryClient.invalidateQueries({ queryKey: ["post", String(post.id)] });
       queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });

  return (
    <Card className="border-border/40 hover:border-border/80 transition-colors">
      <CardHeader className="flex flex-row items-center gap-3 p-4 pb-2">
        <Avatar className="h-10 w-10 border">
          <AvatarImage src={`https://api.dicebear.com/9.x/notionists/svg?seed=${post.author.username}`} />
          <AvatarFallback>{post.author.username[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="font-semibold text-sm hover:underline cursor-pointer">
            {post.author.username}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-4 py-2">
        <p className="text-base leading-relaxed whitespace-pre-wrap">{post.content}</p>
      </CardContent>
      <CardFooter className="p-4 pt-2 flex items-center gap-4">
        <Button
            variant="ghost" 
            size="sm"
            onClick={(e) => {
                e.preventDefault();
                likeMutation.mutate(post.id);
            }}
            className={cn("text-muted-foreground gap-1.5 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 group transition-all", likeMutation.isPending && "opacity-70")}
        >
            <motion.div whileTap={{ scale: 0.8 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
                <Heart className={cn("h-4 w-4 group-hover:fill-current", post.likes_count > 0 ? "fill-current text-red-500" : "")} />
            </motion.div>
            <AnimatePresence mode="popLayout">
                <motion.span
                    key={post.likes_count}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className={cn("text-xs font-medium tabular-nums", post.likes_count > 0 && "text-red-500")}
                >
                    {post.likes_count}
                </motion.span>
            </AnimatePresence>
        </Button>
        {showCommentsLink && (
           <Button variant="ghost" size="sm" className="text-muted-foreground gap-1.5 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30" asChild>
             <Link to={`/posts/${post.id}`}>
               <MessageSquare className="h-4 w-4" />
               <span className="text-xs font-medium">Comments</span>
             </Link>
           </Button>
        )}
      </CardFooter>
    </Card>
  );
}
