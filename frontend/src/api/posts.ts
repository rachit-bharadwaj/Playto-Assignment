import client from "./client";

export interface User {
  id: number;
  username: string;
}

export interface Comment {
  id: number;
  author: User;
  content: string;
  created_at: string;
  likes_count: number;
  replies: Comment[];
}

export interface Post {
  id: number;
  author: User;
  content: string;
  created_at: string;
  likes_count: number;
  comments?: Comment[];
}

export const getPosts = async () => {
  const { data } = await client.get<Post[]>("/posts/");
  return data;
};

export const getPost = async (id: string) => {
  const { data } = await client.get<Post>(`/posts/${id}/`);
  return data;
};

export const likePost = async (id: number) => {
  const { data } = await client.post("/likes/", { type: "post", id });
  return data;
};

export const likeComment = async (id: number) => {
  const { data } = await client.post("/likes/", { type: "comment", id });
  return data;
};
