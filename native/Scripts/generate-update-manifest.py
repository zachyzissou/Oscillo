#!/usr/bin/env python3
import argparse
import json
from datetime import datetime, timezone
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate Oscillo native update manifest.")
    parser.add_argument("--version", required=True)
    parser.add_argument("--tag", required=True)
    parser.add_argument("--download-url", required=True)
    parser.add_argument("--release-url", required=True)
    parser.add_argument("--sha256", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    payload = {
        "platform": "macos",
        "version": args.version,
        "tag": args.tag,
        "minimumSystemVersion": "14.0",
        "publishedAt": datetime.now(timezone.utc).isoformat(),
        "downloadURL": args.download_url,
        "releaseURL": args.release_url,
        "sha256": args.sha256,
    }

    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
