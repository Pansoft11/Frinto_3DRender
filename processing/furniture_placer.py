"""
Intelligent furniture placement engine
- Places furniture based on room type
- Avoids collisions
- Positions lights and accessories
"""
import random
from collision_detector import (
    check_collision,
    check_collision_with_room,
    find_valid_positions,
    get_distance_between
)
from room_classifier import (
    get_wall_positions,
    get_opposite_walls,
    snap_point_to_wall
)


def generate_layout(rooms):
    """
    Generate intelligent furniture layout for all rooms
    
    Returns list of placed furniture objects with positions
    """
    layout = []
    
    for room in rooms:
        room_layout = _generate_room_layout(room)
        layout.extend(room_layout)
    
    return layout


def _generate_room_layout(room):
    """
    Generate layout for single room based on classification
    """
    room_type = room.get('type', 'generic')
    room_polygon = room.get('polygon')
    room_centroid = room.get('centroid')
    
    furniture = []
    
    if room_type == 'bedroom':
        furniture = _layout_bedroom(room)
    elif room_type == 'living':
        furniture = _layout_living(room)
    elif room_type == 'kitchen':
        furniture = _layout_kitchen(room)
    elif room_type == 'bathroom':
        furniture = _layout_bathroom(room)
    else:
        furniture = _layout_generic(room)
    
    # Add lights and fans
    lighting = _place_lights(room, furniture)
    furniture.extend(lighting)
    
    return furniture


def _layout_bedroom(room):
    """
    Bedroom layout:
    - Bed against long wall
    - Wardrobe
    - Nightstands
    - Optional chair
    """
    furniture = []
    polygon = room.get('polygon')
    walls = get_wall_positions(room)
    
    if not walls or len(walls) < 2:
        return furniture
    
    # Find longest wall for bed
    longest_wall = max(walls, key=lambda w: w['length'])
    bed_pos = _place_against_wall(longest_wall, 'bed', 0.5)
    
    if bed_pos and check_collision_with_room(bed_pos, 'bed', polygon):
        furniture.append({
            'type': 'bed',
            'position': bed_pos,
            'rotation': [0, 0, 0],
            'scale': [1, 1, 1],
            'color': '#D4A574'
        })
        
        # Nightstands on both sides of bed
        for side_offset in [-1.2, 1.2]:
            night_pos = [bed_pos[0] + side_offset, bed_pos[1]]
            if check_collision_with_room(night_pos, 'nightstand', polygon):
                furniture.append({
                    'type': 'nightstand',
                    'position': night_pos,
                    'rotation': [0, 0, 0],
                    'scale': [0.8, 0.8, 1],
                    'color': '#8B6F47'
                })
    
    # Wardrobe on opposite wall
    if len(walls) >= 2:
        opposite = walls[-1] if walls[-1]['length'] > walls[1]['length'] else walls[1]
        wardrobe_pos = _place_against_wall(opposite, 'wardrobe', 0.5)
        if wardrobe_pos and check_collision_with_room(wardrobe_pos, 'wardrobe', polygon):
            furniture.append({
                'type': 'wardrobe',
                'position': wardrobe_pos,
                'rotation': [0, 0, 0],
                'scale': [1, 1, 1],
                'color': '#8B6F47'
            })
    
    return furniture


def _layout_living(room):
    """
    Living room layout:
    - Sofa
    - TV stand opposite sofa
    - Tables (coffee table, side tables)
    - Optional chairs
    """
    furniture = []
    polygon = room.get('polygon')
    walls = get_wall_positions(room)
    
    if not walls or len(walls) < 2:
        return furniture
    
    # Sofa on longest wall
    longest_wall = max(walls, key=lambda w: w['length'])
    sofa_pos = _place_against_wall(longest_wall, 'sofa', 0.5)
    
    if sofa_pos and check_collision_with_room(sofa_pos, 'sofa', polygon):
        furniture.append({
            'type': 'sofa',
            'position': sofa_pos,
            'rotation': [0, 0, 0],
            'scale': [1, 1, 1],
            'color': '#8B4513'
        })
        
        # TV stand opposite sofa
        tv_pos = [
            sofa_pos[0],
            sofa_pos[1] + 3.5  # Typical viewing distance
        ]
        if check_collision_with_room(tv_pos, 'tv_stand', polygon):
            furniture.append({
                'type': 'tv_stand',
                'position': tv_pos,
                'rotation': [0, 0, 0],
                'scale': [1, 1, 1],
                'color': '#654321'
            })
        
        # Coffee table in front of sofa
        coffee_pos = [
            sofa_pos[0],
            sofa_pos[1] + 1.5
        ]
        if check_collision_with_room(coffee_pos, 'table_coffee', polygon):
            furniture.append({
                'type': 'table_coffee',
                'position': coffee_pos,
                'rotation': [0, 0, 0],
                'scale': [0.8, 0.8, 1],
                'color': '#654321'
            })
    
    return furniture


