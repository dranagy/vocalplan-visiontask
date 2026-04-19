"use client";

import { useEffect, useRef, useState } from "react";
import { Task } from "@/types";

export interface OnlineUser {
  userId: string;
  userName: string;
}

interface UseRealtimeSyncOptions {
  teamId: string | null;
  userId: string;
  userName: string;
  onTaskUpdate?: (task: Task) => void;
  onPresenceChange?: (users: OnlineUser[]) => void;
}

export function useRealtimeSync({
  teamId,
  userId,
  userName,
  onTaskUpdate,
  onPresenceChange,
}: UseRealtimeSyncOptions): { onlineUsers: OnlineUser[] } {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const esRef = useRef<EventSource | null>(null);
  // Keep latest callbacks in refs so the effect doesn't re-run when they change
  const onTaskUpdateRef = useRef(onTaskUpdate);
  const onPresenceChangeRef = useRef(onPresenceChange);
  useEffect(() => { onTaskUpdateRef.current = onTaskUpdate; });
  useEffect(() => { onPresenceChangeRef.current = onPresenceChange; });

  useEffect(() => {
    if (!teamId) {
      setOnlineUsers([]);
      return;
    }

    const url = `/api/realtime?teamId=${encodeURIComponent(teamId)}&userId=${encodeURIComponent(userId)}&userName=${encodeURIComponent(userName)}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "join") {
          setOnlineUsers((prev) => {
            if (prev.some((u) => u.userId === data.userId)) return prev;
            const updated = [...prev, { userId: data.userId, userName: data.userName }];
            onPresenceChangeRef.current?.(updated);
            return updated;
          });
        } else if (data.type === "leave") {
          setOnlineUsers((prev) => {
            const updated = prev.filter((u) => u.userId !== data.userId);
            onPresenceChangeRef.current?.(updated);
            return updated;
          });
        } else if (data.type === "connected") {
          // Own connection confirmed - add self
          setOnlineUsers((prev) => {
            if (prev.some((u) => u.userId === data.userId)) return prev;
            return [...prev, { userId: data.userId, userName: data.userName }];
          });
        } else if (data.type === "task_update" && data.payload) {
          onTaskUpdateRef.current?.(data.payload as Task);
        }
      } catch {
        // skip malformed events
      }
    };

    es.onerror = () => {
      // EventSource auto-reconnects on error
    };

    return () => {
      es.close();
      esRef.current = null;
      setOnlineUsers([]);
    };
  }, [teamId, userId, userName]);

  return { onlineUsers };
}
