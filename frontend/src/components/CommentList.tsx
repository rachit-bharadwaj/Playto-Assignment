import { useState } from "react";
import { type Comment, likeComment } from "@/api/posts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { Heart } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { CreateCommentForm } from "./CreateCommentForm";

interface CommentNodeProps {
  comment: Comment;
  postId: number;
}

export function CommentNode({ comment, postId }: CommentNodeProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(true);
  const [showReply, setShowReply] = useState(false);

  const likeMutation = useMutation({
    mutationFn: (id: number) => likeComment(id, user?.username),
    onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ["post"] }); 
         queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    }
  });

  return (
    <div className="flex gap-3 group/comment">
       <div className="flex flex-col items-center gap-1">
            <Avatar className="h-8 w-8 border mt-1">
                <AvatarImage src={`https://api.dicebear.com/9.x/notionists/svg?seed=${comment.author.username}`} />
                <AvatarFallback>{comment.author.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            {comment.replies && comment.replies.length > 0 && (
                <div className="w-px flex-1 bg-border group-hover/comment:bg-border/80 transition-colors mb-2" />
            )}
       </div>

      <div className="flex-1 space-y-2 pb-4">
        <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{comment.author.username}</span>
            <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
        </div>
        
        <div className="text-sm leading-relaxed text-foreground/90">
             {comment.content}
        </div>

        <div className="flex items-center gap-3">
             <Button
                variant="ghost" 
                size="icon"
                onClick={() => likeMutation.mutate(comment.id)}
                className="h-6 w-6 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
               <motion.div whileTap={{ scale: 0.8 }}>
                    <Heart className={cn("h-3.5 w-3.5", comment.likes_count > 0 ? "fill-current text-red-500" : "")} />
               </motion.div>
            </Button>
            {comment.likes_count > 0 && (
                 <span className="text-xs font-medium text-muted-foreground tabular-nums">{comment.likes_count}</span>
            )}

            <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 text-xs text-muted-foreground hover:text-primary"
                onClick={() => setShowReply(!showReply)}
            >
                Reply
            </Button>
            
            {comment.replies && comment.replies.length > 0 && (
                 <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 text-xs text-muted-foreground"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    {isExpanded ? "Collapse" : `Show ${comment.replies.length} replies`}
                 </Button>
            )}
        </div>

        <AnimatePresence>
            {showReply && (
                 <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-2"
                 >
                    <CreateCommentForm 
                        postId={postId} 
                        parentId={comment.id} 
                        onSuccess={() => setShowReply(false)} 
                        autoFocus
                        placeholder={`Replying to ${comment.author.username}...`}
                    />
                 </motion.div>
            )}
        </AnimatePresence>
        
        <AnimatePresence>
            {isExpanded && comment.replies && comment.replies.length > 0 && (
                <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 pl-0" // We rely on the tree structure flex-gap for indentation visual
                >
                    {/* Actually better structure for reddit style lines: Use nested div with padding */}
                    <div className="space-y-4">
                        {comment.replies.map((reply) => (
                            <CommentNode key={reply.id} comment={reply} postId={postId} />
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface CommentListProps {
    comments?: Comment[];
    postId: number;
}

export function CommentList({ comments, postId }: CommentListProps) {
    if (!comments || comments.length === 0) return null;
    return (
        <div className="space-y-6">
            {comments.map(c => <CommentNode key={c.id} comment={c} postId={postId} />)}
        </div>
    )
}
