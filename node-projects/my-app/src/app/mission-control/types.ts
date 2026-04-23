export interface AgentSession {
  sessionKey: string;
  agentId: string;
  status: "running" | "completed" | "archived" | "error";
  createdAt: string;
  updatedAt: string;
  label?: string;
  model?: string;
  parentSessionKey?: string;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

export interface SpawnAgentParams {
  agentId?: string;
  task: string;
  model?: string;
  thinking?: boolean;
  thread?: boolean;
  mode?: "run" | "session";
  runTimeoutSeconds?: number;
  label?: string;
}

export interface OpenClawResponse {
  content?: string;
  results?: unknown;
  error?: string;
}
