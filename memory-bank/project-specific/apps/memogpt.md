# MemoGPT

AI-powered memo and prompt manager for storing, editing, and using AI prompts with integrated chat functionality.

## Features

- **Prompt Management**:
  - Create, edit, and delete custom AI prompts.
  - Save prompts with titles for easy identification.
  - Persistence using LocalStorage.
- **AI Chat Interface**:
  - Direct interaction with OpenAI's GPT models.
  - Markdown support for chat responses.
  - Message history tracking.
- **Text-to-Speech**:
  - Optional browser-based speech synthesis for AI replies.
- **UI/UX**:
  - Sidebar for quick access to saved prompts.
  - Modal-based editing.
  - Responsive design for mobile and desktop.

## Technical Details

- **Location**: `node-projects/my-app/src/app/memogpt/`
- **Frameworks/Libraries**:
  - `react-markdown` and `remark-gfm`: For rendering AI responses.
  - `lucide-react`: For icons.
  - `shadcn/ui`: For UI components (Dialog, Button, Textarea, Card, Input).
- **Persistence**: `localStorage` (keys: `ai-chat-prompts`, `ai-chat-history`).
- **Integration**: OpenAI API (using `NEXT_PUBLIC_OPENAI_API_KEY`).

## Dependencies

- `@/components/ui/` (Dialog, Card, etc.)
- `lucide-react`
- `react-markdown`
- `remark-gfm`
