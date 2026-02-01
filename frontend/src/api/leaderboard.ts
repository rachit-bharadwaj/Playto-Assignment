import client from "./client";
import type { User } from "./posts";

export interface LeaderboardEntry extends User {
  score: number;
}

export const getLeaderboard = async () => {
  const { data } = await client.get<LeaderboardEntry[]>("/leaderboard/");
  return data;
};
