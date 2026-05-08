# MT5 EA Automation & Validation Guide

## Overview
Cross-platform script to automate MT5 EA testing and validation across:
- **Mac** (using Wine)
- **Windows** (native)

## Part 1: Path Detection & Setup

### Mac (Wine) Paths

**Common Wine Prefix Locations:**
```bash
# Standard Wine prefix (most common)
~/.wine/drive_c/Program Files/MetaTrader 5/

# Alternative Prefixes
~/.wine-[name]/drive_c/Program Files/MetaTrader 5/
~/Library/Application Support/Wine/drive_c/Program Files/MetaTrader 5/
```

**How to Find Your MT5 Wine Path:**
```bash
# Find terminal.exe (MT5 executable)
find ~/ -name "terminal.exe" -type f 2>/dev/null

# Find MQL5 folder
find ~/ -path "*/MQL5/Experts*" -type d 2>/dev/null

# Or check Wine prefixes
ls ~/.wine/drive_c/Program\ Files/
```

**Set Environment Variable (Add to ~/.zprofile or ~/.bash_profile):**
```bash
export MT5_WINE_PREFIX="$HOME/.wine"
export MT5_PATH="$MT5_WINE_PREFIX/drive_c/Program Files/MetaTrader 5"
```

### Windows Paths

**Standard Installation:**
```
C:\Program Files\MetaTrader 5\MQL5\Experts\Advisors\
```

**Environment Variable (Add to System):**
```
MT5_PATH = C:\Program Files\MetaTrader 5
```

**For Alternative Installations:**
```bash
# PowerShell - Find MT5
Get-ChildItem -Path "C:\Program Files*" -Recurse -Include "terminal.exe" 2>/dev/null
```

---

## Part 2: Key Folders & Files

| Component | Mac (Wine) | Windows |
|-----------|-----------|---------|
| **MT5 Root** | `~/.wine/drive_c/Program Files/MetaTrader 5` | `C:\Program Files\MetaTrader 5` |
| **Experts** | `$MT5_PATH/MQL5/Experts/Advisors/` | `C:\Program Files\MetaTrader 5\MQL5\Experts\Advisors\` |
| **Backtest Data** | `$MT5_PATH/history/[Broker]/` | `C:\Program Files\MetaTrader 5\history\[Broker]\` |
| **Results** | `$MT5_PATH/tester/` | `C:\Program Files\MetaTrader 5\tester\` |
| **Terminal.exe** | `wine ~/.wine/drive_c/Program\ Files/MetaTrader\ 5/terminal.exe` | `C:\Program Files\MetaTrader 5\terminal.exe` |

---

## Part 3: Python Automation Script

**File:** `ea_tester.py`

```python
#!/usr/bin/env python3
"""
MT5 EA Automation & Validation Script
Cross-platform for Mac (Wine) and Windows
"""

import os
import sys
import platform
import subprocess
import json
import shutil
from pathlib import Path
from datetime import datetime

