#!/usr/bin/env python3
"""
MT5 EA Automation & Validation Script
Cross-platform for Mac (Wine) and Windows
Automatically detects OS and MT5 installation path
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
        print(f"\n[✓] MT5 Automation initialized for {self.os_type}")

    def _find_mt5_path(self):
        """Auto-detect MT5 path based on OS"""
        print(f"\n[*] Detecting OS: {self.os_type}")

        if self.os_type == "Darwin":  # macOS
            return self._find_mt5_mac()
        elif self.os_type == "Windows":
            return self._find_mt5_windows()
        elif self.os_type == "Linux":
            return self._find_mt5_linux()
        else:
            raise Exception(f"Unsupported OS: {self.os_type}")

    def _find_mt5_mac(self):
        """Find MT5 path in Wine on Mac"""
        print("[*] Searching for MT5 in Wine environment...")

        # Check environment variable first
        env_path = os.environ.get('MT5_PATH')
        if env_path and Path(env_path).exists():
            print(f"[✓] Found via MT5_PATH environment variable")
            return env_path

        # Check standard Wine prefix
        wine_prefix = Path(os.path.expanduser("~/.wine/drive_c/Program Files/MetaTrader 5"))
        if wine_prefix.exists():
            print(f"[✓] Found at standard Wine location")
            return str(wine_prefix)

        # Check alternative locations
        alternatives = [
            ("Homebrew Wine", Path(os.path.expanduser("~/Library/Application Support/Wine/drive_c/Program Files/MetaTrader 5"))),
            ("Custom Wine (x86_64)", Path(os.path.expanduser("~/.wine-x86_64/drive_c/Program Files/MetaTrader 5"))),
            ("CrossOver", Path(os.path.expanduser("~/Library/Application Support/CrossOver/Bottles/Windows/drive_c/Program Files/MetaTrader 5"))),
        ]

        for alt_name, alt_path in alternatives:
            if alt_path.exists():
                print(f"[✓] Found at {alt_name} location")
                return str(alt_path)

        # Last resort: try to find terminal.exe
        print("[*] Searching filesystem for terminal.exe (this may take a moment)...")
        try:
            result = subprocess.run(
                ["find", os.path.expanduser("~"), "-name", "terminal.exe", "-type", "f"],
                capture_output=True, text=True, timeout=10
            )
            if result.stdout:
                found_path = Path(result.stdout.strip().split('\n')[0]).parent.parent
                print(f"[✓] Found via filesystem search")
                return str(found_path)
        except:
            pass

        raise Exception("""
        ╔════════════════════════════════════════════════════════╗
        ║         MT5 Installation Not Found on Mac              ║
        ╠════════════════════════════════════════════════════════╣
        ║                                                        ║
        ║ Step 1: Find your MT5 installation:                   ║
        ║   find ~/ -name "terminal.exe" -type f 2>/dev/null    ║
        ║                                                        ║
        ║ Step 2: Set environment variable in ~/.zprofile:      ║
        ║   export MT5_PATH="/path/to/MetaTrader 5"             ║
        ║                                                        ║
        ║ Step 3: Reload shell:                                 ║
        ║   source ~/.zprofile                                  ║
        ║                                                        ║
        ║ Step 4: Run this script again                         ║
        ║                                                        ║
        ╚════════════════════════════════════════════════════════╝
        """)

    def _find_mt5_windows(self):
        """Find MT5 path on Windows"""
        print("[*] Searching for MT5 on Windows...")

        # Check environment variable
        env_path = os.environ.get('MT5_PATH')
        if env_path and Path(env_path).exists():
            print(f"[✓] Found via MT5_PATH environment variable")
            return env_path

        # Check standard location
        standard_paths = [
            "C:\\Program Files\\MetaTrader 5",
            "C:\\Program Files (x86)\\MetaTrader 5",
        ]

        for path in standard_paths:
            if Path(path).exists():
                print(f"[✓] Found at standard Windows location")
                return path

        raise Exception("""
        ╔════════════════════════════════════════════════════════╗
        ║      MT5 Installation Not Found on Windows             ║
        ╠════════════════════════════════════════════════════════╣
        ║                                                        ║
        ║ Step 1: Set environment variable (as Administrator):  ║
        ║   MT5_PATH=C:\\Program Files\\MetaTrader 5            ║
        ║                                                        ║
        ║ Step 2: Restart PowerShell                            ║
        ║                                                        ║
        ║ Step 3: Run this script again                         ║
        ║                                                        ║
        ╚════════════════════════════════════════════════════════╝
        """)

    def _find_mt5_linux(self):
        """Find MT5 path on Linux (Wine)"""
        return self._find_mt5_mac()  # Same as Mac

    def export_ea(self, ea_code_path, dest_folder=None):
        """Export EA code to MT5 Experts folder"""
        if dest_folder is None:
            dest_folder = Path(self.mt5_path) / "MQL5" / "Experts" / "Advisors"
        else:
            dest_folder = Path(dest_folder)

        dest_folder.mkdir(parents=True, exist_ok=True)
        dest_path = dest_folder / self.ea_name

        print(f"\n[*] Exporting EA...")
        print(f"    Source: {ea_code_path}")
        print(f"    Destination: {dest_path}")

        try:
            shutil.copy(ea_code_path, dest_path)
            print(f"[✓] EA exported successfully!")
            return str(dest_path)
        except Exception as e:
            print(f"[-] Export failed: {e}")
            raise

    def get_expert_path(self):
        """Get path to Experts folder"""
        return Path(self.mt5_path) / "MQL5" / "Experts" / "Advisors"

    def get_history_path(self, broker="ICMarkets"):
        """Get path to backtest history data"""
        return Path(self.mt5_path) / "history" / broker

    def get_tester_results_path(self):
        """Get path to backtest results"""
        return Path(self.mt5_path) / "tester"

    def launch_mt5(self):
        """Launch MT5 terminal"""
        print(f"\n[*] Launching MT5...")

        try:
            if self.os_type == "Darwin":
                terminal_path = Path(self.mt5_path) / "terminal.exe"
                subprocess.Popen(["wine", str(terminal_path)])
            else:
                terminal_path = Path(self.mt5_path) / "terminal.exe"
                subprocess.Popen([str(terminal_path)])

            print("[✓] MT5 launched!")
            print("\n[*] Manual steps:")
            print("    1. Go to View → Strategy Tester (Ctrl+R)")
            print("    2. Select Expert: GeneratedEA.mq5")
            print("    3. Symbol: EURUSD")
            print("    4. Period: M15")
            print("    5. Date Range: 2026.04.01 to 2026.05.06")
            print("    6. Click 'Start'")

        except Exception as e:
            print(f"[-] Failed to launch MT5: {e}")

    def print_system_info(self):
        """Print detailed system information"""
        print("\n" + "="*70)
        print(" "*15 + "MT5 AUTOMATION - SYSTEM INFORMATION")
        print("="*70)
        print(f"\nOperating System:    {self.os_type}")
        print(f"MT5 Root Path:       {self.mt5_path}")

        experts_path = self.get_expert_path()
        print(f"\nKey Folders:")
        print(f"  Experts:           {experts_path}")
        print(f"  History:           {self.get_history_path()}")
        print(f"  Results:           {self.get_tester_results_path()}")

        # Check folder accessibility
        print(f"\nFolder Accessibility:")
        print(f"  Experts:           {'✓ OK' if experts_path.exists() else '✗ NOT FOUND'}")
        print(f"  History:           {'✓ OK' if self.get_history_path().exists() else '✗ NOT FOUND'}")
        print(f"  Results:           {'✓ OK' if self.get_tester_results_path().exists() else '✗ NOT FOUND'}")

        print("\n" + "="*70 + "\n")

    def save_config(self):
        """Save configuration to JSON for future use"""
        config = {
            "os": self.os_type,
            "mt5_path": str(self.mt5_path),
            "experts_path": str(self.get_expert_path()),
            "history_path": str(self.get_history_path()),
            "results_path": str(self.get_tester_results_path()),
            "timestamp": self.timestamp
        }

        config_file = Path.home() / ".mt5_automation_config.json"
        with open(config_file, 'w') as f:
            json.dump(config, f, indent=2)

        print(f"[✓] Configuration saved to: {config_file}")
        return config

# Main execution
if __name__ == "__main__":
    try:
        # Initialize automation
        automation = MT5Automation()

        # Print system info
        automation.print_system_info()

        # Save configuration
        config = automation.save_config()

        # Print next steps
        print("[*] Next Steps:")
        print("    1. Place your GeneratedEA.mq5 in the Experts folder")
        print("    2. Or use: automation.export_ea('/path/to/GeneratedEA.mq5')")
        print("    3. Then run: automation.launch_mt5()")
        print("    4. Run backtest manually in MT5 Strategy Tester")

    except Exception as e:
        print(f"\n[-] Error: {e}", file=sys.stderr)
        sys.exit(1)
