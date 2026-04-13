# 🎮 Editor Controls Quick Guide

## Getting Started

### Basic Controls

**Selection**: Click any object to select it
**Deselect**: Click empty space in the 3D view

---

## Transform Modes

### 1️⃣ Move (Translate)

**Activate**: Press `G` or click **↔️ Move** button

```
What it does: Move objects around the scene
How to use:   Select object → Press G → Drag gizmo arrows
Ground rule:  Objects automatically snap to y=0 (ground)
```

**Tips**:
- X (red) axis = left/right
- Y (green) axis = up/down (clamped to ground)
- Z (blue) axis = forward/backward

### 2️⃣ Rotate (Rotation)

**Activate**: Press `R` or click **🔄 Rotate** button

```
What it does: Rotate objects around axes
How to use:   Select object → Press R → Drag rotation arcs
```

**Tips**:
- Rotation in radians
- Use ControlsPanel for precise degree entry
- Ground clamping doesn't affect rotation

### 3️⃣ Scale (Size)

**Activate**: Press `S` or click **📏 Scale** button

```
What it does: Resize objects
How to use:   Select object → Press S → Drag scale handles
```

**Tips**:
- Scale uniformly on all axes
- Minimum scale: 0.1x
- Use ControlsPanel for per-axis scaling

---

## Grid Snapping

### Toggle Snap

**Button**: 🎯 **Snap ON/OFF**

```
Enabled:  Objects snap to 0.5m grid
Disabled: Free positioning
```

**How it works**:
1. Click 🎯 button to toggle
2. Position + Snap → Rounded to nearest 0.5m
3. Useful for organized room layouts

**Keyboard Shortcut**: (Can be added in future release)

---

## Undo/Redo

### Undo Last Action

**Button**: **↶** (Undo button, left side)  
**Keyboard**: `Ctrl + Z`

```
Reverts the last change you made
- History limit: 50 items
- Changes include: add, move, delete, color, scale
```

### Redo Last Undo

**Button**: **↷** (Redo button, right side)  
**Keyboard**: `Ctrl + Shift + Z`

```
Reapplies an action you undid
- Only available after undo
- Disabled when no redo available
```

**History States**:
- ✅ Enabled - Blue background
- ❌ Disabled - Gray background, not clickable

---

## Property Controls

### Right Panel: Properties

**When to use**: After selecting an object

### Standard Controls (All Objects)

#### Position (X, Y, Z)
```
- Edit exact coordinates
- Y locked to ground (≥ 0)
- Input any decimal value
```

#### Snap to Grid Button
```
"🎯 Snap to Grid" - Rounds position to 0.5m increments
Useful for: Aligning objects quickly
```

#### Rotation (X, Y, Z)
```
- In radians (not degrees)
- Full 360° = 2π radians
- Use 0.05 increments for fine control
```

#### Scale
```
- Per-axis control
- Minimum: 0.1x
- Maximum: unlimited
```

#### Color Picker
```
- Click color box to select
- Hex value displayed
- Applies in real-time
```

---

## Type-Specific Controls

### 🛋️ Sofa

```
Controls:
├─ Color picker (full palette)
├─ Scale slider (0.5x - 2x)
└─ Material preview

Use case: Living room furniture
Tips: Scale to furniture size, color to room theme
```

### 💡 Lamp

```
Controls:
├─ Intensity slider (0 - 2)
├─ Auto color adjustment
└─ Brightness indicator

Use case: Lighting design
Tips: Higher intensity = brighter + warmer color
```

### 🧱 Wall

```
Controls:
├─ Material dropdown
│  ├ Concrete (Gray)
│  ├ Brick (Orange-brown)
│  ├ Drywall (Light gray)
│  └ Wood (Brown)
├─ Color auto-applies
└─ Preview box

Use case: Interior finishes
Tips: Material affects visual appearance, matches color
```

---

## Keyboard Shortcuts Summary

| Shortcut | Action | Mode |
|----------|--------|------|
| **G** | Move mode | Scene |
| **R** | Rotate mode | Scene |
| **S** | Scale mode | Scene |
| **Ctrl+Z** | Undo | Scene |
| **Ctrl+Shift+Z** | Redo | Scene |
| **Click** | Select object | Scene |
| **Click empty** | Deselect | Scene |

---

## Common Workflows

### Create a Room Layout

1. **Add sofa**: Drag from library
2. **Position sofa**: Press **G** → place near wall
3. **Add lamp**: Drag from library
4. **Light placement**: Press **G** → position above sofa
5. **Add table**: Drag from library
6. **Scale table**: Press **S** → make dining size
7. **Color coordination**: Use color pickers
8. **Save**: Click **💾 Save** button

