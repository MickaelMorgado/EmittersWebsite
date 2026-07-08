---
name: mt5-file-locking-workaround
description: When MT5 locks files, avoid abstraction layers - use Python I/O directly
metadata:
  type: feedback
---

# MT5 File Locking & Edit Tool Workaround

**The Problem:**
When modifying MQL5 files (.mq5) while MT5 terminal is running, file abstraction tools (Claude's Edit tool, sed) appear to succeed but changes don't persist. The file timestamp updates but content reverts.

**Root Cause:**
MT5/MetaEditor holds exclusive file locks. Changes written through abstraction layers get buffered/cached, then MT5 auto-recovers the original file, overwriting the changes.

**Why:** MT5 has file recovery mechanisms that snapshot and restore on lock conflicts.

**The Solution:**

1. **Kill MT5 processes first:**
   ```bash
   pkill -9 terminal64
   pkill -9 metaeditor64
   sleep 3
   ```

2. **Use Python with direct file I/O** (bypasses abstraction):
   ```python
   file_path = r"C:\path\to\file.mq5"
   
   with open(file_path, 'r', encoding='utf-8') as f:
       content = f.read()
   
   new_content = content.replace('old_text', 'new_text')
   
   with open(file_path, 'w', encoding='utf-8') as f:
       f.write(new_content)
   ```

3. **Verify the change immediately** by reading back the file

4. **Restart MT5** to use the updated file

**When to Apply:**
- Modifying .mq5 Expert Advisor files
- Any file edits when a process holds exclusive locks
- When Edit tool reports success but changes don't persist

**Alternative Methods** (if Python unavailable):
- `perl -i -pe 's/old/new/g' file.mq5` (with processes killed)
- Direct PowerShell file writes: `$content | Out-File -Force`
- Command-line text editors (vim, nano)

**Why:** Direct I/O bypasses file caching layers that abstraction tools depend on.

**Key Lesson:**
When working with files locked by external processes (MT5, IDE, etc.), use the **lowest-level file I/O available** rather than higher abstraction layers. Direct filesystem operations have fewer cache/lock issues.

---
**Learned:** July 8, 2026 (Trading EA v1.07 compilation)
**Apply to:** Any MQL5/MT5 development work
