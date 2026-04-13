"""
DXF file parser using ezdxf
"""
import ezdxf
from pathlib import Path


def parse_dxf(dxf_path):
    """
    Parse DXF file and extract entities
    Returns: {
        'blocks': [],
        'lines': [],
        'polylines': [],
        'circles': [],
        'arcs': [],
        'text': []
    }
    """
    try:
        dxf = ezdxf.readfile(dxf_path)
    except ezdxf.DXFStructureError:
        print(f"Error reading DXF file: corrupted file")
        raise
    
    # Get model space
    mspace = dxf.modelspace()
    
    data = {
        'blocks': [],
        'lines': [],
        'polylines': [],
        'circles': [],
        'arcs': [],
        'text': [],
        'bounds': get_bounds(mspace),
        'layers': list(dxf.layers)
    }
    
    # Extract entities
    for entity in mspace.query():
        entity_type = entity.dxftype()
        
        if entity_type == 'INSERT':  # BlockReference
            data['blocks'].append({
                'type': 'block',
                'name': entity.dxf.name,
                'x': entity.dxf.insert[0],
                'y': entity.dxf.insert[1],
                'z': entity.dxf.insert[2],
                'rotation': entity.dxf.rotation
            })
        
        elif entity_type == 'LINE':
            data['lines'].append({
                'start': entity.dxf.start[:2],
                'end': entity.dxf.end[:2],
                'thickness': entity.dxf.thickness or 0,
                'layer': entity.dxf.layer
            })
        
        elif entity_type == 'LWPOLYLINE':
            points = [(p[0], p[1]) for p in entity.get_points()]
            data['polylines'].append({
                'points': points,
                'closed': entity.dxf.flags & 1,
                'layer': entity.dxf.layer,
                'thickness': entity.dxf.thickness or 0
            })
        
        elif entity_type == 'CIRCLE':
            data['circles'].append({
                'center': entity.dxf.center[:2],
                'radius': entity.dxf.radius,
                'layer': entity.dxf.layer
            })
        
        elif entity_type == 'ARC':
            data['arcs'].append({
                'center': entity.dxf.center[:2],
                'radius': entity.dxf.radius,
                'start_angle': entity.dxf.start_angle,
                'end_angle': entity.dxf.end_angle,
                'layer': entity.dxf.layer
            })
        
        elif entity_type == 'TEXT':
            data['text'].append({
                'text': entity.dxf.text,
                'position': entity.dxf.insert[:2],
                'height': entity.dxf.height,
                'layer': entity.dxf.layer
            })
    
    return data


def get_bounds(mspace):
    """Get extents of all entities"""
    if len(mspace) == 0:
        return {'min': [0, 0], 'max': [100, 100]}
    
    extent = mspace.extents
    return {
        'min': [extent[0][0], extent[0][1]],
        'max': [extent[1][0], extent[1][1]]
    }
