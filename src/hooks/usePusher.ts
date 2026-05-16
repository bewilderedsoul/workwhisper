// src/hooks/usePusher.ts
"use client";

import { useEffect, useRef } from "react";
import type { Channel } from "pusher-js";

export function usePusherChannel(
  channelName: string,
  events: Record<string, (data: unknown) => void>
) {
  const channelRef = useRef<Channel | null>(null);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_PUSHER_KEY) return;

    let mounted = true;

    const setup = async () => {
      const { getPusherClient } = await import("@/lib/realtime/pusher");
      if (!mounted) return;

      try {
        const pusher = getPusherClient();
        if (!pusher) return;
        const channel = pusher.subscribe(channelName);
        channelRef.current = channel;

        Object.entries(events).forEach(([event, handler]) => {
          channel.bind(event, handler);
        });
      } catch (err) {
        console.warn("Pusher subscription failed:", err);
      }
    };

    setup();

    return () => {
      mounted = false;
      if (channelRef.current) {
        channelRef.current.unbind_all();
        const { getPusherClient } = require("@/lib/realtime/pusher");
        try {
          getPusherClient()?.unsubscribe(channelName);
        } catch {}
        channelRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName]);
}
