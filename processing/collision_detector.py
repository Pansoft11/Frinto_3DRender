"""
Collision detection for furniture placement
- AABB (Axis-Aligned Bounding Box) collision
- Polygon containment checks
- Distance calculations
"""
import math


class BoundingBox:
    """Axis-aligned bounding box for collision detection"""
    
    def __init__(self, center, width, depth, height=1.0):
        self.center = center
        self.width = width
        self.depth = depth
        self.height = height
        
        # Calculate bounds
        self.min_x = center[0] - width / 2
        self.max_x = center[0] + width / 2
        self.min_y = center[1] - depth / 2
        self.max_y = center[1] + depth / 2
    
    def intersects(self, other):
        """Check if two bounding boxes intersect"""
        return (self.min_x < other.max_x and self.max_x > other.min_x and
                self.min_y < other.max_y and self.max_y > other.min_y)
    
    def contains_point(self, point):
        """Check if point is inside bounding box"""
        return (self.min_x <= point[0] <= self.max_x and
                self.min_y <= point[1] <= self.max_y)
    
    def distance_to(self, other):
        """Calculate minimum distance between two bounding boxes"""
        dx = max(self.min_x - other.max_x, other.min_x - self.max_x, 0)
        dy = max(self.min_y - other.max_y, other.min_y - self.max_y, 0)
        return math.sqrt(dx**2 + dy**2)


def check_collision(obj1, obj2, min_distance=0.3):
    """
    Check if two objects collide (with minimum safe distance)
    
    obj format: {
        'position': [x, y],
        'scale': [sx, sy, sz],  # defaults to [1, 1, 1]
        'type': 'sofa'  # for size hints
    }
    """
    # Get bounding boxes
    bbox1 = get_object_bbox(obj1)
    bbox2 = get_object_bbox(obj2)
    
    # Check for intersection
    return bbox1.intersects(bbox2) or bbox1.distance_to(bbox2) < min_distance


def check_collision_with_room(position, furniture_type, room_polygon, margin=0.3):
    """
    Check if furniture position is valid within room
    Position must be inside room with margin from walls
    """
    # Furniture dimensions (in meters)
    dimensions = {
        'sofa': [2.0, 0.8],
        'bed': [1.6, 2.0],
        'table': [1.0, 1.0],
        'chair': [0.5, 0.5],
        'lamp': [0.4, 0.4],
        'tv_stand': [1.5, 0.5],
        'wardrobe': [1.0, 0.8],
        'nightstand': [0.5, 0.5]
    }
    
    dims = dimensions.get(furniture_type, [1.0, 1.0])
    width, depth = dims
    
    # Check if point is in room with margin
    x, y = position
    
    # Simple rectangular check (improvement: polygon point-in-polygon)
    if room_polygon is None:
        return True
    
    # Check point is away from edges
    bounds = _get_polygon_bounds(room_polygon)
    min_x, min_y = bounds['min']
    max_x, max_y = bounds['max']
    
    # Add margins
    margin_x = (width / 2) + margin
    margin_y = (depth / 2) + margin
    
    return (min_x + margin_x <= x <= max_x - margin_x and
            min_y + margin_y <= y <= max_y - margin_y)


def get_object_bbox(obj):
    """Create bounding box from object data"""
    furniture_sizes = {
        'sofa': [2.0, 0.8],
        'bed': [1.6, 2.0],
        'table': [1.0, 1.0],
        'table_coffee': [0.8, 0.6],
        'chair': [0.5, 0.5],
        'lamp': [0.4, 0.4],
        'tv_stand': [1.5, 0.5],
        'wardrobe': [1.0, 0.8],
        'nightstand': [0.5, 0.5],
        'desk': [1.2, 0.6],
        'kitchen_counter': [2.0, 0.6],
        'dining_table': [1.2, 0.8]
    }
    
    obj_type = obj.get('type', 'sofa')
    size = furniture_sizes.get(obj_type, [1.0, 1.0])
    
    # Apply scale
    scale = obj.get('scale', [1, 1, 1])
    width = size[0] * scale[0]
    depth = size[1] * scale[1]
    
    return BoundingBox(obj['position'], width, depth)


