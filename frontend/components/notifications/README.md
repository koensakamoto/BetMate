# Modern Notification Cards

This directory contains modernized notification card components inspired by premium apps like Uber, DoorDash, Instagram, and Hinge.

## Current Implementation

### BetDeadlineCard

A premium card design for BET_DEADLINE notifications featuring:

#### Visual Design
- **Card-based layout** with elevated appearance (subtle borders and backgrounds)
- **Gradient accent bar** (left side) - Orange to red for urgent deadlines
- **Animated icon** with gradient background and glow effect
- **Clean typography hierarchy**
  - Title: 13px, bold, uppercase
  - Bet name: 17px, bold, white
  - Timestamp: 13px, semi-transparent

#### Smart Features
- **Urgency detection** - Automatically detects if deadline is < 2 hours
- **Dynamic colors** - Gradient changes based on urgency level
- **Time extraction** - Parses notification message to show countdown
- **Unread indicator** - Glowing dot with shadow effect

#### Interactive Elements
- **Gradient action button** (teal gradient, "VIEW BET")
- **Touch feedback** - 0.8 opacity on press
- **Visual states** - Read notifications have reduced opacity (0.7)

#### Layout Structure
```
┌─────────────────────────────────────┐
│ ║  [Icon]           3 hours ago     │ ← Header with gradient icon
│ ║  BET DEADLINE APPROACHING         │ ← Title
│ ║  "Championship Match"             │ ← Bet name
│ ║                                   │
│ ║  ⏱️ Closes in 1 hour              │ ← Urgency indicator
│ ║                                   │
│ ║  [VIEW BET →]                     │ ← Action button
└─────────────────────────────────────┘
```

### Design Tokens

#### Colors
- **Urgent Gradient**: `#FF6B35` → `#FF4500` (orange to red)
- **Warning Gradient**: `#FFB800` → `#FF8C00` (gold to orange)
- **Action Gradient**: `#00D4AA` → `#00B894` (teal)
- **Unread Indicator**: `#00D4AA` (teal with glow)

#### Spacing
- Card padding: 20px vertical, 16px horizontal
- Card margin: 8px vertical, 20px horizontal
- Border radius: 12px
- Icon size: 44x44px
- Accent bar: 4px width

#### Typography
- Title: 13px, 700 weight, 0.8 letter-spacing
- Bet name: 17px, 700 weight
- Time info: 14px, 600 weight
- Timestamp: 13px, 400 weight
- Button: 15px, 700 weight, 0.5 letter-spacing

## Usage

```typescript
import { BetDeadlineCard } from '../components/notifications/BetDeadlineCard';

<BetDeadlineCard
  notification={notification}
  onPress={() => handleNotificationPress(notification)}
/>
```

## Future Enhancements

### Additional Notification Types to Modernize

1. **BET_RESULT**
   - Confetti animation for wins
   - Color-coded cards (green/red)
   - Prominent earnings display

2. **GROUP_INVITE**
   - Blurred group cover image background
   - Member avatars preview
   - Two-button layout (Accept/Decline)

3. **FRIEND_REQUEST**
   - Actual profile picture
   - Mutual friends count
   - Social proof indicators

4. **ACHIEVEMENT_UNLOCKED**
   - Gold/purple gradient
   - Trophy icon with shine effect
   - XP gained highlight

### Micro-Interactions
- Swipe gestures (swipe left to mark read, right to open)
- Haptic feedback
- Loading states with skeleton screens
- Shimmer effects

### Accessibility
- Proper contrast ratios
- Screen reader support
- Touch target sizes (48x48 minimum)

## Dependencies

- `expo-linear-gradient` - For gradient backgrounds
- `react-native-reanimated` - For animations (future)
- `react-native-gesture-handler` - For swipe gestures (future)
- `date-fns` - For timestamp formatting
