# Double-Tap Navigation Prevention

## Problem
When clicking twice quickly on a chat/group in the groups list, the navigation would stack twice, causing the user to have to press back twice to return to the groups screen.

## Root Cause
React Native's `Pressable` component doesn't have built-in debouncing. When a user taps quickly twice:
1. First tap triggers navigation to `/group-chat/[id]`
2. Second tap (before navigation completes) triggers another navigation to the same route
3. Result: Two instances of the same screen in the navigation stack

## Solution Implemented

### 1. Navigation Lock with useRef
Added a ref to track if navigation is in progress:

```typescript
// Prevent double-tap navigation
const isNavigatingRef = useRef(false);
```

### 2. Debounced Navigation Handler
Created a centralized handler that prevents duplicate navigations:

```typescript
const handleGroupNavigation = useCallback((group: any) => {
  // Prevent double navigation
  if (isNavigatingRef.current) {
    console.log('⚠️ Navigation already in progress, ignoring duplicate tap');
    return;
  }

  isNavigatingRef.current = true;
  
  try {
    const essentialData = getEssentialGroupData(group.rawGroup);
    router.push({
      pathname: `/group-chat/${group.id}` as any,
      params: {
        groupData: JSON.stringify(essentialData),
      },
    });
  } catch (error) {
    console.error('Navigation error:', error);
    router.push(`/group-chat/${group.id}` as any);
  }

  // Reset navigation lock after 1 second
  setTimeout(() => {
    isNavigatingRef.current = false;
  }, 1000);
}, [router]);
```

### 3. Updated All Navigation Points
Replaced inline navigation handlers with the debounced handler:

**Before:**
```typescript
<Pressable
  onPress={() => {
    try {
      const essentialData = getEssentialGroupData(group.rawGroup);
      router.push({
        pathname: `/group-chat/${group.id}` as any,
        params: { groupData: JSON.stringify(essentialData) },
      });
    } catch (error) {
      router.push(`/group-chat/${group.id}` as any);
    }
  }}
>
```

**After:**
```typescript
<Pressable
  onPress={() => handleGroupNavigation(group)}
>
```

## How It Works

### Normal Single Tap
```
User taps → isNavigatingRef = false → Navigate → Set isNavigatingRef = true
→ Wait 1s → Reset isNavigatingRef = false
```

### Double Tap (Prevented)
```
User taps (1st) → isNavigatingRef = false → Navigate → Set isNavigatingRef = true
User taps (2nd) → isNavigatingRef = true → BLOCKED ⛔
→ Wait 1s → Reset isNavigatingRef = false
```

## Benefits

✅ **Prevents Duplicate Navigation** - Only one navigation per tap session
✅ **Better UX** - User doesn't get stuck in nested screens
✅ **Centralized Logic** - All navigation goes through one handler
✅ **Console Logging** - Easy to debug duplicate tap attempts
✅ **Automatic Reset** - Lock clears after 1 second

## Testing

### Test Case 1: Single Tap
1. Tap once on a chat
2. **Expected:** Navigate to chat screen
3. Press back
4. **Expected:** Return to groups screen

### Test Case 2: Double Tap
1. Tap twice quickly on a chat
2. **Expected:** Navigate to chat screen only once
3. Console shows: "⚠️ Navigation already in progress, ignoring duplicate tap"
4. Press back
5. **Expected:** Return to groups screen (not nested)

### Test Case 3: Rapid Switching
1. Tap on Chat A
2. Immediately tap on Chat B
3. **Expected:** Navigate to Chat A (second tap blocked)
4. Wait 1 second
5. Tap on Chat B
6. **Expected:** Navigate to Chat B

## Configuration

### Lock Duration
Currently set to 1000ms (1 second). Can be adjusted:

```typescript
setTimeout(() => {
  isNavigatingRef.current = false;
}, 1000); // Change this value
```

**Recommendations:**
- 500ms - Faster reset, but may allow some double-taps
- 1000ms - Good balance (current)
- 1500ms - Very safe, but may feel sluggish

### Alternative: Navigation Event Listener
For more sophisticated control, could listen to navigation events:

```typescript
useEffect(() => {
  const unsubscribe = router.addListener('state', () => {
    // Reset lock when navigation completes
    isNavigatingRef.current = false;
  });
  
  return unsubscribe;
}, [router]);
```

## Edge Cases Handled

### 1. Navigation Error
If navigation fails, lock still resets after timeout:
```typescript
try {
  router.push(...);
} catch (error) {
  // Lock will reset via setTimeout
}
```

### 2. Slow Navigation
Lock prevents taps during slow navigation (network delay, etc.)

### 3. User Backs Out Quickly
Lock resets after 1s even if user backs out immediately

## Related Files
- `app/(tabs)/groups.tsx` - Groups list with debounced navigation
- `app/group-chat/[id].tsx` - Destination screen

## Alternative Solutions Considered

### 1. Disabled State
```typescript
const [isNavigating, setIsNavigating] = useState(false);
// Problem: Causes re-render, may be slower
```

### 2. Throttle Library
```typescript
import { throttle } from 'lodash';
// Problem: Adds dependency, overkill for simple case
```

### 3. Navigation Guard
```typescript
router.beforeEach((to, from, next) => {
  // Problem: Not available in Expo Router
});
```

## Summary

The double-tap prevention is now active. Users can tap as fast as they want, but only the first tap within a 1-second window will trigger navigation. This prevents the frustrating experience of having to press back multiple times.