def find_valid_positions(
    room_polygon,
    furniture_type,
    existing_objects,
    num_candidates=5,
    min_distance=0.5
):
    """
    Find valid positions in room for furniture placement
    
    Returns list of candidate positions sorted by quality
    """
    bounds = _get_polygon_bounds(room_polygon)
    min_x, min_y = bounds['min']
    max_x, max_y = bounds['max']
    
    # Furniture dimensions
    dimensions = {
        'sofa': [2.0, 0.8],
        'bed': [1.6, 2.0],
        'table': [1.0, 1.0],
        'chair': [0.5, 0.5],
        'lamp': [0.4, 0.4],
        'tv_stand': [1.5, 0.5],
        'wardrobe': [1.0, 0.8],
        'nightstand': [0.5, 0.5]
    }
    
    dims = dimensions.get(furniture_type, [1.0, 1.0])
    width, depth = dims
    margin = 0.3
    
    candidates = []
    
    # Generate candidate positions in grid
    step = 0.5
    x = min_x + width / 2 + margin
    while x <= max_x - width / 2 - margin:
        y = min_y + depth / 2 + margin
        while y <= max_y - depth / 2 - margin:
            pos = [x, y]
            
            # Check if valid
            is_valid = True
            
            # Check collision with existing objects
            for existing in existing_objects:
                if check_collision(
                    {'position': pos, 'type': furniture_type},
                    existing,
                    min_distance=min_distance
                ):
                    is_valid = False
                    break
            
            if is_valid:
                # Calculate quality score
                score = _score_position(pos, furniture_type, room_polygon)
                candidates.append({'position': pos, 'score': score})
            
            y += step
        x += step
    
    # Sort by score (descending)
    candidates.sort(key=lambda c: c['score'], reverse=True)
    
    # Return top candidates
    return [c['position'] for c in candidates[:num_candidates]]


def _score_position(position, furniture_type, room_polygon):
    """
    Score a position for furniture placement
    Higher score = better position
    
    Heuristics:
    - Center of room is good (1.0)
    - Against walls is good for sofas/beds
    - Away from edges is good for tables/chairs
    """
    bounds = _get_polygon_bounds(room_polygon)
    room_center = [
        (bounds['min'][0] + bounds['max'][0]) / 2,
        (bounds['min'][1] + bounds['max'][1]) / 2
    ]
    
    # Distance from center
    dx = position[0] - room_center[0]
    dy = position[1] - room_center[1]
    dist_from_center = math.sqrt(dx**2 + dy**2)
    
    # Room size
    room_width = bounds['max'][0] - bounds['min'][0]
    room_depth = bounds['max'][1] - bounds['min'][1]
    max_dist = math.sqrt(room_width**2 + room_depth**2) / 2
    
    # Normalize distance (0-1, where 1 is best)
    center_score = 1.0 - (dist_from_center / max_dist if max_dist > 0 else 0)
    
    # Type-specific scoring
    if furniture_type in ['sofa', 'bed']:
        # These should be against walls (away from center is okay)
        score = (1.0 - center_score) * 0.5 + center_score * 0.3
    elif furniture_type in ['table', 'table_coffee']:
        # Tables should be central
        score = center_score * 0.8 + 0.2
    elif furniture_type in ['lamp', 'fan']:
        # Lights good in center or corners
        score = (center_score + (1.0 - center_score)) / 2
    else:
        # Default: slight preference for center
        score = center_score * 0.6 + 0.4
    
    return score


def _get_polygon_bounds(polygon):
    """Get bounding box of polygon"""
    if not polygon:
        return {'min': [0, 0], 'max': [5, 5]}
    
    xs = [p[0] for p in polygon]
    ys = [p[1] for p in polygon]
    
    return {
        'min': [min(xs), min(ys)],
        'max': [max(xs), max(ys)]
    }


def get_distance_between(pos1, pos2):
    """Calculate distance between two positions"""
    dx = pos2[0] - pos1[0]
    dy = pos2[1] - pos1[1]
    return math.sqrt(dx**2 + dy**2)
