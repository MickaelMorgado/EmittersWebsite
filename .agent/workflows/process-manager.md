---
description: Agent workflow for running, monitoring, and managing project processes
trigger: Start development servers, monitor for crashes, reboot on error resolution
---

# Process Manager Agent Workflow

## Purpose

Manage development and production processes:
1. Start/stop project servers
2. Monitor for crashes and errors
3. Auto-restart when errors are resolved
4. Report issues requiring user intervention

## Managed Projects

| Project | Start Command | Port | Type |
|---------|---------------|------|------|
| my-app | `npm run dev` | 3000 | Next.js dev |
| my-app (prod) | `npm run start` | 3000 | Next.js prod |
| tiktok-backend | `npm start` | 3001 | Node server |

## Workflow Steps

### Step 1: Check Current State

```bash
# Check if processes are running
# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Or check via tasklist
tasklist | findstr node
```

### Step 2: Start Processes

```bash
# my-app (from project root)
cd node-projects/my-app
npm run dev

# tiktok-backend (from project root)
cd node-projects/tiktok-backend
npm start
```

### Step 3: Monitor for Errors

Watch for common error patterns:

| Error Type | Pattern | Action |
|------------|---------|--------|
| Port in use | `EADDRINUSE` | Kill existing process, restart |
| Module not found | `Cannot find module` | Ask user to run npm install |
| Build error | `Failed to compile` | Report to user, wait for fix |
| Runtime crash | `FATAL` / `SIGSEGV` | Auto-restart, log incident |
| Memory leak | `JavaScript heap out of memory` | Report, suggest restart |
| TypeScript error | `Type error:` | Report to user, wait for fix |

### Step 4: Auto-Restart Logic

```
IF process crashes AND crash_count < 3:
  Log error
  Wait 5 seconds
  Restart process
  Increment crash_count
  
IF crash_count >= 3:
  Report to user: "Process X crashed 3 times. Last error: [error]"
  Wait for user intervention
  Reset crash_count on manual restart

IF error reported by another agent as resolved:
  Restart affected process
  Log: "Restarted after error resolution"
```

### Step 5: User Interaction Points

**ASK USER when:**
- NPM packages need installation
- Build fails due to code errors
- Process crashes 3+ times
- Memory issues detected
- Configuration changes needed

**AUTO-HANDLE:**
- Port conflicts (kill and restart)
- Clean crashes (restart up to 3 times)
- Error resolution by other agents

## Commands Reference

### Start All (Dev)
```bash
cd D:\EmittersWebsite\EmittersWebsite\node-projects\my-app && npm run dev
cd D:\EmittersWebsite\EmittersWebsite\node-projects\tiktok-backend && npm start
```

### Kill Process on Port (Windows)
```bash
# Find PID on port 3000
netstat -ano | findstr :3000
# Kill by PID
taskkill /PID <pid> /F
```

### Check Process Health
```bash
# Ping endpoints
curl http://localhost:3000
curl http://localhost:3001

# Check if responding
```

## Status Report Format

```
## Process Status Report

### Running
| Project | PID | Port | Status | Uptime |
|---------|-----|------|--------|--------|
| my-app | 12345 | 3000 | ✅ Healthy | 2h 15m |
| tiktok-backend | 12346 | 3001 | ✅ Healthy | 1h 30m |

### Stopped
| Project | Reason | Last Error |
|---------|--------|------------|
| - | - | - |

### Crashed (Auto-restarted)
| Project | Crash Count | Last Error |
|---------|-------------|------------|
| my-app | 1 | ECONNRESET |

### Needs Attention
| Project | Issue | Suggested Action |
|---------|-------|------------------|
| - | - | - |
```

## Integration with Other Agents

### Error Resolution Flow
```
1. Explore agent investigates error
2. Fix applied by general agent
3. Process manager receives signal: "Error resolved in [project]"
4. Process manager restarts affected process
5. Process manager confirms service restored
```

### Signal Format
When another agent resolves an error:
```
[PROCESS-MANAGER] Error resolved: my-app TypeScript error fixed
[PROCESS-MANAGER] Action: Restart my-app
```

## Error Resolution Tracking

Log file: `.agent/logs/process-errors.log`

```
[2026-02-22 10:30:15] my-app crashed: ECONNRESET
[2026-02-22 10:30:20] my-app restarted (attempt 1)
[2026-02-22 10:45:00] my-app crashed: ECONNRESET
[2026-02-22 10:45:05] my-app restarted (attempt 2)
[2026-02-22 10:50:00] tiktok-backend started
```

## Pre-flight Checks

Before starting any process:

1. Check if port is available
2. Verify node_modules exists (run `npm install` if missing)
3. Check for .env file if required
4. Verify Node version compatibility

## Quick Commands

| Action | Command |
|--------|---------|
| Start my-app | `cd node-projects/my-app && npm run dev` |
| Start tiktok-backend | `cd node-projects/tiktok-backend && npm start` |
| Check port 3000 | `netstat -ano \| findstr :3000` |
| Kill port 3000 | `for /f "tokens=5" %a in ('netstat -ano ^\| findstr :3000') do taskkill /PID %a /F` |
| Install deps my-app | `cd node-projects/my-app && npm install` |
| Install deps tiktok | `cd node-projects/tiktok-backend && npm install` |