class MT5Automation:
    def __init__(self):
        self.os_type = platform.system()
        self.mt5_path = self._find_mt5_path()
        self.ea_name = "GeneratedEA.mq5"
        self.timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
    def _find_mt5_path(self):
        """Auto-detect MT5 path based on OS"""
        print(f"[*] Detecting OS: {self.os_type}")
        
        if self.os_type == "Darwin":  # macOS
            return self._find_mt5_mac()
        elif self.os_type == "Windows":
            return self._find_mt5_windows()
        else:
            raise Exception(f"Unsupported OS: {self.os_type}")
    
    def _find_mt5_mac(self):
        """Find MT5 path in Wine on Mac"""
        print("[*] Looking for MT5 in Wine...")
        
        # Check environment variable first
        env_path = os.environ.get('MT5_PATH')
        if env_path and Path(env_path).exists():
            print(f"[+] Found via MT5_PATH: {env_path}")
            return env_path
        
        # Check standard Wine prefix
        wine_prefix = Path(os.path.expanduser("~/.wine/drive_c/Program Files/MetaTrader 5"))
        if wine_prefix.exists():
            print(f"[+] Found at: {wine_prefix}")
            return str(wine_prefix)
        
        # Check alternative locations
        alternatives = [
            Path(os.path.expanduser("~/Library/Application Support/Wine/drive_c/Program Files/MetaTrader 5")),
            Path(os.path.expanduser("~/.wine-x86_64/drive_c/Program Files/MetaTrader 5")),
        ]
        
        for alt_path in alternatives:
            if alt_path.exists():
                print(f"[+] Found at: {alt_path}")
                return str(alt_path)
        
        raise Exception("""
        Could not find MT5 installation!
        
        Try running:
        find ~/ -name "terminal.exe" -type f 2>/dev/null
        
        Then set: export MT5_PATH="/path/to/MetaTrader 5"
        """)
    
    def _find_mt5_windows(self):
        """Find MT5 path on Windows"""
        print("[*] Looking for MT5 on Windows...")
        
        # Check environment variable
        env_path = os.environ.get('MT5_PATH')
        if env_path and Path(env_path).exists():
            print(f"[+] Found via MT5_PATH: {env_path}")
            return env_path
        
        # Check standard location
        standard_path = Path("C:\\Program Files\\MetaTrader 5")
        if standard_path.exists():
            print(f"[+] Found at: {standard_path}")
            return str(standard_path)
        
        raise Exception("""
        Could not find MT5!
        
        Set environment variable:
        MT5_PATH=C:\\Program Files\\MetaTrader 5
        """)
    
    def export_ea(self, ea_code_path, dest_folder=None):
        """Export EA code to MT5 Experts folder"""
        if dest_folder is None:
            dest_folder = Path(self.mt5_path) / "MQL5" / "Experts" / "Advisors"
        else:
            dest_folder = Path(dest_folder)
        
        dest_folder.mkdir(parents=True, exist_ok=True)
        dest_path = dest_folder / self.ea_name
        
        print(f"[*] Exporting EA from: {ea_code_path}")
        print(f"[*] Destination: {dest_path}")
        
        shutil.copy(ea_code_path, dest_path)
        print(f"[+] EA exported successfully!")
        
        return str(dest_path)
    
    def run_backtest(self, symbol="EURUSD", timeframe="M15", from_date="2026.04.01", to_date="2026.05.06"):
        """Launch MT5 strategy tester"""
        print(f"\n[*] Launching MT5 Strategy Tester...")
        print(f"    Symbol: {symbol} | Timeframe: {timeframe}")
        print(f"    Period: {from_date} to {to_date}")
        
        if self.os_type == "Darwin":
            return self._run_backtest_mac(symbol, timeframe, from_date, to_date)
        else:
            return self._run_backtest_windows(symbol, timeframe, from_date, to_date)
    
    def _run_backtest_mac(self, symbol, timeframe, from_date, to_date):
        """Run MT5 backtest via Wine on Mac"""
        terminal_path = Path(self.mt5_path) / "terminal.exe"
        
        # MT5 backtesting parameters (approximate)
        cmd = [
            "wine",
            str(terminal_path),
            "/start",
            f"/symbol:{symbol}",
            f"/period:{timeframe}",
            f"/expert:{self.ea_name}",
        ]
        
        print(f"[*] Command: {' '.join(cmd)}")
        print("[!] NOTE: Wine MT5 backtesting may require manual UI interaction")
        print("[!] Consider using Visual Studio Code + MQL5 IDE instead")
        
        # This is a placeholder - actual backtesting via Wine is complex
        # User will need to run this manually in MT5 GUI
        return None
    
    def _run_backtest_windows(self, symbol, timeframe, from_date, to_date):
        """Run MT5 backtest on Windows"""
        terminal_path = Path(self.mt5_path) / "terminal.exe"
        
        if not terminal_path.exists():
            raise Exception(f"MT5 terminal not found at {terminal_path}")
        
        print(f"[*] Launching: {terminal_path}")
        
        # Windows MT5 command line
        try:
            subprocess.Popen([str(terminal_path)])
            print("[+] MT5 launched. Please run backtest manually:")
            print(f"    1. Symbol: {symbol}")
            print(f"    2. Period: {timeframe}")
            print(f"    3. Expert: {self.ea_name}")
            print(f"    4. Date Range: {from_date} to {to_date}")
        except Exception as e:
            print(f"[-] Error launching MT5: {e}")
    
    def get_expert_path(self):
        """Get path to Experts folder"""
        return Path(self.mt5_path) / "MQL5" / "Experts" / "Advisors"
    
    def get_history_path(self, broker="ICMarkets"):
        """Get path to backtest history data"""
        return Path(self.mt5_path) / "history" / broker
    
    def get_tester_results_path(self):
        """Get path to backtest results"""
        return Path(self.mt5_path) / "tester"
    
    def print_info(self):
        """Print system information"""
        print("\n" + "="*60)
        print("MT5 AUTOMATION - SYSTEM INFO")
        print("="*60)
        print(f"OS: {self.os_type}")
        print(f"MT5 Root: {self.mt5_path}")
        print(f"Experts Folder: {self.get_expert_path()}")
        print(f"History Folder: {self.get_history_path()}")
        print(f"Results Folder: {self.get_tester_results_path()}")
        print("="*60 + "\n")

