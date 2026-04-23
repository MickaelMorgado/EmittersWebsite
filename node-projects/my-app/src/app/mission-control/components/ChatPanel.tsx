"use client";

import { useState, useEffect, useRef } from "react";
import { AgentSession, ChatMessage } from "../types";
import { MessageSquare, Send, Loader2, Bot, User } from "lucide-react";

interface ChatPanelProps {
  agent: AgentSession | null;
  onRefresh: () => void;
}

export function ChatPanel({ agent, onRefresh }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (agent) {
      loadHistory();
    } else {
      setMessages([]);
    }
  }, [agent?.sessionKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadHistory = async () => {
    if (!agent) return;
    
    setIsLoading(true);
    try {
      const response = await fetch("/api/openclaw/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "history",
          sessionKey: agent.sessionKey,
          limit: 50,
        }),
      });

      const data = await response.json();
      
      if (data.content) {
        const parsed = parseMessages(data.content);
        setMessages(parsed);
      }
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const parseMessages = (content: string): ChatMessage[] => {
    const messages: ChatMessage[] = [];
    
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      const userMatch = content.match(/User:\s*([\s\S]*?)(?=Assistant:|$)/g);
      const assistantMatch = content.match(/Assistant:\s*([\s\S]*?)(?=User:|$)/g);
      
      if (userMatch) {
        userMatch.forEach((m) => {
          messages.push({
            role: "user",
            content: m.replace(/User:\s*/, "").trim(),
            timestamp: new Date().toISOString(),
          });
        });
      }
      if (assistantMatch) {
        assistantMatch.forEach((m) => {
          messages.push({
            role: "assistant",
            content: m.replace(/Assistant:\s*/, "").trim(),
            timestamp: new Date().toISOString(),
          });
        });
      }
    }
    
    return messages;
  };

  const handleSend = async () => {
    if (!input.trim() || !agent) return;

    const userMessage = input.trim();
    setInput("");
    setIsSending(true);

    try {
      const response = await fetch("/api/openclaw/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          sessionKey: agent.sessionKey,
          message: userMessage,
        }),
      });

      if (response.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "user", content: userMessage, timestamp: new Date().toISOString() },
        ]);
        setTimeout(loadHistory, 1000);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!agent) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 p-8 text-center">
        <MessageSquare className="h-12 w-12 text-white/20" />
        <h3 className="mt-4 text-lg font-medium text-white">No Agent Selected</h3>
        <p className="mt-2 text-sm text-white/50">
          Select an agent from the list to view its chat history
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-white/10 bg-white/5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 p-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-cyan-400" />
          <h3 className="font-medium text-white">
            {agent.label || agent.agentId}
          </h3>
        </div>
        <button
          onClick={loadHistory}
          disabled={isLoading}
          className="rounded-lg px-3 py-1.5 text-sm text-white/60 hover:bg-white/10 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && !isLoading && (
          <p className="text-center text-sm text-white/40">No messages yet</p>
        )}
        
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
              msg.role === "user" ? "bg-cyan-500/20" : "bg-purple-500/20"
            }`}>
              {msg.role === "user" ? (
                <User className="h-3 w-3 text-cyan-400" />
              ) : (
                <Bot className="h-3 w-3 text-purple-400" />
              )}
            </div>
            <div className={`max-w-[80%] rounded-lg p-3 ${
              msg.role === "user" 
                ? "bg-cyan-500/10 border border-cyan-500/20" 
                : "bg-white/5 border border-white/10"
            }`}>
              <p className="text-sm text-white/90 whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/10 p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Send a message..."
            disabled={isSending || agent.status !== "running"}
            className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isSending || agent.status !== "running"}
            className="rounded-lg bg-cyan-500/20 p-2 text-cyan-400 hover:bg-cyan-500/30 disabled:opacity-50"
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
