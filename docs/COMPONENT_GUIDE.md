# Component Usage Guide

**Ninety Design System Components**
**Version:** 1.0
**Last Updated:** 2025-11-04

Complete reference for using Ninety's component library based on CalAI design.

---

## Table of Contents

1. [Installation & Setup](#installation--setup)
2. [Core Components](#core-components)
   - [Button](#button)
   - [Card](#card)
   - [ProgressRing](#progressring)
   - [ProgressBar](#progressbar)
3. [Content Components](#content-components)
   - [StatCard](#statcard)
   - [NutritionCard](#nutritioncard)
   - [ActivityCard](#activitycard)
4. [Utility Components](#utility-components)
   - [Badge](#badge)
   - [IconButton](#iconbutton)
   - [Avatar](#avatar)
   - [EmptyState](#emptystate)
5. [Examples](#examples)
6. [Best Practices](#best-practices)

---

## Installation & Setup

### Import Components

All components can be imported from the main index:

```tsx
import { Button, Card, ProgressRing, Badge } from '@/components';
```

### Import Theme Values

```tsx
import { colors, spacing, typography, shadows } from '@/constants/theme';
```

### TypeScript Support

All components export their prop types:

```tsx
import { ButtonProps, CardProps } from '@/components';
```

---

## Core Components

### Button

Primary action buttons with three variants: primary, secondary, and ghost.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'ghost'` | `'primary'` | Button style variant |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Button size |
| `loading` | `boolean` | `false` | Show loading spinner |
| `disabled` | `boolean` | `false` | Disable button |
| `children` | `ReactNode` | required | Button text/content |
| `style` | `ViewStyle` | - | Custom container style |
| `textStyle` | `TextStyle` | - | Custom text style |

#### Examples

```tsx
// Primary button (black background, white text)
<Button variant="primary" onPress={handleSubmit}>
  Continue
</Button>

// Secondary button (white background, black text, bordered)
<Button variant="secondary" onPress={handleCancel}>
  Cancel
</Button>

// Ghost button (transparent background)
<Button variant="ghost" onPress={handleLink}>
  Learn more
</Button>

// Loading state
<Button variant="primary" loading={isLoading}>
  Submitting...
</Button>

// Disabled state
<Button variant="primary" disabled>
  Disabled
</Button>

// Custom size
<Button variant="primary" size="large" onPress={handleAction}>
  Large Button
</Button>
```

#### When to Use

- **Primary**: Main CTA, important actions
- **Secondary**: Alternative actions, cancel buttons
- **Ghost**: Tertiary actions, links

---

### Card

Flexible container with elevation/shadow support.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `elevation` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Shadow level |
| `padding` | `'none' \| 'small' \| 'medium' \| 'large'` | `'medium'` | Internal padding |
| `radius` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'lg'` | Border radius |
| `backgroundColor` | `string` | `colors.background` | Background color |
| `children` | `ReactNode` | required | Card content |
| `style` | `ViewStyle` | - | Custom style |

#### Examples

```tsx
// Basic card
<Card>
  <Text>Card content</Text>
</Card>

// Card with custom elevation and padding
<Card elevation="lg" padding="large">
  <Text>Elevated card with more padding</Text>
</Card>

// Hero card (large calorie display)
<Card elevation="md" padding="large" radius="xl">
  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
    <View>
      <Text style={{ fontSize: 72, fontWeight: '700' }}>1926</Text>
      <Text>Calories left</Text>
    </View>
    <ProgressRing size="large" progress={0.75} color={colors.secondary}>
      <Text>75%</Text>
    </ProgressRing>
  </View>
</Card>

// Flat card (no shadow)
<Card elevation="none" padding="small">
  <Text>Flat card</Text>
</Card>
```

#### When to Use

- Container for grouped content
- Meal cards, stat cards, info sections
- Any content that needs elevation

---

### ProgressRing

Animated circular progress indicator.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `progress` | `number` (0-1) | required | Progress value |
| `size` | `'small' \| 'medium' \| 'large' \| number` | `'medium'` | Ring size |
| `color` | `string` | `colors.secondary` | Progress color |
| `backgroundColor` | `string` | `colors.neutral[200]` | Background ring color |
| `strokeWidth` | `number` | `8` | Ring thickness |
| `animated` | `boolean` | `true` | Animate on mount |
| `children` | `ReactNode` | - | Center content |
| `style` | `ViewStyle` | - | Custom style |

#### Examples

```tsx
// Basic progress ring
<ProgressRing progress={0.75} color={colors.secondary}>
  <Text style={{ fontSize: 20, fontWeight: '600' }}>75%</Text>
</ProgressRing>

// Small progress ring (stat cards)
<ProgressRing
  size="small"
  progress={0.65}
  color={colors.macro.protein}
  strokeWidth={6}
>
  <Text>🍗</Text>
</ProgressRing>

// Large progress ring (hero card)
<ProgressRing
  size="large"
  progress={0.82}
  color={colors.secondary}
  strokeWidth={10}
>
  <View>
    <Text style={{ fontSize: 28, fontWeight: '700' }}>82%</Text>
    <Text style={{ fontSize: 12, color: colors.neutral[500] }}>Complete</Text>
  </View>
</ProgressRing>

// Custom size
<ProgressRing size={120} progress={0.5} color={colors.status.success}>
  <Text>50%</Text>
</ProgressRing>

// No animation
<ProgressRing progress={1.0} animated={false} color={colors.status.success}>
  <Text>✓</Text>
</ProgressRing>
```

#### When to Use

- Calorie/macro progress display
- Goal completion visualization
- Day streak indicators
- Any circular progress visualization

---

### ProgressBar

Animated linear progress bar.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `progress` | `number` (0-1) | required | Progress value |
| `color` | `string` | `colors.primary` | Progress color |
| `backgroundColor` | `string` | `colors.neutral[200]` | Background color |
| `height` | `number` | `4` | Bar height |
| `animated` | `boolean` | `true` | Animate on mount |
| `style` | `ViewStyle` | - | Custom style |

#### Examples

```tsx
// Basic progress bar
<ProgressBar progress={0.65} color={colors.secondary} />

// Thick progress bar
<ProgressBar progress={0.85} color={colors.status.success} height={6} />

// Custom colors
<ProgressBar
  progress={0.4}
  color={colors.macro.protein}
  backgroundColor={colors.neutral[100]}
/>

// Progress indicator at top of screen
<View style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
  <ProgressBar progress={onboardingProgress} height={3} />
</View>
```

#### When to Use

- Onboarding step indicators
- Loading progress
- Goal progress (linear)
- File upload progress

---

## Content Components

### StatCard

Small metric card with progress ring and value.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string \| number` | required | Metric value |
| `label` | `string` | required | Label text |
| `progress` | `number` (0-1) | required | Progress value |
| `color` | `string` | `colors.secondary` | Progress color |
| `icon` | `ReactNode` | - | Optional icon/emoji |
| `ringSize` | `'small' \| 'medium'` | `'small'` | Ring size |
| `style` | `ViewStyle` | - | Custom style |

#### Examples

```tsx
// Protein stat card
<StatCard
  value="168g"
  label="Protein left"
  progress={0.65}
  color={colors.macro.protein}
/>

// Carbs stat card with icon
<StatCard
  value="192g"
  label="Carbs left"
  progress={0.50}
  color={colors.macro.carbs}
  icon={<Text style={{ fontSize: 20 }}>🌾</Text>}
/>

// Numeric value
<StatCard
  value={1926}
  label="Calories"
  progress={0.75}
  color={colors.secondary}
/>

// Three stat cards in a row
<View style={{ flexDirection: 'row', gap: 12 }}>
  <StatCard value="168g" label="Protein" progress={0.65} color={colors.macro.protein} />
  <StatCard value="192g" label="Carbs" progress={0.50} color={colors.macro.carbs} />
  <StatCard value="53g" label="Fats" progress={0.80} color={colors.macro.fats} />
</View>
```

#### When to Use

- Macro displays (protein, carbs, fats)
- Any small metric with progress
- Dashboard stats

---

### NutritionCard

Card for displaying meal/food entries.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `image` | `ImageSourcePropType` | - | Meal photo |
| `title` | `string` | required | Meal/food name |
| `time` | `string` | - | Time logged |
| `calories` | `number` | required | Calories |
| `protein` | `number` | - | Protein (grams) |
| `carbs` | `number` | - | Carbs (grams) |
| `fats` | `number` | - | Fats (grams) |
| `onPress` | `function` | - | Tap handler |
| `style` | `ViewStyle` | - | Custom style |

#### Examples

```tsx
// Full nutrition card with image
<NutritionCard
  image={{ uri: 'https://example.com/meal.jpg' }}
  title="Lemon Herb Salmon with Vegetables"
  time="9:00am"
  calories={520}
  protein={38}
  carbs={36}
  fats={26}
  onPress={() => console.log('View meal details')}
/>

// Card without image
<NutritionCard
  title="Protein Shake"
  time="6:00am"
  calories={180}
  protein={30}
/>

// Card without macros
<NutritionCard
  image={require('@/assets/meal.jpg')}
  title="Breakfast Burrito"
  calories={450}
  onPress={handleViewMeal}
/>

// List of nutrition cards
<ScrollView>
  {meals.map((meal) => (
    <NutritionCard
      key={meal.id}
      image={meal.image}
      title={meal.name}
      time={meal.time}
      calories={meal.calories}
      protein={meal.protein}
      carbs={meal.carbs}
      fats={meal.fats}
      onPress={() => handleViewMeal(meal.id)}
    />
  ))}
</ScrollView>
```

#### When to Use

- Meal/food logging displays
- Food database search results
- Recipe displays

---

### ActivityCard

Card for displaying workout/activity entries.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | `string \| ReactNode` | - | Activity icon/emoji |
| `title` | `string` | required | Activity name |
| `time` | `string` | - | Time logged |
| `duration` | `string` | - | Duration |
| `intensity` | `string` | - | Intensity level |
| `calories` | `number` | - | Calories burned |
| `notes` | `string` | - | Optional notes |
| `onPress` | `function` | - | Tap handler |
| `style` | `ViewStyle` | - | Custom style |

#### Examples

```tsx
// Full activity card
<ActivityCard
  icon="💪"
  title="Weight lifting"
  time="6:30pm"
  duration="15 Mins"
  intensity="Medium"
  calories={50}
  notes="Chest and triceps day"
  onPress={() => console.log('View workout')}
/>

// Simple activity card
<ActivityCard
  icon="🏃"
  title="Morning run"
  duration="30 Mins"
  calories={250}
/>

// Activity with custom icon component
<ActivityCard
  icon={<DumbbellIcon size={32} color={colors.secondary} />}
  title="Strength Training"
  time="5:00pm"
  duration="45 Mins"
  intensity="High"
  calories={180}
/>

// List of activities
{activities.map((activity) => (
  <ActivityCard
    key={activity.id}
    icon={activity.icon}
    title={activity.title}
    time={activity.time}
    duration={activity.duration}
    intensity={activity.intensity}
    calories={activity.calories}
    onPress={() => handleViewActivity(activity.id)}
  />
))}
```

#### When to Use

- Workout/exercise logging
- Activity feed displays
- Exercise history

---

## Utility Components

### Badge

Small status indicators and labels.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'filled' \| 'outlined' \| 'streak'` | `'outlined'` | Badge style |
| `color` | `'primary' \| 'secondary' \| 'success' \| 'warning' \| 'error' \| 'neutral'` | `'neutral'` | Badge color |
| `children` | `ReactNode` | - | Badge text |
| `count` | `number` | - | Streak count (streak variant) |
| `icon` | `string \| ReactNode` | - | Icon/emoji |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Badge size |
| `style` | `ViewStyle` | - | Custom style |

#### Examples

```tsx
// Filled badge (success)
<Badge variant="filled" color="success">
  Healthy
</Badge>

// Outlined badge
<Badge variant="outlined" color="neutral">
  Recommended
</Badge>

// Streak badge
<Badge variant="streak" count={15} />

// Badge with icon
<Badge variant="filled" color="secondary" icon="🔥">
  5 Day Streak
</Badge>

// Small badge
<Badge variant="outlined" size="small">
  New
</Badge>

// Status badges
<Badge variant="filled" color="success">Completed</Badge>
<Badge variant="filled" color="warning">Pending</Badge>
<Badge variant="filled" color="error">Failed</Badge>
```

#### When to Use

- Status indicators
- Labels and tags
- Streak displays
- Category badges

---

### IconButton

Circular icon button, including FAB.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | `ReactNode` | required | Icon component |
| `variant` | `'primary' \| 'secondary' \| 'ghost' \| 'fab'` | `'primary'` | Button style |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Button size |
| `loading` | `boolean` | `false` | Show loading |
| `disabled` | `boolean` | `false` | Disable button |
| `backgroundColor` | `string` | - | Custom background |
| `iconColor` | `string` | - | Custom icon color |
| `style` | `ViewStyle` | - | Custom style |

#### Examples

```tsx
// Primary icon button (assuming you have icons library)
import { Plus } from 'lucide-react-native';

<IconButton icon={<Plus />} onPress={handleAdd} />

// Secondary icon button
<IconButton
  icon={<Camera />}
  variant="secondary"
  onPress={handleCamera}
/>

// FAB (Floating Action Button)
<IconButton
  icon={<Plus />}
  variant="fab"
  onPress={handleFAB}
  style={{ position: 'absolute', bottom: 80, right: 20 }}
/>

// Small icon button
<IconButton
  icon={<Edit />}
  variant="ghost"
  size="small"
  onPress={handleEdit}
/>

// Custom colors
<IconButton
  icon={<Heart />}
  backgroundColor={colors.status.error}
  iconColor={colors.background}
  onPress={handleLike}
/>

// Loading state
<IconButton
  icon={<Save />}
  loading={isSaving}
  onPress={handleSave}
/>
```

#### When to Use

- Icon-only actions
- FAB (main floating action)
- Close buttons in modals
- Edit, delete, share actions

---

### Avatar

Circular avatar for user photos, initials, or icons.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `source` | `ImageSourcePropType` | - | Image source |
| `initials` | `string` | - | Initials (if no image) |
| `icon` | `ReactNode` | - | Icon (if no image/initials) |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| number` | `'md'` | Avatar size |
| `backgroundColor` | `string` | `colors.secondary` | Background (for initials/icon) |
| `textColor` | `string` | `colors.background` | Text color (for initials) |
| `borderWidth` | `number` | `0` | Border width |
| `borderColor` | `string` | `colors.background` | Border color |
| `style` | `ViewStyle` | - | Custom style |

#### Examples

```tsx
// Avatar with image
<Avatar
  source={{ uri: 'https://example.com/photo.jpg' }}
  size="md"
/>

// Avatar with initials
<Avatar
  initials="RC"
  size="lg"
  backgroundColor={colors.secondary}
  textColor={colors.background}
/>

// Avatar with icon
<Avatar
  icon={<User size={24} color={colors.background} />}
  size="sm"
  backgroundColor={colors.primary}
/>

// Small avatar
<Avatar
  source={{ uri: userPhoto }}
  size="xs"
/>

// Avatar with border (for layered avatars)
<Avatar
  source={{ uri: userPhoto }}
  size="md"
  borderWidth={2}
  borderColor={colors.background}
/>

// Custom size
<Avatar
  initials="AB"
  size={80}
  backgroundColor={colors.macro.protein}
/>

// Group avatars
<View style={{ flexDirection: 'row', marginLeft: -8 }}>
  {users.map((user, index) => (
    <Avatar
      key={user.id}
      source={{ uri: user.photo }}
      size="sm"
      borderWidth={2}
      borderColor={colors.background}
      style={{ marginLeft: index > 0 ? -8 : 0 }}
    />
  ))}
</View>
```

#### When to Use

- User profiles
- Comments/posts
- Group member displays
- Activity feeds

---

### EmptyState

Display empty states with icon, title, description, and action.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | `string \| ReactNode` | - | Icon (emoji or component) |
| `title` | `string` | required | Title text |
| `description` | `string` | - | Description text |
| `action` | `ReactNode` | - | Action button/component |
| `iconSize` | `number` | `48` | Icon size (for emoji) |
| `backgroundColor` | `string` | - | Background color |
| `withCard` | `boolean` | `false` | Use card background |
| `style` | `ViewStyle` | - | Custom style |

#### Examples

```tsx
// Basic empty state
<EmptyState
  icon="📭"
  title="No meals logged yet"
  description="Tap + to add your first meal of the day"
/>

// Empty state with action
<EmptyState
  icon="🏃"
  title="No activities"
  description="Start logging your workouts to track progress"
  action={
    <Button variant="primary" onPress={handleLogActivity}>
      Log Activity
    </Button>
  }
/>

// Empty state with icon component
<EmptyState
  icon={<InboxIcon size={48} color={colors.neutral[400]} />}
  title="No notifications"
  description="We'll notify you when something important happens"
/>

// Empty state with card background
<EmptyState
  icon="📊"
  title="No data yet"
  description="Complete more activities to see your progress"
  withCard
/>

// Empty state in list/feed
<ScrollView contentContainerStyle={{ flex: 1 }}>
  {meals.length === 0 ? (
    <EmptyState
      icon="🍽️"
      title="No meals logged today"
      description="Start tracking your nutrition"
      action={
        <Button variant="primary" onPress={handleAddMeal}>
          Add Meal
        </Button>
      }
    />
  ) : (
    meals.map((meal) => <NutritionCard key={meal.id} {...meal} />)
  )}
</ScrollView>
```

#### When to Use

- Empty lists/feeds
- No search results
- Onboarding prompts
- Feature empty states

---

## Examples

### Complete Dashboard Screen

```tsx
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import {
  Card,
  ProgressRing,
  StatCard,
  NutritionCard,
  Badge,
  IconButton,
  EmptyState,
} from '@/components';
import { colors, spacing, typography } from '@/constants/theme';

export function DashboardScreen() {
  const meals = []; // Your meals data

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>🍎 Cal AI</Text>
        </View>
        <Badge variant="streak" count={15} />
      </View>

      {/* Calendar Strip */}
      <View style={styles.calendar}>
        {/* Calendar implementation */}
      </View>

      {/* Hero Calorie Card */}
      <Card elevation="md" padding="large" radius="xl" style={styles.heroCard}>
        <View style={styles.heroContent}>
          <View>
            <Text style={styles.calorieNumber}>1926</Text>
            <Text style={styles.calorieLabel}>Calories left</Text>
            <Text style={styles.calorieExtra}>+334 from activity</Text>
          </View>
          <ProgressRing size="large" progress={0.75} color={colors.secondary}>
            <Text style={styles.ringPercentage}>75%</Text>
          </ProgressRing>
        </View>

        {/* Macro Stats */}
        <View style={styles.macroRow}>
          <StatCard
            value="168g"
            label="Protein left"
            progress={0.65}
            color={colors.macro.protein}
          />
          <StatCard
            value="192g"
            label="Carbs left"
            progress={0.50}
            color={colors.macro.carbs}
          />
          <StatCard
            value="53g"
            label="Fat left"
            progress={0.80}
            color={colors.macro.fats}
          />
        </View>
      </Card>

      {/* Recently Uploaded Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Recently uploaded</Text>

        {meals.length === 0 ? (
          <EmptyState
            icon="🍽️"
            title="No meals logged yet"
            description="Tap + to add your first meal of the day"
            withCard
          />
        ) : (
          meals.map((meal) => (
            <NutritionCard
              key={meal.id}
              image={meal.image}
              title={meal.name}
              time={meal.time}
              calories={meal.calories}
              protein={meal.protein}
              carbs={meal.carbs}
              fats={meal.fats}
            />
          ))
        )}
      </View>

      {/* FAB */}
      <IconButton
        icon={<Plus />}
        variant="fab"
        onPress={handleAddMeal}
        style={styles.fab}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[5],
  },
  logo: {
    fontSize: 24,
    fontWeight: '600',
  },
  calendar: {
    paddingHorizontal: spacing[5],
    marginBottom: spacing[6],
  },
  heroCard: {
    marginHorizontal: spacing[5],
    marginBottom: spacing[6],
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[5],
  },
  calorieNumber: {
    ...typography.display,
  },
  calorieLabel: {
    ...typography.body,
    color: colors.neutral[500],
  },
  calorieExtra: {
    ...typography.bodySmall,
    color: colors.neutral[400],
  },
  ringPercentage: {
    fontSize: 24,
    fontWeight: '600',
  },
  macroRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  section: {
    paddingHorizontal: spacing[5],
    marginBottom: spacing[6],
  },
  sectionHeader: {
    ...typography.h3,
    marginBottom: spacing[4],
  },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: spacing[5],
  },
});
```

---

## Best Practices

### 1. Consistent Component Usage

✅ **DO:**
```tsx
// Use design system components
import { Button, Card } from '@/components';
<Button variant="primary">Submit</Button>
```

❌ **DON'T:**
```tsx
// Don't create custom buttons without reason
<TouchableOpacity style={{ backgroundColor: '#000', padding: 16 }}>
  <Text style={{ color: '#FFF' }}>Submit</Text>
</TouchableOpacity>
```

### 2. Use Theme Values

✅ **DO:**
```tsx
import { colors, spacing } from '@/constants/theme';

<View style={{ backgroundColor: colors.background, padding: spacing[5] }}>
```

❌ **DON'T:**
```tsx
// Don't use magic numbers or hardcoded colors
<View style={{ backgroundColor: '#FFFFFF', padding: 20 }}>
```

### 3. Component Composition

✅ **DO:**
```tsx
// Compose complex UIs from simple components
<Card elevation="md" padding="large">
  <ProgressRing size="large" progress={0.75}>
    <Text>75%</Text>
  </ProgressRing>
  <Button variant="primary">View Details</Button>
</Card>
```

### 4. Accessibility

✅ **DO:**
```tsx
// Add accessibility labels
<IconButton
  icon={<Plus />}
  onPress={handleAdd}
  accessibilityLabel="Add new meal"
  accessibilityHint="Opens form to add a new meal"
/>
```

### 5. Performance

✅ **DO:**
```tsx
// Use React.memo for list items
const MemoizedNutritionCard = React.memo(NutritionCard);

<FlatList
  data={meals}
  renderItem={({ item }) => <MemoizedNutritionCard {...item} />}
  keyExtractor={(item) => item.id}
/>
```

### 6. Responsive Sizing

✅ **DO:**
```tsx
// Use flexible layouts
<View style={{ flexDirection: 'row', gap: spacing[3], flexWrap: 'wrap' }}>
  <StatCard {...} style={{ flex: 1, minWidth: 100 }} />
  <StatCard {...} style={{ flex: 1, minWidth: 100 }} />
  <StatCard {...} style={{ flex: 1, minWidth: 100 }} />
</View>
```

---

## Getting Help

- **Design System Docs:** See `DESIGN_SYSTEM.md` for design principles
- **Component Source:** Check `/src/components/` for implementation details
- **Examples:** Review example screens in this guide

---

**Happy Building! 🚀**
