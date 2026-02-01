import { useQuery } from "@tanstack/react-query";
import { getLeaderboard } from "@/api/leaderboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function LeaderboardWidget() {
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: getLeaderboard,
    refetchInterval: 30000, // Refresh every 30s
  });

  if (isLoading) return <Card className="animate-pulse h-64" />;
  if (!leaderboard || leaderboard.length === 0) {
      return (
          <Card>
              <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        Top Users (24h)
                  </CardTitle>
              </CardHeader>
              <CardContent>
                  <p className="text-sm text-muted-foreground">No activity yet.</p>
              </CardContent>
          </Card>
      );
  }

  return (
    <Card className="overflow-hidden border-border/60 shadow-sm">
      <CardHeader className="pb-3 bg-muted/40 border-b">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Trophy className="h-4 w-4 text-yellow-500 fill-current" />
            Top Users (24h)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border/50">
          {leaderboard.map((user, index) => (
            <li key={user.id} className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <span className={`w-5 text-center text-sm font-medium ${index < 3 ? "text-primary" : "text-muted-foreground"}`}>
                    #{index + 1}
                </span>
                <Avatar className="h-8 w-8 border">
                  <AvatarImage src={`https://api.dicebear.com/9.x/notionists/svg?seed=${user.username}`} />
                  <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{user.username}</span>
                  {/* <span className="text-[10px] text-muted-foreground">Rank {index+1}</span> */}
                </div>
              </div>
              <div className="pr-2">
                 <span className="font-bold text-sm">{user.score}</span>
                 <span className="text-[10px] text-muted-foreground ml-1">pts</span>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
