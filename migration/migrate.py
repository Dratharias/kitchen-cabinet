from __future__ import annotations
import argparse
import json
import sys
import tempfile
from pathlib import Path
from typing import Optional

from processors.metadata_extractor import MetadataExtractor
from processors.ingredients_parser import IngredientsParser
from processors.group_mapper import GroupMapper
from processors.steps_extractor import StepsExtractor
from processors.ingredient_detector import IngredientDetector
from processors.enricher import Enricher
from processors.payload_mapper import PayloadMapper
from processors.description_normalizer import DescriptionNormalizer

MAX_RETRIES = 3

def slugify(text: str) -> str:
    import re
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    text = text.strip('-')
    return re.sub(r'-+', '-', text)

def process_file(md_path: Path, forced_tag: Optional[str], output_dir: Path):
    print(f"\n[PHASE 0] Lecture: {md_path}")
    
    with open(md_path, 'r', encoding='utf-8') as f:
        md_text = f.read()
    
    work_dir = Path(tempfile.mkdtemp(prefix="migration_work_"))
    print(f"[WORK] Répertoire temporaire: {work_dir}")
    
    try:
        print("[PHASE 1] Extraction métadonnées")
        extractor = MetadataExtractor()
        meta = extractor.extract(md_text)
        (work_dir / "01_metadata.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2))

        # enrichir description/note directement après extraction
        enricher = Enricher(md_text=md_text)
        meta = enricher.enrich(meta)
        (work_dir / "01_metadata_enriched.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2))
        
        print("[PHASE 2] Parsing ingrédients bruts")
        ing_parser = IngredientsParser()
        raw_ing = ing_parser.parse(md_text)
        (work_dir / "02_ingredients_raw.json").write_text(json.dumps(raw_ing, ensure_ascii=False, indent=2))
        
        print("[PHASE 3] Mapping groupes (Mistral)")
        mapper = GroupMapper()
        groups = retry_mistral(lambda: mapper.map_groups(md_text, meta.get("title", "Untitled")))
        (work_dir / "03_groups.json").write_text(json.dumps(groups, ensure_ascii=False, indent=2))
        
        print("[PHASE 4] Extraction étapes")
        step_ext = StepsExtractor()
        raw_steps = step_ext.extract(md_text, groups)
        (work_dir / "04_steps_raw.json").write_text(json.dumps(raw_steps, ensure_ascii=False, indent=2))
        
        print("[PHASE 5] Détection ingrédient")
        detector = IngredientDetector()
        merged = detector.detect(raw_ing, raw_steps, groups)
        (work_dir / "05_merged_detected.json").write_text(json.dumps(merged, ensure_ascii=False, indent=2))

        # on ne passe plus merged complet dans mistral
        # enrichissement stylistique réservé aux champs textuels dans le payload
        
        print("[PHASE 6] Mapping payload")
        payload_mapper = PayloadMapper()
        payload = payload_mapper.map(meta, merged, forced_tag)
        (work_dir / "06_payload_mapped.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2))
        
        print("[PHASE 7] Normalisation description (Mistral)")
        normalizer = DescriptionNormalizer()
        final = retry_mistral(lambda: normalizer.normalize(payload))
        (work_dir / "07_payload_normalized.json").write_text(json.dumps(final, ensure_ascii=False, indent=2))
        
        slug = slugify(meta.get("title") or md_path.stem)
        output_path = output_dir / f"{slug}.json"
        output_path.write_text(json.dumps(final, ensure_ascii=False, indent=2))
        
        print(f"[SUCCESS] Fichier généré: {output_path}")
        
    except Exception as e:
        print(f"[ERROR] Échec: {e}", file=sys.stderr)
        raise
    finally:
        print(f"[CLEANUP] Nettoyage: {work_dir}")
        import shutil
        shutil.rmtree(work_dir, ignore_errors=True)

def retry_mistral(func, max_retries: int = MAX_RETRIES):
    import time
    for attempt in range(1, max_retries + 1):
        try:
            print(f"[TRY {attempt}/{max_retries}]")
            return func()
        except Exception as e:
            print(f"[WARN] Tentative {attempt} échouée: {e}")
            if attempt == max_retries:
                raise
            time.sleep(2 ** attempt)

def main():
    parser = argparse.ArgumentParser(description="Migration recettes Markdown vers JSON")
    parser.add_argument("-f", "--file", type=Path, help="Fichier .md unique")
    parser.add_argument("-d", "--dir", type=Path, help="Répertoire contenant des .md")
    parser.add_argument("--tag", type=str, help="Tag forcé à ajouter")
    
    args = parser.parse_args()
    
    output_dir = Path("migration")
    output_dir.mkdir(exist_ok=True)
    
    if args.file:
        if not args.file.exists():
            print(f"[ERROR] Fichier introuvable: {args.file}", file=sys.stderr)
            sys.exit(1)
        process_file(args.file, args.tag, output_dir)
    
    elif args.dir:
        if not args.dir.is_dir():
            print(f"[ERROR] Répertoire introuvable: {args.dir}", file=sys.stderr)
            sys.exit(1)
        
        md_files = list(args.dir.glob("*.md"))
        if not md_files:
            print(f"[WARN] Aucun fichier .md trouvé dans {args.dir}")
            return
        
        for md_file in md_files:
            try:
                process_file(md_file, args.tag, output_dir)
            except Exception as e:
                print(f"[ERROR] Échec sur {md_file}: {e}", file=sys.stderr)
    
    else:
        parser.print_help()
        sys.exit(1)

if __name__ == "__main__":
    main()