# Usage Example
if __name__ == "__main__":
    try:
        automation = MT5Automation()
        automation.print_info()
        
        # Example: Export EA
        # automation.export_ea("/path/to/GeneratedEA.mq5")
        
        # Example: Launch backtest
        # automation.run_backtest()
        
    except Exception as e:
        print(f"[-] Error: {e}")
        sys.exit(1)
```

---

## Part 4: Setup Instructions

### Mac (Wine)

**1. Verify Wine Installation:**
```bash
wine --version
```

**2. Find MT5 Path:**
```bash
find ~/ -name "terminal.exe" -type f 2>/dev/null
```

**3. Set Environment Variable:**
```bash
# Add to ~/.zprofile
export MT5_PATH="$HOME/.wine/drive_c/Program Files/MetaTrader 5"
```

**4. Verify Path:**
```bash
ls "$MT5_PATH/MQL5/Experts/Advisors/"
```

### Windows

**1. Set Environment Variable:**
- Right-click **This PC** → Properties
- Advanced System Settings → Environment Variables
- New User Variable:
  - Name: `MT5_PATH`
  - Value: `C:\Program Files\MetaTrader 5`

**2. Verify in PowerShell:**
```powershell
$env:MT5_PATH
ls "$env:MT5_PATH\MQL5\Experts\Advisors\"
```

---

## Part 5: Running the Script

### Mac:
```bash
python3 ea_tester.py
```

### Windows (PowerShell):
```powershell
python ea_tester.py
```

---

## Part 6: Manual Backtest Workflow

Until full automation is complete:

1. **Export EA:**
   - Run: `python3 ea_tester.py`
   - EA copied to MT5 Experts folder

2. **Open MT5:**
   - Mac: `wine ~/.wine/drive_c/Program\ Files/MetaTrader\ 5/terminal.exe`
   - Windows: Click MT5 shortcut

3. **Run Backtest:**
   - View → Strategy Tester (Ctrl+R)
   - Select: GeneratedEA.mq5
   - Symbol: EURUSD, Period: M15
   - Date Range: 2026.04.01 to 2026.05.06
   - Click **Start**

4. **Export Results:**
   - Results → Copy to CSV/JSON
   - Compare with web app results

---

## Troubleshooting

| Issue | Mac | Windows |
|-------|-----|---------|
| MT5 not found | `find ~/ -name "terminal.exe"` | Check C:\Program Files |
| Wine errors | `wine --version`, reinstall Wine | N/A |
| EA not appearing | Check file permissions, restart MT5 | Check folder path |
| Backtest hangs | Relaunch Wine, check data files | Check data folder permissions |

---

## Next Steps

- [ ] Test path detection on both systems
- [ ] Implement result parsing (JSON/CSV)
- [ ] Add comparison logic (web vs MT5)
- [ ] Create automated report generation
