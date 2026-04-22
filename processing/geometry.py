"""
Geometry detection from DXF data
- Detect walls (parallel lines)
- Detect doors/windows from blocks
- Calculate room dimensions
"""
import math
from shapely.geometry import LineString, MultiLineString, Polygon

WALL_DISTANCE_THRESHOLD = 0.35
PARALLEL_ANGLE_THRESHOLD = 5


def detect_geometry(dxf_data):
    """
    Detect walls, doors, windows from parsed DXF
    """
    walls = detect_walls(dxf_data['lines'] + dxf_data['polylines'])
    doors = detect_doors(dxf_data['blocks'])
    windows = detect_windows(dxf_data['blocks'])
    rooms = detect_rooms(walls)
    
    return {
        'walls': walls,
        'doors': doors,
        'windows': windows,
        'rooms': rooms,
        'bounds': dxf_data['bounds']
    }


def detect_walls(lines):
    """
    Detect walls using parallel line detection
    Walls are typically thick lines or parallel close lines
    """
    walls = []
    segments = []
    
    for line in lines:
        if 'start' in line and 'end' in line:
            # Simple line
            segments.append({
                'start': tuple(line['start']),
                'end': tuple(line['end']),
                'thickness': line.get('thickness', 0.1),
                'layer': line.get('layer', 'default')
            })
        elif 'points' in line:
            # Polyline - connect consecutive points
            points = line['points']
            for i in range(len(points) - 1):
                segments.append({
                    'start': tuple(points[i]),
                    'end': tuple(points[i + 1]),
                    'thickness': line.get('thickness', 0.1),
                    'layer': line.get('layer', 'default')
                })

    # Keep the existing direct wall interpretation for compatibility.
    walls.extend(segments)

    # Add inferred wall centerlines from close parallel line pairs.
    for i, first in enumerate(segments):
        for second in segments[i + 1:]:
            if not _are_parallel(first, second):
                continue

            distance = _line_distance(first, second)
            if 0 < distance <= WALL_DISTANCE_THRESHOLD:
                walls.append({
                    'start': _midpoint(first['start'], second['start']),
                    'end': _midpoint(first['end'], second['end']),
                    'thickness': max(distance, first.get('thickness', 0.1), second.get('thickness', 0.1)),
                    'layer': first.get('layer', second.get('layer', 'default')),
                    'source': 'parallel-line-detection'
                })
    
    return walls


def detect_doors(blocks):
    """
    Detect doors from block references
    Common door block names: DOOR, DOOR_SINGLE, DOOR_DOUBLE, etc.
    """
    doors = []
    
    for block in blocks:
        name_lower = block['name'].lower()
        # Block-name detection catches common CAD blocks such as DOOR_SINGLE.
        if 'door' in name_lower or 'entry' in name_lower:
            doors.append({
                'type': 'door',
                'name': block['name'],
                'position': [block['x'], block['y']],
                'rotation': block['rotation'],
                'width': 0.9,  # Standard door width
                'height': 2.1
            })
    
    return doors


def detect_windows(blocks):
    """
    Detect windows from block references
    Common window block names: WINDOW, WINDOW_SINGLE, WINDOW_DOUBLE, etc.
    """
    windows = []
    
    for block in blocks:
        name_lower = block['name'].lower()
        # Block-name detection catches common CAD blocks such as WINDOW_DOUBLE.
        if 'window' in name_lower or 'win' in name_lower:
            windows.append({
                'type': 'window',
                'name': block['name'],
                'position': [block['x'], block['y']],
                'rotation': block['rotation'],
                'width': 1.2,
                'height': 1.2
            })
    
    return windows


def detect_rooms(walls):
    """
    Detect rooms (closed polygons) from walls
    Uses Shapely to find connected line segments
    """
    rooms = []
    
    if not walls:
        return rooms
    
    # Convert walls to LineString objects
    line_geometries = []
    for wall in walls:
        line = LineString([wall['start'], wall['end']])
        line_geometries.append(line)
    
    try:
        # Merge all lines
        merged = MultiLineString(line_geometries)
        
        # Try to find polygons (rooms)
        # This is a simplified approach
        if len(walls) >= 3:
            # Create a simple room from first 3 walls
            points = []
            for wall in walls[:4]:
                if len(points) == 0:
                    points.append(wall['start'])
                points.append(wall['end'])
            
            if len(points) >= 3:
                try:
                    polygon = Polygon(points)
                    if polygon.is_valid and polygon.area > 0:
                        rooms.append({
                            'type': 'room',
                            'area': polygon.area,
                            'bounds': list(polygon.bounds),  # min_x, min_y, max_x, max_y
                            'vertices': list(polygon.exterior.coords)
                        })
                except:
                    pass
    except Exception as e:
        print(f"Warning: Room detection failed: {e}")
    
    return rooms


def calculate_distance(p1, p2):
    """Euclidean distance between two 2D points"""
    return math.sqrt((p2[0] - p1[0])**2 + (p2[1] - p1[1])**2)


def _midpoint(p1, p2):
    """Midpoint between two 2D points."""
    return ((p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2)


def _line_distance(line1, line2):
    """Shortest distance between two wall candidate segments."""
    return LineString([line1['start'], line1['end']]).distance(
        LineString([line2['start'], line2['end']])
    )


def _are_parallel(line1, line2):
    """Return true when two segments are nearly parallel."""
    angle = angle_between_walls(line1, line2)
    return angle <= PARALLEL_ANGLE_THRESHOLD or abs(angle - 180) <= PARALLEL_ANGLE_THRESHOLD


def angle_between_walls(wall1, wall2):
    """Calculate angle between two walls"""
    v1 = (wall1['end'][0] - wall1['start'][0], wall1['end'][1] - wall1['start'][1])
    v2 = (wall2['end'][0] - wall2['start'][0], wall2['end'][1] - wall2['start'][1])
    
    # Normalize vectors
    len1 = math.sqrt(v1[0]**2 + v1[1]**2)
    len2 = math.sqrt(v2[0]**2 + v2[1]**2)
    
    if len1 == 0 or len2 == 0:
        return 0
    
    v1 = (v1[0]/len1, v1[1]/len1)
    v2 = (v2[0]/len2, v2[1]/len2)
    
    # Dot product
    dot = v1[0]*v2[0] + v1[1]*v2[1]
    angle = math.acos(max(-1, min(1, dot)))
    
    return math.degrees(angle)
