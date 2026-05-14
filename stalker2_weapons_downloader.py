#!/usr/bin/env python3
"""
Stalker 2 Weapons Image Downloader
Downloads all weapon images from the Stalker 2 fextralife wiki
Saves them to public/assets/stalker-weapons/ with slugified filenames
"""

import os
import re
import time
from pathlib import Path
from urllib.parse import urljoin, urlparse
from typing import List, Dict, Tuple

import requests
from bs4 import BeautifulSoup


class Stalker2WeaponsDownloader:
    BASE_URL = "https://stalker2.wiki.fextralife.com"
    OUTPUT_DIR = Path("node-projects/my-app/public/assets/stalker-weapons")

    WEAPON_CATEGORIES = [
        ("Pistols", "/Pistols"),
        ("SMGs", "/SMGs"),
        ("Assault Rifles", "/Assault+Rifles"),
        ("Sniper Rifles", "/Sniper+Rifles"),
        ("Shotguns", "/Shotguns"),
        ("Machine Guns", "/Machine+Guns"),
        ("Special Weapons", "/Special+Weapons"),
        ("Launchers", "/Launchers"),
    ]

    def __init__(self, verify_ssl: bool = True, timeout: int = 10):
        self.session = requests.Session()
        self.session.headers.update(
            {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
        )
        self.verify_ssl = verify_ssl
        self.timeout = timeout
        self.downloaded_images: Dict[str, str] = {}
        self.failed_downloads: List[Tuple[str, str]] = []

    def slugify(self, text: str) -> str:
        text = text.lower()
        text = re.sub(r"[\s_]+", "-", text)
        text = re.sub(r"[^\w\-]", "", text)
        text = re.sub(r"-+", "-", text)
        text = text.strip("-")
        return text

    def fetch_page(self, url: str):
        try:
            response = self.session.get(
                url, verify=self.verify_ssl, timeout=self.timeout
            )
            response.raise_for_status()
            return response
        except requests.RequestException as e:
            print(f"[!] Error fetching {url}: {e}")
            return None

    def extract_weapons_from_category(self, category_url: str) -> List[Dict]:
        response = self.fetch_page(category_url)
        if not response:
            return []

        soup = BeautifulSoup(response.content, "html.parser")
        weapons = []

        # Look for h4 or h3 headings with weapon links - pattern: #### [weapon](/weapon-link)
        for heading in soup.find_all(["h4", "h3"]):
            link = heading.find("a")
            if not link or not link.get("href"):
                continue

            weapon_name = link.get_text(strip=True)
            weapon_link = link.get("href", "")

            # Skip non-weapon links (like comparison table, gallery)
            if weapon_link.startswith("/"):
                # Skip links that are categories, not weapons
                if (
                    "+" in weapon_link
                    or "Comparison" in weapon_name
                    or "Gallery" in weapon_name
                ):
                    continue

                # Construct image URL from weapon name
                # Pattern: /file/Stalker-2/weaponname-stalker2.png
                img_filename = self.slugify(weapon_name) + "-stalker2.png"
                image_url = f"{self.BASE_URL}/file/Stalker-2/{img_filename}"

                if weapon_name and len(weapon_name) > 1:
                    weapons.append({"name": weapon_name, "image_url": image_url})

        # Alternative: look for divs with weapon info
        for div in soup.find_all("div"):
            link = div.find("a")
            if not link or not link.get("href"):
                continue

            href = link.get("href", "")
            # Check if it's a weapon link (single word, no +)
            if "/" in href and "+" not in href and "Comparison" not in link.get_text():
                weapon_name = link.get_text(strip=True)
                if weapon_name and len(weapon_name) > 1:
                    img_filename = self.slugify(weapon_name) + "-stalker2.png"
                    image_url = f"{self.BASE_URL}/file/Stalker-2/{img_filename}"

                    # Check if we already have it
                    if not any(w["name"] == weapon_name for w in weapons):
                        weapons.append({"name": weapon_name, "image_url": image_url})

        # Deduplicate
        seen = set()
        unique = []
        for w in weapons:
            if w["name"] not in seen:
                seen.add(w["name"])
                unique.append(w)
        return unique

    def download_image(self, image_url: str, filename: str) -> bool:
        try:
            response = self.session.get(
                image_url, verify=self.verify_ssl, timeout=self.timeout, stream=True
            )
            response.raise_for_status()

            self.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
            filepath = self.OUTPUT_DIR / filename

            with open(filepath, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)

            file_size = os.path.getsize(filepath)
            print(f"    [+] Downloaded: {filename} ({file_size:,} bytes)")
            return True

        except requests.RequestException as e:
            print(f"    [!] Error downloading {filename}: {e}")
            self.failed_downloads.append((filename, str(e)))
            return False

    def download_all_weapons(self):
        print("[+] Stalker 2 Weapons Downloader")
        print("=" * 50)

        total_weapons = 0
        total_downloaded = 0

        for category_name, category_url_path in self.WEAPON_CATEGORIES:
            category_url = f"{self.BASE_URL}{category_url_path}"
            print(f"[*] Processing: {category_name}")
            print(f"    URL: {category_url}")

            weapons = self.extract_weapons_from_category(category_url)
            print(f"    Found {len(weapons)} weapons")

            for weapon in weapons:
                weapon_name = weapon.get("name", "Unknown")
                image_url = weapon.get("image_url", "")

                if not image_url:
                    print(f"    [!] No image URL for: {weapon_name}")
                    continue

                total_weapons += 1
                slug_name = self.slugify(weapon_name)
                filename = f"{slug_name}.png"

                if filename in self.downloaded_images:
                    print(f"    [i] Already downloaded: {filename}")
                    continue

                if self.download_image(image_url, filename):
                    self.downloaded_images[filename] = weapon_name
                    total_downloaded += 1
                    time.sleep(0.5)

        print("\n" + "=" * 50)
        print("[*] Download Summary")
        print(f"    Total weapons found: {total_weapons}")
        print(f"    Successfully downloaded: {total_downloaded}")
        print(f"    Failed downloads: {len(self.failed_downloads)}")
        print(f"    Output directory: {self.OUTPUT_DIR.resolve()}")

        if self.failed_downloads:
            print("\n[!] Failed downloads:")
            for filename, error in self.failed_downloads:
                print(f"    - {filename}: {error}")

        print("\n[+] Download complete!")


def main():
    downloader = Stalker2WeaponsDownloader()
    downloader.download_all_weapons()


if __name__ == "__main__":
    main()
