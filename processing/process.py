"""
Compatibility entry point for the BullMQ worker.

The worker calls:
    python processing/process.py <filePath>

This wrapper keeps the existing processing pipeline intact and normalizes the
output filenames consumed by the web app.
"""
import json
import os
import shutil
import sys
from pathlib import Path

from main import process_dxf


def main():
    if len(sys.argv) < 2:
        raise SystemExit("Usage: python processing/process.py <filePath>")

    file_path = Path(sys.argv[1])
    project_id = os.environ.get("PROJECT_ID") or file_path.stem
    output_dir = Path(os.environ.get("OUTPUT_DIR", "outputs"))
    output_dir.mkdir(parents=True, exist_ok=True)

    try:
        result = process_dxf(str(file_path), str(output_dir), project_id)

        # Stable filenames make frontend loading predictable.
        gltf_source = Path(result.get("gltfPath", ""))
        layout_source = Path(result.get("layoutPath", ""))
        gltf_target = output_dir / "output.gltf"
        layout_target = output_dir / "layout.json"

        if gltf_source.exists() and gltf_source != gltf_target:
            shutil.copyfile(gltf_source, gltf_target)
        if layout_source.exists() and layout_source != layout_target:
            shutil.copyfile(layout_source, layout_target)

        result.update({
            "gltfPath": str(gltf_target),
            "layoutPath": str(layout_target),
            "status": "success"
        })
        print(json.dumps(result), flush=True)
    except Exception as error:
        print(f"Processing error: {error}", file=sys.stderr, flush=True)
        raise


if __name__ == "__main__":
    main()
