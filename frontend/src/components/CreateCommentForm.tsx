import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { createComment } from "@/api/posts";
import { cn } from "@/lib/utils";

interface CreateCommentFormProps {
    postId: number;
    parentId?: number;
    onSuccess?: () => void;
    autoFocus?: boolean;
    className?: string;
    placeholder?: string;
}

export function CreateCommentForm({ 
    postId, 
    parentId, 
    onSuccess, 
    autoFocus = false,
    className,
    placeholder = "Write a comment..."
}: CreateCommentFormProps) {
    const { user } = useAuth();
    const [content, setContent] = useState("");
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async () => {
            return createComment(content, postId, parentId, user?.username);
        },
        onSuccess: () => {
            setContent("");
            queryClient.invalidateQueries({ queryKey: ["post", String(postId)] });
            if (onSuccess) onSuccess();
        }
    });

    if (!user) return null;

    return (
        <div className={cn("space-y-3", className)}>
            <Textarea 
                autoFocus={autoFocus}
                placeholder={placeholder} 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="resize-none bg-background border-border focus-visible:ring-1 min-h-[60px] text-sm"
            />
            <div className="flex justify-end gap-2">
                {parentId && onSuccess && (
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={onSuccess}
                        className="text-xs"
                    >
                        Cancel
                    </Button>
                )}
                <Button 
                    size="sm" 
                    onClick={() => mutation.mutate()}
                    disabled={!content.trim() || mutation.isPending}
                    className="text-xs px-4"
                >
                    {mutation.isPending ? "Posting..." : parentId ? "Reply" : "Comment"}
                </Button>
            </div>
        </div>
    )
}
