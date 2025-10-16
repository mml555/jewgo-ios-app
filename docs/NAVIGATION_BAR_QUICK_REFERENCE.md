# Navigation Bar - Quick Reference Guide

## 🎯 Pixel-Perfect Values (Reference-Grade)

### Background & Container

```javascript
backgroundColor: 'rgba(255, 255, 255, 0.85)';
borderRadius: 9999; // Perfect capsule
borderWidth: 0.5;
borderColor: 'rgba(0, 0, 0, 0.04)';
```

### Shadow (Air-Gap Illusion)

```javascript
shadowColor: '#000'
shadowOffset: { width: 0, height: 4 }
shadowOpacity: 0.06
shadowRadius: 12
elevation: 10  // Android
```

### Icons

```javascript
size: 22  // Refined weight
inactive: '#B3B3B3'  // Fades back
active: '#292b2d' (Specials) or Colors.primary.main
```

### Labels

```javascript
fontSize: 12;
fontWeight: '500';
marginTop: 1; // Apple-precise optical centering
letterSpacing: 0.3;
color: '#B3B3B3'(inactive);
```

### Active Tab (Specials) - 3-Layer Radial Glow

```javascript
// Container
backgroundColor: 'rgba(198, 255, 209, 0.25)'
width: 58, height: 58
transform: [{ scale: 1.05 }]

// Glow Layers
Outer (58px): 'rgba(198, 255, 209, 0.08)'
Middle (46px): 'rgba(198, 255, 209, 0.2)'
Inner (32px): 'rgba(198, 255, 209, 0.35)'
```

### Inactive Tab (Specials)

```javascript
backgroundColor: 'rgba(224, 255, 235, 0.08)'; // Very light
transform: [{ scale: 1.0 }]; // Smooth transition base
```

---

## 🎨 Visual Hierarchy

```
Active Element Opacity Ladder:
1.0  (100%) - Active icon & label
0.85 (85%)  - Navbar background
0.35 (35%)  - Glow inner core
0.20 (20%)  - Glow middle layer
0.08 (8%)   - Glow outer / inactive backgrounds
0.06 (6%)   - Shadow
0.04 (4%)   - Border
```

---

## 🔢 The Magic Numbers

| Property       | Value       | Why It Matters                    |
| -------------- | ----------- | --------------------------------- |
| BG Opacity     | **0.85**    | Sweet spot: floats with clarity   |
| Shadow Opacity | **0.06**    | Air-gap without weight            |
| Shadow Radius  | **12**      | Controlled diffusion              |
| Label Margin   | **1px**     | Optical (not mathematical) center |
| Icon Size      | **22**      | Refined weight, not heavy         |
| Inactive Color | **#B3B3B3** | Fades back properly               |
| Active Scale   | **1.05**    | Tactile without shouting          |
| Border Radius  | **9999**    | Perfect capsule shape             |

---

## ⚡ Quick Copy-Paste

### For Similar Floating UI Elements

```javascript
// Premium Floating Container
{
  backgroundColor: 'rgba(255, 255, 255, 0.85)',
  borderRadius: 9999,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.06,
  shadowRadius: 12,
  borderWidth: 0.5,
  borderColor: 'rgba(0, 0, 0, 0.04)',
}

// Radial Glow Effect (3-layer)
// Outer
{ backgroundColor: 'rgba(R, G, B, 0.08)', size: 100% }
// Middle
{ backgroundColor: 'rgba(R, G, B, 0.2)', size: 80% }
// Inner
{ backgroundColor: 'rgba(R, G, B, 0.35)', size: 55% }

// Optical Label Spacing
{
  marginTop: 1, // Not 0, not 2
  letterSpacing: 0.3,
}

// Micro-Scale Feedback
{
  active: transform: [{ scale: 1.05 }]
  inactive: transform: [{ scale: 1.0 }]
}
```

---

## 🎓 Key Principles

1. **0.85 Opacity** = Translucent but readable
2. **1px Spacing** = Optical precision
3. **0.06 Shadow** = Air-gap illusion
4. **#B3B3B3 Inactive** = Proper fade-back
5. **1.05x Scale** = Tactile feedback
6. **3-Layer Glow** = Smooth diffusion

---

## ✅ Quality Checklist

Before calling any UI "pixel-perfect":

- [ ] Background translucent (0.80-0.85 range)
- [ ] Shadow soft and controlled (0.05-0.06 opacity)
- [ ] Inactive colors fade back (#B3B3B3 or lighter)
- [ ] Label spacing optically centered (not mathematically)
- [ ] Active states scale subtly (1.05x max)
- [ ] Glow/highlights diffuse smoothly (gradient layers)
- [ ] Border radius appropriate to shape
- [ ] Platform-specific optimizations applied

---

## 🚀 File Location

Implementation: `src/navigation/RootTabs.tsx`

---

_Use these values as the foundation for all floating UI elements in Jewgo._
