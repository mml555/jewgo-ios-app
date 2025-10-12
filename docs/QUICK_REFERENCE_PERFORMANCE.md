# Quick Reference: Event Performance Fixes

## What Was Fixed

### Problem

Event cards were **unclickable during image loading**, causing lag and poor user experience.

### Solution

Implemented **non-blocking image loading** with smart prefetching and FlatList optimizations.

## Key Changes

### 1. OptimizedImage Usage

All event images now use `OptimizedImage` instead of basic `Image`:

```typescript
// ✅ DO THIS
<OptimizedImage
  source={{ uri: imageUrl }}
  style={styles.image}
  showLoader={true}
  priority="high"
/>

// ❌ DON'T DO THIS
<Image source={{ uri: imageUrl }} style={styles.image} />
```

### 2. FlatList Performance Props

Always include these props for list performance:

```typescript
<FlatList
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={10}
  initialNumToRender={10}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

### 3. Image Prefetching

Prefetch images when loading data:

```typescript
// Prefetch images with priorities
imageCacheService.prefetchImage(url, 'high'); // First/visible
imageCacheService.prefetchImages(urls, 'medium'); // Next few
imageCacheService.prefetchImages(urls, 'low'); // Rest
```

## Priority Levels

| Priority | Use Case            | Example                            |
| -------- | ------------------- | ---------------------------------- |
| `high`   | Currently visible   | Event cards on screen, hero images |
| `medium` | About to be visible | Scroll prefetch, next 5 items      |
| `low`    | Background loading  | Remaining items, thumbnails        |

## Component Checklist

When creating new image-based components:

- [ ] Use `OptimizedImage` instead of `Image`
- [ ] Set appropriate `priority` level
- [ ] Enable `showLoader` for loading state
- [ ] Add `containerStyle` for layout
- [ ] Implement error handling with `onError`
- [ ] Prefetch images when data loads

## FlatList Checklist

When creating scrollable lists:

- [ ] Add `removeClippedSubviews={true}`
- [ ] Set `maxToRenderPerBatch` (typically 10)
- [ ] Set `windowSize` (typically 10)
- [ ] Implement `getItemLayout` if item heights are fixed
- [ ] Memoize `renderItem` with `useCallback`
- [ ] Add prefetching with `onViewableItemsChanged`

## Performance Tips

### ✅ Do's

- Prefetch images before they're needed
- Use priority levels appropriately
- Memoize components and callbacks
- Set fixed item heights when possible
- Show loading states for better UX

### ❌ Don'ts

- Don't use basic `Image` for remote images
- Don't skip FlatList performance props
- Don't load all images at once
- Don't block UI thread with image loading
- Don't forget to show loading indicators

## Testing

### Quick Test Checklist

1. **Scroll Test**: Scroll rapidly - should stay at 60fps
2. **Tap Test**: Tap cards while loading - should navigate instantly
3. **Slow Network**: Test on 3G - cards should remain responsive
4. **Memory Test**: Scroll up/down repeatedly - no memory leaks

## Common Issues

### Issue: Cards still lag

**Solution**: Check that you're using `OptimizedImage` with proper priority

### Issue: Images not loading

**Solution**: Verify image URLs are valid and ImageCacheService is initialized

### Issue: Poor scroll performance

**Solution**: Ensure all FlatList performance props are set

### Issue: High memory usage

**Solution**: Set `removeClippedSubviews={true}` and proper `windowSize`

## Files to Reference

- `src/components/OptimizedImage.tsx` - Image component implementation
- `src/services/ImageCacheService.ts` - Caching service
- `src/components/events/EventCard.tsx` - Example usage
- `src/screens/events/EventsScreen.tsx` - FlatList example

## More Info

See `docs/EVENTS_PERFORMANCE_OPTIMIZATIONS.md` for detailed technical documentation.
