import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown } from "lucide-react";

export function Navbar() {
  const { user, login } = useAuth();
  const users = ["alice", "bob", "charlie"];

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container flex h-14 items-center gap-4 max-w-screen-md mx-auto px-4">
        <Link to="/" className="font-semibold text-lg tracking-tight">
          Playto
        </Link>
        <div className="flex-1" />
        {user ? (
            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden sm:inline-block">Logged in as</span>
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 gap-2 px-2">
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={`https://api.dicebear.com/9.x/notionists/svg?seed=${user.username}`} />
                            <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.username}</span>
                        <ChevronDown className="h-3 w-3 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {users.map((u) => (
                    <DropdownMenuItem key={u} onClick={() => login(u)}>
                        Switch to {u}
                    </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
                </DropdownMenu>
            </div>
        ) : null}
      </div>
    </nav>
  );
}
