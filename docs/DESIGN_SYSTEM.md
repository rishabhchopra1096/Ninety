# Ninety Design System

**Version:** 1.0
**Last Updated:** 2025-11-04
**Based on:** CalAI visual design + Ninety's chat-first interaction model

---

## Table of Contents

1. [Design Principles](#design-principles)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Shadows & Elevation](#shadows--elevation)
6. [Components](#components)
7. [Iconography](#iconography)
8. [Animation](#animation)
9. [Accessibility](#accessibility)

---

## Design Principles

### 1. Minimalism
- Clean, uncluttered interfaces
- Black and white as primary colors
- Orange accent for energy and action
- Generous white space

### 2. Clarity
- Clear visual hierarchy
- Large, readable typography
- High contrast for accessibility
- Obvious interactive elements

### 3. Consistency
- Reusable components across all screens
- Predictable patterns
- Unified visual language

### 4. Balance
- Hybrid interaction model:
  - Chat-first for complex logging
  - Direct UI for quick actions (photo uploads, viewing data)
- Visual richness without overwhelming

---

## Color System

### Primary Colors

```typescript
colors: {
  // Core
  primary: '#000000',      // Black - primary actions, text
  secondary: '#FF6B00',    // Orange - accents, CTAs
  background: '#FFFFFF',   // White - main background
}
```

### Neutrals (Grays)

```typescript
neutral: {
  50: '#F8F9FA',   // Lightest - card backgrounds
  100: '#F5F5F7',  // Input backgrounds
  200: '#E5E7EB',  // Borders, dividers
  300: '#D1D5DB',  // Disabled states
  400: '#9CA3AF',  // Placeholder text
  500: '#6B7280',  // Secondary text
  600: '#4B5563',  // Tertiary text
  900: '#000000',  // Primary text (same as primary)
}
```

### Accent Colors

```typescript
accent: {
  orange: '#FF6B00',        // Main accent
  orangeLight: '#FFE8D6',   // Light orange backgrounds
}
```

### Status Colors

```typescript
status: {
  success: '#10B981',  // Green
  warning: '#F59E0B',  // Amber
  error: '#EF4444',    // Red
  info: '#3B82F6',     // Blue
}
```

### Macro Colors (Nutrition)

```typescript
macro: {
  protein: '#FF6B88',  // Pink/Red
  carbs: '#FFA756',    // Orange
  fats: '#6B9DFF',     // Blue
}
```

### Semantic Usage

| Color | Use Case |
|-------|----------|
| `primary` | Primary buttons, active states, headers |
| `secondary` | Accent elements, CTAs, streaks, flames |
| `neutral[50]` | Card backgrounds |
| `neutral[100]` | Input fields, disabled buttons |
| `neutral[200]` | Borders, dividers |
| `neutral[500]` | Secondary text, inactive icons |
| `status.success` | Success messages, "Healthy" badges |
| `status.error` | Error states, validation |
| `macro.*` | Nutrition visualization (protein, carbs, fats) |

### ✅ Do's

- Use black for primary text and buttons
- Use orange sparingly for accents and CTAs
- Maintain high contrast (black on white)
- Use semantic colors for status (green = success, red = error)

### ❌ Don'ts

- Don't use multiple accent colors
- Don't use low-contrast gray on gray
- Don't use orange for large background areas
- Don't mix custom colors - stick to the palette

---

## Typography

### Font Family

```typescript
fontFamily: {
  regular: 'System',  // San Francisco on iOS, Roboto on Android
  medium: 'System',
  semibold: 'System',
  bold: 'System',
}
```

### Type Scale

```typescript
fontSize: {
  display: 72,   // Large calorie numbers, focal points
  h1: 32,        // Screen titles
  h2: 28,        // Section headers (alternative)
  h3: 24,        // Card titles
  h4: 20,        // Subsection headers
  body: 16,      // Body text, buttons
  bodySmall: 14, // Descriptions, metadata
  caption: 12,   // Labels, tiny text
}
```

### Font Weights

```typescript
fontWeight: {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
}
```

### Line Heights

```typescript
lineHeight: {
  tight: 1.2,    // Large numbers, tight headers
  normal: 1.5,   // Body text
  relaxed: 1.75, // Long descriptions
}
```

### Typography Patterns

| Element | Size | Weight | Color | Line Height |
|---------|------|--------|-------|-------------|
| Screen Title | 32px | Bold | Black | 1.2 |
| Section Header | 24px | Bold | Black | 1.2 |
| Card Title | 20px | Semibold | Black | 1.2 |
| Body Text | 16px | Regular | Black | 1.5 |
| Secondary Text | 14px | Regular | Gray | 1.5 |
| Button Label | 16-18px | Medium | White/Black | 1.2 |
| Caption | 12px | Regular | Gray | 1.5 |
| Display Number | 72px | Bold | Black | 1.0 |

### ✅ Do's

- Use system fonts for native feel
- Maintain clear hierarchy (size + weight)
- Use 16px minimum for body text
- Keep line-height comfortable for reading

### ❌ Don'ts

- Don't use custom fonts (performance cost)
- Don't go below 12px font size
- Don't use too many font sizes (stick to scale)
- Don't use light font weights on mobile

---

## Spacing & Layout

### Spacing Scale (Base: 4px)

```typescript
spacing: {
  0: 0,
  1: 4,     // xs - tight spacing
  2: 8,     // sm - small gaps
  3: 12,    // md (small) - component gaps
  4: 16,    // md - standard spacing
  5: 20,    // md-lg - card padding
  6: 24,    // lg - section spacing
  8: 32,    // xl - large spacing
  10: 40,   // 2xl - extra large
  12: 48,   // 3xl - very large
  16: 64,   // 4xl - massive spacing
}
```

### Common Spacing Patterns

| Element | Spacing |
|---------|---------|
| Screen horizontal padding | 20-24px |
| Screen top/bottom margin | 16-24px |
| Card padding | 16-20px (small), 24px (large) |
| Button padding horizontal | 16-24px |
| Button padding vertical | 14-16px |
| Section spacing | 24-32px |
| Component gaps (vertical) | 12-16px |
| Small component gaps | 8px |
| Icon-text gap | 8-12px |
| List item spacing | 2-4px (tight), 8px (comfortable) |

### Layout Grid

**Screen Layout:**
```
┌─────────────────────────┐
│ Header (60-80px)        │
├─────────────────────────┤
│ Horizontal Padding:     │
│ 20-24px                 │
│                         │
│ Content (Scrollable)    │
│                         │
│ Section spacing: 24-32px│
│                         │
├─────────────────────────┤
│ Tab Bar (60px + safe)   │
└─────────────────────────┘
```

**Two-Column Grid (Stat Cards):**
- Gap: 12px
- Equal width columns
- Use for metric cards, small stats

**Horizontal Scroll:**
- Full width
- Horizontal padding: 20px
- Item spacing: 12px
- Snap to items

### Safe Area

Always respect safe area insets:
```typescript
import { SafeAreaView } from 'react-native-safe-area-context';

// Use SafeAreaView for full-screen layouts
<SafeAreaView edges={['top', 'bottom']}>
```

### ✅ Do's

- Use consistent spacing from the scale
- Add generous padding in cards (20-24px)
- Keep horizontal rhythm consistent
- Respect safe areas on all devices

### ❌ Don'ts

- Don't use arbitrary spacing values
- Don't crowd elements together
- Don't forget safe area on iPhone X+
- Don't use uneven spacing between similar elements

---

## Shadows & Elevation

### Shadow Levels

```typescript
shadows: {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },

  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },

  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },

  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
}
```

### Elevation Hierarchy

| Level | Use Case | Shadow |
|-------|----------|--------|
| 0 | Flat elements, backgrounds | none |
| 1 | Meal cards, small cards | sm |
| 2 | Main content cards, inputs (focused) | md |
| 3 | Modals, floating buttons | lg |
| 4 | FAB (floating action button) | xl |

### ✅ Do's

- Use subtle shadows (CalAI style is minimal)
- Apply shadows to elevated elements only
- Use elevation hierarchy consistently
- Test shadows on both light and dark backgrounds

### ❌ Don'ts

- Don't overuse shadows
- Don't use heavy shadows (looks dated)
- Don't apply shadows to flat UI elements
- Don't use inconsistent shadow styles

---

## Components

### Button

#### Primary Button

**Appearance:**
- Background: Black (#000000)
- Text: White (#FFFFFF)
- Height: 56px
- Border radius: 28px (pill-shaped)
- Font: Medium, 16-18px
- Shadow: sm

**Usage:**
```tsx
import { Button } from '@/components';

<Button variant="primary" onPress={handleSubmit}>
  Continue
</Button>
```

**States:**
- Default: Black background
- Pressed: opacity 0.8
- Disabled: Gray background (#D1D5DB), gray text (#9CA3AF)

#### Secondary Button

**Appearance:**
- Background: White (#FFFFFF)
- Text: Black (#000000)
- Border: 1px solid #E5E7EB
- Height: 56px
- Border radius: 28px
- Font: Medium, 16-18px

**Usage:**
```tsx
<Button variant="secondary" onPress={handleAction}>
  Not now
</Button>
```

#### Ghost Button

**Appearance:**
- Background: Transparent
- Text: Black (#000000)
- Height: 44px
- Font: Medium, 16px
- No border, no shadow

**Usage:**
```tsx
<Button variant="ghost" onPress={handleLink}>
  Learn more
</Button>
```

#### Icon Button

**Appearance:**
- Size: 44px (small), 56px (medium), 64px (large)
- Background: Black (#000000)
- Icon: White, 24px
- Border radius: 50% (circle)
- Shadow: lg (for FAB) or sm (for regular)

**Usage:**
```tsx
<IconButton icon="plus" size="large" variant="fab" onPress={handleAdd} />
```

---

### Card

#### Base Card

**Appearance:**
- Background: White (#FFFFFF)
- Border radius: 16px
- Padding: 20px
- Shadow: md

**Usage:**
```tsx
import { Card } from '@/components';

<Card>
  {/* Content */}
</Card>
```

#### Stat Card (Small Metric Card)

**Appearance:**
- Background: White
- Border radius: 12px
- Padding: 16px
- Shadow: sm
- Typical size: 100-120px square

**Content Pattern:**
- Progress ring (top)
- Large number (center)
- Label (bottom)

**Usage:**
```tsx
<StatCard
  value="168g"
  label="Protein left"
  progress={0.65}
  color="#FF6B88"
/>
```

#### Hero Card (Large Calorie Card)

**Appearance:**
- Background: White
- Border radius: 20px
- Padding: 24px
- Shadow: md
- Full width

**Content Pattern:**
- Left: Large number (72px) + label
- Right: Large progress ring

**Usage:**
```tsx
<HeroCard
  value={1926}
  label="Calories left"
  progress={0.75}
  additionalInfo="+334"
/>
```

---

### Progress Indicators

#### Progress Ring (Circular)

**Specifications:**
- Stroke width: 8-10px
- Background ring: Light gray (#E5E7EB)
- Progress ring: Color-coded
- Sizes:
  - Small: 60px (stat cards)
  - Medium: 100px
  - Large: 120-140px (hero card)

**Usage:**
```tsx
<ProgressRing
  size="medium"
  progress={0.75}
  color="#FF6B00"
  strokeWidth={8}
>
  <Text style={styles.centerText}>75%</Text>
</ProgressRing>
```

**Animation:**
- Animate on mount
- Duration: 800ms
- Easing: ease-in-out

#### Progress Bar (Linear)

**Specifications:**
- Height: 4-6px
- Background: Light gray (#E5E7EB)
- Fill: Black or color-coded
- Border radius: 3px (rounded ends)

**Usage:**
```tsx
<ProgressBar progress={0.65} color="#FF6B00" height={4} />
```

---

### Badge

#### Pill Badge

**Appearance:**
- Background: White with border OR colored fill
- Border radius: 12-16px (pill)
- Padding: 6-8px horizontal, 4-6px vertical
- Font: Medium, 12-14px

**Variants:**
- Outlined: White bg, gray border, black text
- Filled: Colored bg, white text
- Status: Color-coded (green for success, etc.)

**Usage:**
```tsx
<Badge variant="filled" color="success">
  Healthy
</Badge>

<Badge variant="outlined">
  Recommended
</Badge>
```

#### Streak Badge

**Appearance:**
- Flame icon + number
- White background
- Border radius: 16px
- Padding: 8px 12px
- Shadow: sm

**Usage:**
```tsx
<StreakBadge count={15} />
```

---

### Input

#### Text Input

**Appearance:**
- Background: #F5F5F7
- Border: 1px solid transparent
- Focused border: 1px solid #000000
- Border radius: 12px
- Height: 48-52px
- Padding: 14px horizontal
- Font: Regular, 16px
- Placeholder: #9CA3AF

**Usage:**
```tsx
<Input
  placeholder="Enter your weight"
  value={weight}
  onChangeText={setWeight}
  keyboardType="numeric"
/>
```

**States:**
- Default: Gray background, transparent border
- Focused: Gray background, black border
- Error: Red border, error message below
- Disabled: Lighter gray, reduced opacity

---

### Meal/Nutrition Card

**Appearance:**
- Layout: Horizontal (image + content)
- Background: White
- Border radius: 12px
- Shadow: sm
- Padding: 12px

**Content:**
- Image: 80x80px, rounded 12px (left)
- Title: Medium, 16px, black
- Time: Regular, 14px, gray
- Calories: Flame icon + number
- Macros: Row of colored icons + text (protein, carbs, fats)

**Usage:**
```tsx
<NutritionCard
  image={mealImage}
  title="Lemon Herb Salmon"
  time="9:00am"
  calories={520}
  protein={38}
  carbs={36}
  fats={26}
/>
```

---

### Activity Card

**Appearance:**
- Similar to NutritionCard but with workout-specific data
- Icon or emoji instead of photo (optional)
- Duration + intensity displayed

**Usage:**
```tsx
<ActivityCard
  icon="💪"
  title="Weight lifting"
  time="6:30pm"
  duration="15 Mins"
  intensity="Medium"
  calories={50}
/>
```

---

### Avatar

**Specifications:**
- Sizes: 32px (sm), 44px (md), 64px (lg), 80px (xl)
- Border radius: 50% (circle)
- Border: Optional 2px white border (for layered avatars)
- Background: Colored if no image (from palette)
- Text: Initials, white, medium weight

**Usage:**
```tsx
<Avatar
  size="md"
  source={{ uri: userPhotoUrl }}
  initials="RC"
  backgroundColor="#FF6B00"
/>
```

---

### Modal / Bottom Sheet

**Appearance:**
- Background: White
- Border radius: 20px (top corners only)
- Padding: 20-24px
- Handle bar: 4px × 36px gray pill at top center
- Shadow: xl
- Backdrop: rgba(0,0,0,0.4)

**Animation:**
- Slide from bottom
- Duration: 300ms
- Easing: ease-out

**Usage:**
```tsx
<BottomSheet visible={isVisible} onClose={handleClose}>
  {/* Content */}
</BottomSheet>
```

---

### Empty State

**Appearance:**
- Icon: 48-64px, gray (#9CA3AF)
- Title: Medium, 16px, black, centered
- Description: Regular, 14px, gray, centered
- Optional CTA button below
- Spacing: 16px between elements
- Background: Light gray card (#F8F9FA) or transparent

**Usage:**
```tsx
<EmptyState
  icon="inbox"
  title="No meals logged yet"
  description="Tap + to add your first meal of the day"
  action={
    <Button variant="primary" onPress={handleAdd}>
      Add Meal
    </Button>
  }
/>
```

---

### Bottom Navigation (Tab Bar)

**Specifications:**
- Height: 60px + safe area inset
- Background: White (#FFFFFF)
- Border top: 1px solid #E5E7EB
- Icons: 24px
- Active color: Black (#000000)
- Inactive color: Gray (#6B7280)
- Label: 12px, regular (optional, can be icons only)

**FAB (Center Button):**
- Size: 56px diameter
- Background: Black (#000000)
- Icon: White + (plus), 24px
- Shadow: xl
- Position: Elevated above tab bar by 8px

**Usage:**
```tsx
<Tab.Navigator
  screenOptions={{
    tabBarActiveTintColor: '#000000',
    tabBarInactiveTintColor: '#6B7280',
    // ... other options
  }}
>
  <Tab.Screen name="Home" component={HomeScreen} />
  <Tab.Screen name="Progress" component={ProgressScreen} />
  <Tab.Screen name="Add" component={AddScreen} /> {/* FAB */}
  <Tab.Screen name="Group" component={GroupScreen} />
  <Tab.Screen name="Profile" component={ProfileScreen} />
</Tab.Navigator>
```

---

## Iconography

### Style

- **Type:** Outlined (stroke-based)
- **Stroke weight:** 2px
- **Corners:** Rounded
- **Style:** Modern, minimal, consistent

### Sizes

```typescript
iconSizes: {
  xs: 16,  // Inline icons
  sm: 20,  // Cards, buttons
  md: 24,  // Navigation, primary actions
  lg: 32,  // Feature illustrations
  xl: 48,  // Empty states, onboarding
}
```

### Recommended Library

**Lucide React Native** (matches CalAI style best):
```bash
npm install lucide-react-native
```

Or **React Native Vector Icons** (Feather set):
```bash
npm install react-native-vector-icons
```

### Common Icons

| Icon | Usage | Size |
|------|-------|------|
| `home` | Home tab | 24px |
| `bar-chart-2` | Progress tab | 24px |
| `plus` | Add button, FAB | 24px |
| `users` | Group tab | 24px |
| `user` | Profile tab | 24px |
| `camera` | Photo capture | 24px |
| `mic` | Voice input | 20px |
| `flame` | Calories, streak | 20px |
| `search` | Search | 20px |
| `x` | Close | 20px |
| `chevron-right` | Navigation | 20px |
| `check` | Success | 20px |
| `alert-circle` | Error | 20px |

### ✅ Do's

- Use consistent icon library throughout
- Match icon weight/style
- Align icons with text baseline
- Use semantic colors (red for delete, green for success)

### ❌ Don'ts

- Don't mix icon libraries
- Don't use filled and outlined inconsistently
- Don't make icons too small (<16px)
- Don't use icons without labels for critical actions

---

## Animation

### Timing

```typescript
animation: {
  fast: 150,      // Quick micro-interactions
  normal: 250,    // Standard transitions
  slow: 400,      // Complex animations
  verySlow: 800,  // Progress rings, dramatic reveals
}
```

### Easing

```typescript
easing: {
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
  spring: { tension: 300, friction: 20 },
}
```

### Common Animations

#### Button Press
```typescript
// Scale down slightly
scale: 0.95
duration: 100ms
easing: ease-out
```

#### Modal/Sheet Appearance
```typescript
// Slide from bottom
translateY: from 100% to 0%
duration: 300ms
easing: ease-out
// Backdrop fade in
opacity: from 0 to 0.4
duration: 300ms
```

#### Progress Ring
```typescript
// Stroke animation
duration: 800ms
easing: ease-in-out
```

#### Tab Switch
```typescript
// Fade + slight slide
opacity: 0 to 1
translateX: ±10px to 0
duration: 200ms
```

### ✅ Do's

- Keep animations subtle and fast
- Use easing for natural feel
- Animate state changes
- Test on low-end devices

### ❌ Don'ts

- Don't over-animate
- Don't use slow animations for common actions
- Don't animate everything (too distracting)
- Don't forget to test performance

---

## Accessibility

### Touch Targets

**Minimum sizes (iOS Human Interface Guidelines):**
- Touch target: 44x44px minimum
- Buttons: 56px height (generous)
- Icon buttons: 44px minimum, 56px recommended
- FAB: 56px+

### Color Contrast

**WCAG AA Requirements:**
- Normal text: 4.5:1 contrast ratio
- Large text (18px+): 3:1 contrast ratio
- UI components: 3:1

**Our Palette:**
- Black on white: 21:1 ✅ (AAA)
- Gray (#6B7280) on white: 5:2:1 ✅ (AA)
- Orange on white: Test for smaller text
- Colored text: Always test

### Typography

- Minimum body text: 16px (exceeds 14px WCAG minimum)
- Support Dynamic Type / font scaling
- Maintain hierarchy when text scales
- Test with 200% zoom

### Screen Readers

- Add meaningful `accessibilityLabel` to all interactive elements
- Use `accessibilityHint` for context
- Mark decorative elements as `accessibilityElementsHidden`
- Test with VoiceOver (iOS) and TalkBack (Android)

### Focus & Navigation

- Ensure keyboard navigation works
- Visible focus indicators
- Logical tab order
- Don't trap focus in modals

### ✅ Do's

- Test with screen readers
- Use semantic HTML/RN components
- Provide text alternatives for images
- Maintain high contrast
- Support font scaling

### ❌ Don'ts

- Don't rely on color alone for meaning
- Don't use images of text
- Don't have touch targets smaller than 44px
- Don't ignore accessibility warnings

---

## Usage Examples

### Example 1: Calorie Dashboard

```tsx
import { View, Text, ScrollView } from 'react-native';
import { Card, ProgressRing, StatCard, NutritionCard } from '@/components';
import { colors, spacing } from '@/constants/theme';

function HomeScreen() {
  return (
    <ScrollView style={{ padding: spacing[6] }}>
      {/* Hero Calorie Card */}
      <Card style={{ borderRadius: 20, padding: spacing[6], marginBottom: spacing[6] }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontSize: 72, fontWeight: '700' }}>1926</Text>
            <Text style={{ fontSize: 16, color: colors.neutral[500] }}>Calories left</Text>
          </View>
          <ProgressRing size="large" progress={0.75} color={colors.secondary}>
            <Text>75%</Text>
          </ProgressRing>
        </View>

        {/* Macro Cards Row */}
        <View style={{ flexDirection: 'row', gap: spacing[3], marginTop: spacing[5] }}>
          <StatCard value="168g" label="Protein left" progress={0.65} color={colors.macro.protein} />
          <StatCard value="192g" label="Carbs left" progress={0.50} color={colors.macro.carbs} />
          <StatCard value="53g" label="Fat left" progress={0.80} color={colors.macro.fats} />
        </View>
      </Card>

      {/* Recently Uploaded Section */}
      <Text style={{ fontSize: 20, fontWeight: '600', marginBottom: spacing[4] }}>
        Recently uploaded
      </Text>

      <NutritionCard
        image={require('@/assets/meal.jpg')}
        title="Lemon Herb Salmon"
        time="9:00am"
        calories={520}
        protein={38}
        carbs={36}
        fats={26}
      />
    </ScrollView>
  );
}
```

### Example 2: Button Group

```tsx
import { View } from 'react-native';
import { Button } from '@/components';
import { spacing } from '@/constants/theme';

function OnboardingScreen() {
  return (
    <View style={{ padding: spacing[6], gap: spacing[4] }}>
      <Button variant="primary" onPress={handleContinue}>
        Continue
      </Button>

      <Button variant="secondary" onPress={handleSkip}>
        Skip for now
      </Button>

      <Button variant="ghost" onPress={handleLearnMore}>
        Learn more
      </Button>
    </View>
  );
}
```

---

## Migration Guide

### Updating Existing Components

1. **Update imports:**
```tsx
// Old
import { colors } from '../constants/theme';

// New
import { colors, spacing, shadows } from '@/constants/theme';
import { Button, Card } from '@/components';
```

2. **Replace inline styles with theme values:**
```tsx
// Old
<View style={{ backgroundColor: '#10A37F', padding: 16, borderRadius: 12 }}>

// New
<Card style={{ backgroundColor: colors.primary, padding: spacing[4] }}>
```

3. **Use component library:**
```tsx
// Old
<TouchableOpacity style={styles.button} onPress={handlePress}>
  <Text style={styles.buttonText}>Submit</Text>
</TouchableOpacity>

// New
<Button variant="primary" onPress={handlePress}>
  Submit
</Button>
```

---

## Resources

- **Figma File:** [Link to design file if created]
- **Component Storybook:** [Link if using Storybook]
- **GitHub:** `/src/components/` for component source code
- **Icons:** [Lucide Icons](https://lucide.dev/) or [React Native Vector Icons](https://oblador.github.io/react-native-vector-icons/)

---

## Questions?

For design system questions or contributions, contact the development team or open an issue on GitHub.

**Version History:**
- 1.0 (2025-11-04): Initial design system based on CalAI visual design

---

**End of Design System Documentation**
