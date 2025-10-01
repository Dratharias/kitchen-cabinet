import sys
from pathlib import Path
from .pipeline import RecipePipeline

if __name__ == "__main__":
    if len(sys.argv) < 3 or sys.argv[1] not in ["-f", "-d"]:
        print("Usage: python -m migration -f <markdown_file> | -d <markdown_dir>")
        sys.exit(1)

    work_dir = Path("output")
    pipeline = RecipePipeline(work_dir)

    if sys.argv[1] == "-f":
        md_file = Path(sys.argv[2])
        if not md_file.exists():
            print(f"File not found: {md_file}")
            sys.exit(1)

        md_text = md_file.read_text(encoding="utf-8")
        payload = pipeline.process(md_text)
        print(f"✓ Processed: {payload['payload']['1']['title']}")

    elif sys.argv[1] == "-d":
        md_dir = Path(sys.argv[2])
        if not md_dir.exists() or not md_dir.is_dir():
            print(f"Directory not found: {md_dir}")
            sys.exit(1)

        for md_file in md_dir.rglob("*.md"):
            print(f"Processing: {md_file}")
            md_text = md_file.read_text(encoding="utf-8")
            payload = pipeline.process(md_text)
            print(f"✓ Processed: {payload['payload']['1']['title']}")
