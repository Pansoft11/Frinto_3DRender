"""
Generate 3D mesh from detected geometry
Uses trimesh to create and manipulate meshes
"""
import trimesh
import numpy as np


def generate_mesh(geometry):
    """
    Create 3D mesh from walls, doors, windows
    Returns a trimesh.Trimesh object
    """
    meshes = []
    
    # Create wall meshes
    wall_meshes = create_wall_meshes(geometry['walls'])
    meshes.extend(wall_meshes)
    
    # Create door meshes
    door_meshes = create_door_meshes(geometry['doors'])
    meshes.extend(door_meshes)
    
    # Create window meshes
    window_meshes = create_window_meshes(geometry['windows'])
    meshes.extend(window_meshes)
    
    # Create floor
    floor_mesh = create_floor(geometry['bounds'])
    if floor_mesh is not None:
        meshes.append(floor_mesh)
    
    if not meshes:
        # Create a simple box if no geometry
        return create_default_room()
    
    # Combine all meshes
    combined = trimesh.util.concatenate(meshes)
    
    return combined


def create_wall_meshes(walls):
    """Create 3D box meshes for walls"""
    meshes = []
    wall_height = 2.5  # Standard wall height
    
    for wall in walls:
        thickness = wall.get('thickness', 0.1)
        
        # Wall dimensions
        x1, y1 = wall['start']
        x2, y2 = wall['end']
        
        # Length of wall
        length = np.sqrt((x2 - x1)**2 + (y2 - y1)**2)
        
        if length < 0.01:  # Skip very short walls
            continue
        
        # Create box geometry
        # Box: (pos_x, pos_y, pos_z + height/2, width, depth, height)
        center_x = (x1 + x2) / 2
        center_y = (y1 + y2) / 2
        center_z = wall_height / 2
        
        # Calculate angle for proper orientation
        angle = np.arctan2(y2 - y1, x2 - x1)
        
        # Create box (local coordinates)
        box = create_box_at_origin(length, thickness, wall_height)
        
        # Rotate and translate
        rotation_matrix = np.array([
            [np.cos(angle), -np.sin(angle), 0],
            [np.sin(angle), np.cos(angle), 0],
            [0, 0, 1]
        ])
        
        box.apply_transform(np.eye(4))
        box.vertices = box.vertices @ rotation_matrix.T
        box.vertices[:, 0] += center_x
        box.vertices[:, 1] += center_y
        box.vertices[:, 2] += center_z
        
        # Add color (grayish)
        box.visual.vertex_colors = [128, 128, 128, 255] * len(box.vertices)
        
        meshes.append(box)
    
    return meshes


def create_box_at_origin(length, width, height):
    """Create a box mesh centered at origin"""
    vertices = np.array([
        [-length/2, -width/2, 0],
        [length/2, -width/2, 0],
        [length/2, width/2, 0],
        [-length/2, width/2, 0],
        [-length/2, -width/2, height],
        [length/2, -width/2, height],
        [length/2, width/2, height],
        [-length/2, width/2, height],
    ], dtype=np.float64)
    
    faces = np.array([
        [0, 1, 2], [2, 3, 0],  # bottom
        [4, 6, 5], [4, 7, 6],  # top
        [0, 4, 5], [0, 5, 1],  # front
        [2, 6, 7], [2, 7, 3],  # back
        [0, 3, 7], [0, 7, 4],  # left
        [1, 5, 6], [1, 6, 2],  # right
    ])
    
    return trimesh.Trimesh(vertices=vertices, faces=faces)


def create_door_meshes(doors):
    """Create door frame meshes"""
    meshes = []
    
    for door in doors:
        x, y = door['position']
        width = door['width']
        height = door['height']
        rotation = door['rotation']
        
        # Create simple door frame
        door_mesh = create_box_at_origin(width * 0.1, 0.05, height)
        
        # Rotate
        rotation_matrix = np.array([
            [np.cos(np.radians(rotation)), -np.sin(np.radians(rotation)), 0],
            [np.sin(np.radians(rotation)), np.cos(np.radians(rotation)), 0],
            [0, 0, 1]
        ])
        
        door_mesh.vertices = door_mesh.vertices @ rotation_matrix.T
        door_mesh.vertices[:, 0] += x
        door_mesh.vertices[:, 1] += y
        
        # Color (brown for door)
        door_mesh.visual.vertex_colors = [139, 69, 19, 255] * len(door_mesh.vertices)
        
        meshes.append(door_mesh)
    
    return meshes


def create_window_meshes(windows):
    """Create window pane meshes"""
    meshes = []
    
    for window in windows:
        x, y = window['position']
        width = window['width']
        height = window['height']
        rotation = window['rotation']
        
        # Create simple window pane
        window_mesh = create_box_at_origin(width, 0.02, height)
        
        # Rotate
        rotation_matrix = np.array([
            [np.cos(np.radians(rotation)), -np.sin(np.radians(rotation)), 0],
            [np.sin(np.radians(rotation)), np.cos(np.radians(rotation)), 0],
            [0, 0, 1]
        ])
        
        window_mesh.vertices = window_mesh.vertices @ rotation_matrix.T
        window_mesh.vertices[:, 0] += x
        window_mesh.vertices[:, 1] += y
        window_mesh.vertices[:, 2] += 1.0  # Height above floor
        
        # Color (light blue for window)
        window_mesh.visual.vertex_colors = [173, 216, 230, 128] * len(window_mesh.vertices)
        
        meshes.append(window_mesh)
    
    return meshes


def create_floor(bounds):
    """Create floor mesh from bounds"""
    min_x, min_y = bounds['min']
    max_x, max_y = bounds['max']
    
    # Add padding
    padding = 1.0
    min_x -= padding
    min_y -= padding
    max_x += padding
    max_y += padding
    
    vertices = np.array([
        [min_x, min_y, 0],
        [max_x, min_y, 0],
        [max_x, max_y, 0],
        [min_x, max_y, 0],
    ], dtype=np.float64)
    
    faces = np.array([
        [0, 1, 2],
        [0, 2, 3]
    ])
    
    floor = trimesh.Trimesh(vertices=vertices, faces=faces)
    
    # Color (light gray for floor)
    floor.visual.vertex_colors = [200, 200, 200, 255] * len(floor.vertices)
    
    return floor


def create_default_room():
    """Create a default room if no geometry detected"""
    room_size = 5.0
    vertices = np.array([
        [0, 0, 0],
        [room_size, 0, 0],
        [room_size, room_size, 0],
        [0, room_size, 0],
        [0, 0, 2.5],
        [room_size, 0, 2.5],
        [room_size, room_size, 2.5],
        [0, room_size, 2.5],
    ], dtype=np.float64)
    
    faces = np.array([
        [0, 1, 2], [2, 3, 0],  # floor
        [4, 6, 5], [4, 7, 6],  # ceiling
        [0, 4, 5], [0, 5, 1],  # walls
        [1, 5, 6], [1, 6, 2],
        [2, 6, 7], [2, 7, 3],
        [3, 7, 4], [3, 4, 0],
    ])
    
    return trimesh.Trimesh(vertices=vertices, faces=faces)