**Time**: 5-10 minutes

### Adjust Existing Layout

1. **Load layout**: Click **📂 Load** button
2. **Select object**: Click in 3D view
3. **Edit properties**: Use right panel
4. **Transform**: Use G/R/S keys
5. **Undo if needed**: Ctrl+Z
6. **Save changes**: Click **💾 Save** button

**Time**: 1-3 minutes

### Export Layout

1. **Click**: **📥 Export** button
2. **Browser**: Downloads layout.json file
3. **Share**: Send JSON file to collaborators

**Import later**: **📤 Import** → select file

---

## Scene Environment

### What You're Looking At

```
Grid:    Reference floor (infinite, fades at distance)
Axes:    Red/Green/Blue lines at origin
Objects: Your placed furniture and elements
Lights:  Professional 5-light system (invisible)
```

### Visual Indicators

**Top-left**: Scene stats
```
📊 Objects: count
🎯 Selected: type or "none"
📷 Pos: Camera position
Shortcuts: Help text
```

**Top-right**: Transform mode indicator
```
Mode: translate/rotate/scale
(Shows current mode)
```

---

## Tips & Tricks

### Pro Tips

1. **Grid snapping**: Best for organized layouts
2. **Ground snapping**: Objects won't go below floor
3. **Undo liberally**: 50-item history, use it!
4. **Type-specific controls**: Faster than manual adjustments
5. **Keyboard shortcuts**: Faster than mouse buttons

### Optimization

- Use snap grid for consistency
- Group similar objects by type
- Save frequently (30-sec auto-save available)
- Export backups as JSON

### Troubleshooting

**Object jumped to ground?**
- Y coordinate got set to negative
- Use Snap to Grid to realign
- Or manually set Y to positive value

**Undo not working?**
- Button might be disabled (gray = no more undos)
- Try Ctrl+Z if button doesn't work
- Refresh page to reset history

**Model not showing?**
- Model file not found → fallback geometry used
- Check browser console for warnings
- Impact: Visual representation only, no functional change

---

## Keyboard Shortcuts in Context

### While Transforming

| Action | How |
|--------|-----|
| Cancel | Press Escape (or click empty space) |
| Precision | Hold Shift while dragging |
| Snap axis | Hold Ctrl while dragging |

### In Property Panels

| Action | How |
|--------|-----|
| Next field | Press Tab |
| Submit | Press Enter |
| Cancel | Press Escape |

---

## Best Practices

### For Organized Scenes

✅ **DO**:
- Use snap grid for alignment
- Position furniture near walls
- Use realistic scales
- Name objects by type
- Save backups regularly

❌ **DON'T**:
- Position objects below ground
- Use extreme scales
- Leave history at full (though it's limited)
- Save without testing first
- Forget to export backups

---

## Scene Limits

These are soft limits (can be exceeded but not recommended):

| Limit | Amount | Impact |
|-------|--------|--------|
| Objects | ~500 | Performance degrades |
| Undo history | 50 | Oldest removed on 51st |
| Lights | 5 (fixed) | Render quality |
| Transform distance | ∞ | Camera navigation |
| Model size | ∞ | Loading time |

---

## Getting Help

### Check These First

1. **Common issues**: See Troubleshooting above
2. **Keyboard shortcuts**: See table above
3. **Control types**: See Property Controls section
4. **Workflows**: See Common Workflows section

### Advanced Help

- See `EDITOR_UPGRADE.md` for technical details
- Check console (F12) for error messages
- Inspect element to see internal state

---

## Quick Reference Card

```
┌─────────────────────────────────────────┐
│         PLAN2RENDER EDITOR CHEAT SHEET  │
├─────────────────────────────────────────┤
│ G = Move       R = Rotate      S = Scale │
│ Ctrl+Z = Undo  Ctrl+Shift+Z = Redo      │
│ Click = Select  Click empty = Deselect  │
├─────────────────────────────────────────┤
│ 🎯 Snap Grid   ↶ Undo   ↷ Redo         │
│ 💾 Save        📂 Load   📥 Export     │
│ 📤 Import      🗑️ Clear               │
├─────────────────────────────────────────┤
│ Ground locked to y ≥ 0                  │
│ History: 50 items max                   │
│ Mode shown in top-right                 │
└─────────────────────────────────────────┘
```

---

**Last Updated**: April 13, 2026  
**Version**: 2.0.0  
**Editor Status**: Professional UX Upgrade Complete ✅
