import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import client from "@/api/client";

export function CreatePostForm() {
    const { user } = useAuth();
    const [content, setContent] = useState("");
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (_text: string) => {
             return client.post("/posts/", { content, username: user?.username }); 
        },
        onSuccess: () => {
            setContent("");
            queryClient.invalidateQueries({ queryKey: ["posts"] });
        }
    });

    if (!user) return null;

    return (
        <div className="border rounded-xl p-4 space-y-3 bg-card/50">
            <Textarea 
                placeholder="What's on your mind?" 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="resize-none bg-background border-none shadow-none focus-visible:ring-0 min-h-[80px]"
            />
            <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-xs text-muted-foreground">Posting as {user.username}</span>
                <Button 
                    size="sm" 
                    onClick={() => mutation.mutate(content)}
                    disabled={!content.trim() || mutation.isPending}
                >
                    {mutation.isPending ? "Posting..." : "Post"}
                </Button>
            </div>
        </div>
    )
}
