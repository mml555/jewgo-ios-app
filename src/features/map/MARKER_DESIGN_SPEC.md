# Map Marker Design Specification

## Pill Marker (Rating Badge) Design

### Visual Specifications

- **Shape**: Horizontal pill with rounded ends
- **Background**: Pure white (`#FFFFFF`)
- **Padding**: Horizontal 12dp, Vertical 8dp
- **Border Radius**: 18dp
- **Tail**: 16×16dp square rotated 45° with 3dp radius
- **Tail Overlap**: 8dp overlap with pill bottom
- **Anchor Point**: (0.5, 1.0) - bottom center of tail

### Typography

- **Font Size**: 14dp
- **Font Weight**: 700 (Bold)
- **Letter Spacing**: 0.2
- **Content**: Star (★) + Rating (e.g., "4.8")

### Color Coding

- **Blue (`#66B7FF`)**: Ratings ≥ 4.7 (Excellent)
- **Yellow (`#FFC44D`)**: Ratings ≥ 4.0 (Good)
- **Red (`#FF6B6B`)**: Ratings < 4.0 or null (Poor/Unknown)

### Shadow Effects

- **Pill Shadow**: Subtle drop shadow
- **Tail Shadow**: Elliptical shadow (26×10dp, rgba(0,0,0,0.18), +7dp offset)
- **Selected State**: Enhanced shadow with border color glow

### Interactive States

- **Default**: Normal scale (1.0)
- **Selected**: Scale 1.05× with 2dp border in rating color
- **Pressed**: Scale 0.98× during press
- **Hit Target**: 44×44dp (via hitSlop)

## Cluster Marker Design

### Visual Specifications

- **Shape**: Circular
- **Size**: 40×40dp
- **Background**: White (`#FFFFFF`)
- **Border**: 3dp green (`#74e1a0`)
- **Content**: Number count (e.g., "5", "12")
- **Anchor Point**: (0.5, 0.5) - center

### Typography

- **Font Size**: 14dp
- **Font Weight**: 700 (Bold)
- **Color**: Dark gray (`#1A1A1A`)

### Shadow Effects

- **Cluster Shadow**: Enhanced drop shadow for depth
- **Shadow Offset**: 0, 3dp
- **Shadow Opacity**: 0.3
- **Shadow Radius**: 6dp

## Performance Optimizations

### Marker Freezing

- **Initial State**: `tracksViewChanges={true}` for first 120ms
- **Frozen State**: `tracksViewChanges={false}` after 120ms
- **Purpose**: Prevents unnecessary re-renders during map interactions

### Clustering Behavior

- **Cluster Radius**: 58dp
- **Min Points**: 2
- **Max Zoom**: 20
- **Cluster Below**: Zoom level ~14

### Memory Management

- **Memoization**: All marker components use `React.memo`
- **Stable Styles**: Style objects are defined outside render
- **Efficient Updates**: Only re-render when props change

## Implementation Notes

### RatingBadge Component

- Uses `Pressable` for touch handling
- Implements proper hit testing with `hitSlop`
- Supports all three interactive states
- Matches exact visual specifications

### ListingMarker Component

- Wraps `RatingBadge` in `Marker` component
- Handles coordinate conversion (lng, lat)
- Implements marker freezing for performance
- Supports selection state

### ClusterMarker Component

- Simple circular design with count
- Optimized for performance (`tracksViewChanges={false}`)
- Clear visual hierarchy

## Quality Assurance

### Visual Testing

- [ ] Markers render with correct colors
- [ ] Pill shape matches reference design
- [ ] Tail positioning is accurate
- [ ] Shadow effects are visible
- [ ] Typography matches specifications

### Interaction Testing

- [ ] Tap markers show selection state
- [ ] Press states work correctly
- [ ] Cluster tap zooms appropriately
- [ ] Performance is smooth with 1000+ markers

### Cross-Platform Testing

- [ ] iOS rendering matches design
- [ ] Android rendering is consistent
- [ ] Different screen densities work
- [ ] Accessibility features function
