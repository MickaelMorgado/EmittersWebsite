/**
 * Agent status enum — extracted from agents-status route file because
 * Next.js route files reject non-HTTP exports (breaks tsc + build).
 * Server-side only; the frontend uses its own AgentStatus type.
 */
export enum AgentStatusEnum {
  GREEN = 'APPROVED',    // Agent approved/ready
  YELLOW = 'ANALYZING',  // Agent has data but not approved
  GRAY = 'OFFLINE',      // No agent data yet
}
