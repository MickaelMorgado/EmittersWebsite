# Mission Control

AI Agent management dashboard for OpenClaw. Monitor and control spawned AI agents in real-time.

## Features

- Real-time agent monitoring with 3-second polling
- Spawn new subagents with model selection (Haiku/Sonnet/Opus)
- View agent chat history and send messages
- Kill running agents
- Stats panel with model distribution
- Connection status indicator

## Tech Stack

- React 19 / Next.js 15
- Tailwind CSS
- OpenClaw Gateway API proxy

## Environment Variables

```
NEXT_PUBLIC_OPENCLAW_GATEWAY_URL=http://127.0.0.1:18789
```

## API Routes

- `/api/openclaw/sessions` - List agents
- `/api/openclaw/spawn` - Create agent
- `/api/openclaw/chat` - History & messages
- `/api/openclaw/delete` - Kill agent

## Access

`/mission-control`

## Version History

- **0.1.0** - Initial release
