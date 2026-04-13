"""
Room detection and classification
- Detect rooms using closed loops
- Classify room type (bedroom, living, kitchen)
- Calculate room properties (area, centroid, dimensions)
"""
import math
from shapely.geometry import Polygon, LineString, MultiLineString, box, Point
from shapely.ops import unary_union


def detect_rooms(walls, min_area=5.0):
    """
    Detect rooms from wall geometry using closed loops
    Returns list of room polygons with properties
    """
    rooms = []
    
    if not walls:
        return rooms
    
    # Build line network from walls
    lines = []
    for wall in walls:
        start = wall['start']
        end = wall['end']
        line = LineString([(start[0], start[1]), (end[0], end[1])])
        lines.append(line)
    
    # Merge lines into shapes
    if not lines:
        return rooms
    
    merged = unary_union(lines)
    
    # Extract polygons (closed loops)
    if hasattr(merged, 'geoms'):
        geometries = merged.geoms
    else:
        geometries = [merged] if merged.is_valid else []
    
    # Process each geometry
    for geom in geometries:
        if geom.geom_type == 'Polygon':
            polygons = [geom]
        elif geom.geom_type == 'MultiPolygon':
            polygons = list(geom.geoms)
        elif geom.geom_type == 'LineString' and geom.is_ring:
            polygons = [Polygon(geom.coords)]
        else:
            polygons = []
        
        for polygon in polygons:
            if polygon.area >= min_area:
                rooms.append(_polygon_to_room(polygon))
    
    # If no rooms detected, create default room
    if not rooms:
        rooms = [_create_default_room()]
    
    return rooms


def _polygon_to_room(polygon):
    """
    Convert polygon to room dict with properties
    """
    coords = list(polygon.exterior.coords)
    centroid = polygon.centroid
    bounds = polygon.bounds  # (minx, miny, maxx, maxy)
    
    # Room dimensions
    width = bounds[2] - bounds[0]
    depth = bounds[3] - bounds[1]
    area = polygon.area
    
    return {
        'polygon': [(pt[0], pt[1]) for pt in coords],
        'centroid': [centroid.x, centroid.y],
        'area': area,
        'width': width,
        'depth': depth,
        'bounds': {
            'min': [bounds[0], bounds[1]],
            'max': [bounds[2], bounds[3]]
        },
        'perimeter': polygon.length
    }


def _create_default_room():
    """
    Create default 5x5m room if detection fails
    """
    return {
        'polygon': [(0, 0), (5, 0), (5, 5), (0, 5), (0, 0)],
        'centroid': [2.5, 2.5],
        'area': 25.0,
        'width': 5.0,
        'depth': 5.0,
        'bounds': {
            'min': [0, 0],
            'max': [5, 5]
        },
        'perimeter': 20.0
    }


def classify_rooms(rooms):
    """
    Classify each room by type (bedroom, living, kitchen, bathroom)
    Uses heuristics: area, aspect ratio, shape characteristics
    """
    classified = []
    
    for room in rooms:
        room_type = _classify_room(room)
        classified.append({
            **room,
            'type': room_type['type'],
            'confidence': room_type['confidence'],
            'suggestions': room_type['suggestions']
        })
    
    return classified


def _classify_room(room):
    """
    Classify single room using size and shape heuristics
    """
    area = room['area']
    width = room['width']
    depth = room['depth']
    aspect_ratio = max(width, depth) / min(width, depth) if min(width, depth) > 0 else 1
    
    # Heuristics
    is_square = aspect_ratio < 1.3
    is_small = area < 15
    is_medium = 15 <= area < 35
    is_large = area >= 35
    is_narrow = aspect_ratio > 2.0
    
    # Classification logic
    if is_small and is_square:
        return {
            'type': 'bathroom',
            'confidence': 0.8,
            'suggestions': ['toilet', 'sink', 'shower']
        }
    elif is_medium and is_square:
        return {
            'type': 'bedroom',
            'confidence': 0.85,
            'suggestions': ['bed', 'wardrobe', 'nightstand']
        }
    elif is_large and (is_square or (is_narrow and area < 60)):
        return {
            'type': 'living',
            'confidence': 0.8,
            'suggestions': ['sofa', 'tv_stand', 'tables', 'chairs']
        }
    elif is_narrow and is_large:
        return {
            'type': 'kitchen',
            'confidence': 0.75,
            'suggestions': ['kitchen_counter', 'dining_table']
        }
    elif area >= 20:
        return {
            'type': 'living',
            'confidence': 0.7,
            'suggestions': ['sofa', 'tv_stand']
        }
    else:
        return {
            'type': 'generic',
            'confidence': 0.6,
            'suggestions': ['furniture']
        }


def get_wall_positions(room):
    """
    Get wall positions (points along perimeter)
    Useful for placing furniture against walls
    """
    polygon = room['polygon']
    walls = []
    
    for i in range(len(polygon) - 1):
        p1 = polygon[i]
        p2 = polygon[i + 1]
        walls.append({
            'start': p1,
            'end': p2,
            'length': math.sqrt((p2[0] - p1[0])**2 + (p2[1] - p1[1])**2),
            'center': [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2]
        })
    
    return walls


def get_opposite_walls(walls):
    """
    Find opposite walls (for TV/sofa arrangement)
    """
    if len(walls) < 4:
        return None, None
    
    # Sort by length and get two longest
    sorted_walls = sorted(walls, key=lambda w: w['length'], reverse=True)
    
    if len(sorted_walls) >= 2:
        return sorted_walls[0], sorted_walls[1]
    
    return None, None


def snap_point_to_wall(point, wall, distance=0.3):
    """
    Snap a point to a wall at given distance
    """
    x, y = point
    start = wall['start']
    end = wall['end']
    
    # Direction vector
    dx = end[0] - start[0]
    dy = end[1] - start[1]
    length = math.sqrt(dx**2 + dy**2)
    
    if length == 0:
        return point
    
    # Normal vector (perpendicular to wall)
    nx = -dy / length
    ny = dx / length
    
    # Move point to distance from wall
    snapped = [x + nx * distance, y + ny * distance]
    
    return snapped
