import { useState, useEffect } from "react";

export function useSessionId() {
  const [sessionId, setSessionId] = useState<string>("");

  useEffect(() => {
    let id = localStorage.getItem("chat-session-id");
    if (!id) {
      id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("chat-session-id", id);
    }
    setSessionId(id);
  }, []);

  return sessionId;
}
