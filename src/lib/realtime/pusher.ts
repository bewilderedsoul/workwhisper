// src/lib/realtime/pusher.ts
import Pusher from "pusher";
import PusherClient from "pusher-js";

let _pusherServer: Pusher | null = null;

function pusherConfigured(): boolean {
  return Boolean(
    process.env.PUSHER_APP_ID &&
      process.env.PUSHER_KEY &&
      process.env.PUSHER_SECRET &&
      process.env.PUSHER_CLUSTER
  );
}

function getPusherServer(): Pusher | null {
  if (!pusherConfigured()) return null;
  if (!_pusherServer) {
    _pusherServer = new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.PUSHER_CLUSTER!,
      useTLS: true,
    });
  }
  return _pusherServer;
}

export const pusherServer = {
  async trigger(channel: string | string[], event: string, data: unknown) {
    const p = getPusherServer();
    if (!p) return;
    try {
      await p.trigger(channel, event, data);
    } catch (err) {
      console.warn("[pusher] trigger failed:", err);
    }
  },
};

let pusherClient: PusherClient | null = null;

export function getPusherClient(): PusherClient | null {
  if (typeof window === "undefined") return null;
  if (!process.env.NEXT_PUBLIC_PUSHER_KEY || !process.env.NEXT_PUBLIC_PUSHER_CLUSTER) {
    return null;
  }
  if (!pusherClient) {
    pusherClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    });
  }
  return pusherClient;
}

// Event types
export const PUSHER_EVENTS = {
  NEW_POST: "new-post",
  NEW_COMMENT: "new-comment",
  VOTE_UPDATE: "vote-update",
  POST_DELETED: "post-deleted",
} as const;

export const PUSHER_CHANNELS = {
  FEED: "feed",
  bowl: (slug: string) => `bowl-${slug}`,
  post: (id: string) => `post-${id}`,
} as const;
