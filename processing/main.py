"""
Main entry point for DXF processing pipeline with intelligent layout
"""
import argparse
import json
import sys
from pathlib import Path

# Import processing modules
from dxf_parser import parse_dxf
from geometry import detect_geometry
from mesh_generator import generate_mesh
from gltf_exporter import export_gltf
from room_classifier import detect_rooms, classify_rooms
from furniture_placer import generate_layout, validate_layout, optimize_layout


def process_dxf(input_path, output_dir, project_id):
    """
    Main processing pipeline with intelligent layout:
    1. Parse DXF
    2. Detect geometry (walls, doors, windows, rooms)
    3. Classify rooms by type
    4. Generate intelligent furniture layout
    5. Validate and optimize layout
    6. Generate 3D mesh
    7. Export GLTF + layout JSON
    """
    try:
        input_path = Path(input_path)
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        print(f"📄 Parsing DXF: {input_path}", flush=True)
        
        # Step 1: Parse DXF
        dxf_data = parse_dxf(str(input_path))
        
        print(f"🔍 Detecting geometry...", flush=True)
        
        # Step 2: Detect geometry
        geometry = detect_geometry(dxf_data)
        
        print(f"🏠 Detecting rooms...", flush=True)
        
        # Step 3: Detect rooms from walls
        walls = geometry.get('walls', [])
        rooms = detect_rooms(walls)
        
        print(f"📊 Classifying rooms...", flush=True)
        
        # Step 4: Classify rooms
        classified_rooms = classify_rooms(rooms)
        
        print(f"🪑 Generating intelligent layout...", flush=True)
        
        # Step 5: Generate furniture layout
        layout = generate_layout(classified_rooms)
        
        print(f"✅ Validating layout...", flush=True)
        
        # Step 6: Validate and optimize
        layout = validate_layout(layout, classified_rooms)
        layout = optimize_layout(layout)
        
        print(f"🏗️  Generating mesh...", flush=True)
        
        # Step 7: Generate mesh (includes geometry + suggested furniture)
        mesh = generate_mesh(geometry)
        
        print(f"💾 Exporting GLTF and layout...", flush=True)
        
        # Step 8a: Export GLTF
        gltf_path = output_dir / f"{project_id}.glb"
        export_gltf(mesh, str(gltf_path))
        
        # Step 8b: Export layout as JSON
        layout_data = {
            "projectId": project_id,
            "rooms": classified_rooms,
            "suggestedLayout": layout,
            "statistics": {
                "roomCount": len(classified_rooms),
                "furnitureCount": len(layout),
                "roomTypes": _count_room_types(classified_rooms)
            }
        }
        
        layout_path = output_dir / f"{project_id}_layout.json"
        with open(layout_path, 'w') as f:
            json.dump(layout_data, f, indent=2)
        
        result = {
            "projectId": project_id,
            "gltfPath": str(gltf_path),
            "layoutPath": str(layout_path),
            "geometry": {
                "walls": len(geometry.get("walls", [])),
                "doors": len(geometry.get("doors", [])),
                "windows": len(geometry.get("windows", []))
            },
            "rooms": {
                "count": len(classified_rooms),
                "types": _count_room_types(classified_rooms)
            },
            "layout": {
                "suggestedFurnitureCount": len(layout),
                "withCollisions": sum(1 for obj in layout if obj.get('_collision')),
                "outOfBounds": sum(1 for obj in layout if obj.get('_warning'))
            },
            "status": "success"
        }
        
        print(json.dumps(result), flush=True)
        return result
        
    except Exception as e:
        print(f"❌ Error: {str(e)}", flush=True, file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        raise


def _count_room_types(rooms):
    """Count rooms by type"""
    counts = {}
    for room in rooms:
        room_type = room.get('type', 'unknown')
        counts[room_type] = counts.get(room_type, 0) + 1
    return counts


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Process DXF files to 3D GLTF")
    parser.add_argument("--input", required=True, help="Input DXF file path")
    parser.add_argument("--output", required=True, help="Output directory")
    parser.add_argument("--project-id", required=True, help="Project ID")
    
    args = parser.parse_args()
    
    process_dxf(args.input, args.output, args.project_id)
