"""
Export mesh to GLTF/GLB format
"""
import trimesh


def export_gltf(mesh, output_path):
    """
    Export trimesh to GLTF/GLB format
    If output_path ends with .glb, exports as binary GLB
    Otherwise exports as GLTF with embedded buffers
    """
    if isinstance(mesh, list):
        # If list of meshes, merge them first
        mesh = trimesh.util.concatenate(mesh)
    
    # Ensure normals are computed
    mesh.process(merge_primitives=True)
    
    # Export
    if output_path.endswith('.glb'):
        mesh.export(output_path, file_type='glb')
    else:
        mesh.export(output_path, file_type='gltf')
    
    print(f"📦 Exported to: {output_path}")
    
    return output_path