def _layout_kitchen(room):
    """
    Kitchen layout:
    - Kitchen counter along wall
    - Dining table
    - Chairs around table
    """
    furniture = []
    polygon = room.get('polygon')
    walls = get_wall_positions(room)
    
    if not walls:
        return furniture
    
    # Counter on longest wall
    longest_wall = max(walls, key=lambda w: w['length'])
    counter_pos = _place_against_wall(longest_wall, 'kitchen_counter', 0.3)
    
    if counter_pos and check_collision_with_room(counter_pos, 'kitchen_counter', polygon):
        furniture.append({
            'type': 'kitchen_counter',
            'position': counter_pos,
            'rotation': [0, 0, 0],
            'scale': [1, 1, 1],
            'color': '#654321'
        })
    
    # Dining table in center
    centroid = room.get('centroid', [0, 0])
    if check_collision_with_room(centroid, 'dining_table', polygon):
        furniture.append({
            'type': 'dining_table',
            'position': centroid,
            'rotation': [0, 0, 0],
            'scale': [1, 1, 1],
            'color': '#654321'
        })
        
        # Chairs around table (4 chairs)
        for angle_offset in [0.7, -0.7, 1.8, -1.8]:
            chair_x = centroid[0] + 0.8 * angle_offset
            chair_y = centroid[1] + 0.8
            chair_pos = [chair_x, chair_y]
            
            if check_collision_with_room(chair_pos, 'chair', polygon):
                furniture.append({
                    'type': 'chair',
                    'position': chair_pos,
                    'rotation': [0, 0, 0],
                    'scale': [1, 1, 1],
                    'color': '#8B6914'
                })
    
    return furniture


def _layout_bathroom(room):
    """
    Bathroom layout:
    - Minimal fixture placement suggestions
    """
    furniture = []
    # Bathrooms typically have fixed fixtures, not furniture
    # Could add mirrors, cabinets as needed
    return furniture


def _layout_generic(room):
    """
    Generic room - place central table and chairs
    """
    furniture = []
    polygon = room.get('polygon')
    centroid = room.get('centroid', [0, 0])
    
    if check_collision_with_room(centroid, 'table', polygon):
        furniture.append({
            'type': 'table',
            'position': centroid,
            'rotation': [0, 0, 0],
            'scale': [1, 1, 1],
            'color': '#654321'
        })
    
    return furniture


def _place_against_wall(wall, furniture_type, distance_from_wall=0.3):
    """
    Place furniture against a wall
    
    distance_from_wall: how far from wall to place (0.3m typical)
    """
    wall_center = wall['center']
    
    # Furniture dimensions
    dimensions = {
        'bed': [1.6, 2.0],
        'sofa': [2.0, 0.8],
        'wardrobe': [1.0, 0.8],
        'kitchen_counter': [2.0, 0.6],
    }
    
    furnitrue_size = dimensions.get(furniture_type, [1.0, 1.0])
    
    # Move away from wall
    wall_start = wall['start']
    wall_end = wall['end']
    
    # Wall direction
    dx = wall_end[0] - wall_start[0]
    dy = wall_end[1] - wall_start[1]
    length = (dx**2 + dy**2) ** 0.5
    
    if length == 0:
        return wall_center
    
    # Perpendicular (normal) vector
    nx = -dy / length
    ny = dx / length
    
    # Position at distance from wall
    pos = [
        wall_center[0] + nx * distance_from_wall,
        wall_center[1] + ny * distance_from_wall
    ]
    
    return pos


def _place_lights(room, existing_furniture):
    """
    Place lights and fans at strategic locations
    """
    lights = []
    centroid = room.get('centroid', [0, 0])
    room_type = room.get('type', 'generic')
    
    # Ceiling light at room centroid
    lights.append({
        'type': 'lamp',
        'position': centroid,
        'rotation': [0, 0, 0],
        'scale': [1, 1, 1],
        'color': '#FFD700',
        'properties': {'intensity': 1.0}
    })
    
    # Fan if room is large
    if room.get('area', 0) > 30:
        lights.append({
            'type': 'fan',
            'position': centroid,
            'rotation': [0, 0, 0],
            'scale': [1, 1, 1],
            'color': '#A9A9A9'
        })
    
    return lights


def validate_layout(layout, rooms):
    """
    Validate layout - check all objects are in valid positions
    """
    for obj in layout:
        # Check object is in valid room
        obj_valid = False
        for room in rooms:
            if check_collision_with_room(obj['position'], obj['type'], room.get('polygon')):
                obj_valid = True
                break
        
        if not obj_valid:
            obj['_warning'] = 'Position outside room bounds'
    
    # Check for collisions
    for i, obj1 in enumerate(layout):
        for obj2 in layout[i+1:]:
            if check_collision(obj1, obj2, min_distance=0.3):
                obj1['_collision'] = True
                obj2['_collision'] = True
    
    return layout


def optimize_layout(layout):
    """
    Optimize layout to minimize collisions and improve spacing
    """
    # Simple optimization: move colliding objects slightly
    for i, obj1 in enumerate(layout):
        if obj1.get('_collision'):
            for obj2 in layout:
                if obj1 is not obj2 and check_collision(obj1, obj2):
                    # Move obj1 slightly away
                    dx = obj1['position'][0] - obj2['position'][0]
                    dy = obj1['position'][1] - obj2['position'][1]
                    dist = (dx**2 + dy**2) ** 0.5
                    
                    if dist > 0:
                        # Move by 0.1m in direction away from obj2
                        obj1['position'][0] += (dx / dist) * 0.1
                        obj1['position'][1] += (dy / dist) * 0.1
    
    return layout
