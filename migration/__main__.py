import sys
from pathlib import Path
from .pipeline import RecipePipeline

if __name__ == "__main__":
    if len(sys.argv) < 3 or sys.argv[1] != "-f":
        print("Usage: python -m migration -f <markdown_file>")
        sys.exit(1)
    
    md_file = Path(sys.argv[2])
    if not md_file.exists():
        print(f"File not found: {md_file}")
        sys.exit(1)
    
    work_dir = Path("output")
    pipeline = RecipePipeline(work_dir)
    
    md_text = md_file.read_text(encoding="utf-8")
    payload = pipeline.process(md_text)
    
    print(f"✓ Processed: {payload['payload']['1']['title']}")