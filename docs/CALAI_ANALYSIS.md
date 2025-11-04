# CalAI Design System Analysis

**Date:** 2025-11-04
**Purpose:** Systematic analysis of CalAI screenshots to extract complete design system

---

## Screenshot-by-Screenshot Analysis

### Screen 1: Splash/Loading Screen
**File:** Splash screen with "Cal AI" logo

**Observations:**
- **Background:** Pure white (#FFFFFF)
- **Logo:** Black apple icon + "Cal AI" text
- **Typography:** Bold, clean sans-serif
- **Layout:** Centered vertically and horizontally
- **Spacing:** Generous padding around logo

**Design Elements:**
- Minimalist approach
- High contrast (black on white)
- Icon + text logo combination

---

### Screen 2: Onboarding - "Where did you hear about us?"
**File:** Marketing attribution screen

**Observations:**
- **Header Text:** Large, bold black text
- **Font Size:** ~28-32px for header
- **Background:** White
- **Buttons:**
  - Selected: Black fill with white text + icon
  - Unselected: Light gray background with black text + icon
  - Border radius: ~12-16px
  - Height: ~60-70px
  - Icons: Colorful platform logos (Facebook, YouTube, App Store, TikTok, TV, X)
- **Bottom Button:** Black button with white text "Continue"
- **Progress Indicator:** Thin horizontal bar at top (partially filled)
- **Back Button:** Left arrow in circle

**Color Palette:**
- Primary button: #000000 (Black)
- Secondary button: #F5F5F7 (Light gray)
- Text: #000000
- Background: #FFFFFF

**Typography:**
- Header: Bold, ~28-32px
- Button text: Medium, ~16-18px

**Spacing:**
- Screen padding: 20-24px
- Button gaps: 12-16px
- Top progress bar margin: 16px

---

### Screen 3: Onboarding - "Cal AI creates long-term results"
**File:** Value proposition screen with graph

**Observations:**
- **Header:** Bold text, 2 lines
- **Graph Card:**
  - White background
  - Rounded corners (~16px)
  - Padding: 24px
  - Contains line chart comparing "Cal AI" vs "Traditional diet"
  - Legend with badge: "Cal AI" + "Weight" badge
  - X-axis labels: "Month 1" to "Month 6"
  - Y-axis label: "Your weight"
- **Subtext:** Gray text below graph (~14px)
- **Bottom Button:** Black "Continue" button
- **Progress:** 2 of 3 steps indicated

**Colors:**
- Graph line (Cal AI): Black (#000000)
- Graph line (Traditional): Red/coral (#FF6B6B or similar)
- Background dots on line: White with border
- Card shadow: Subtle gray shadow

---

### Screen 4: Onboarding - "How fast do you want to reach your goal?"
**File:** Weight loss speed selector

**Observations:**
- **Header:** Bold text question
- **Subtext:** "Loss weight speed per week"
- **Large Number Display:** "1.0 kg" in very large font (~48-60px)
- **Slider:**
  - Black track (filled portion)
  - Gray track (unfilled portion)
  - White circular thumb with shadow
  - Animal emojis at breakpoints (sloth, turtle, rabbit)
  - Min/max labels: "0.1 kg" and "1.5 kg"
- **Recommendation Badge:** Light gray pill-shaped badge with "Recommended" text
- **Spacing:** Generous padding around slider (~40px vertical)

**Component Specs:**
- Slider height: ~4-6px track
- Thumb diameter: ~28-32px
- Thumb shadow: Subtle elevation
- Badge border radius: ~20px (pill shape)
- Badge padding: 12px horizontal, 8px vertical

---

### Screen 5: Onboarding - "Connect to Apple Health"
**File:** Integration prompt

**Observations:**
- **Icons:** Circular icons showing Walking, Running (checkmarked), Heart, Apple (in black square), Yoga, Sleep
- **Icon Layout:** Scattered/floating arrangement
- **Connection Lines:** Curved arrows connecting running → heart → apple
- **Header:** Bold black text
- **Subtext:** Gray explanatory text (~14-16px)
- **Buttons:**
  - Primary: Black "Continue" button
  - Secondary: Text-only "Not now" button (no border)
- **Progress:** Nearly complete progress bar

**Design Pattern:**
- Illustrative diagram style
- Icons ~40-48px diameter
- Black checkmark in circle for selected state

---

### Screen 6: Onboarding - "Reach your goals with notifications"
**File:** Permission request

**Observations:**
- **Header:** Bold text
- **Permission Dialog:**
  - Light gray background (#E5E5E5)
  - Rounded corners (~12px)
  - Two buttons: "Don't Allow" (gray text) | "Allow" (black background)
  - Button separator: Thin vertical line
- **Emoji:** Pointing hand emoji below dialog
- **iOS Permission Pattern:** Matches native iOS style

---

### Screen 7: Onboarding - "Save your progress"
**File:** Sign-in screen

**Observations:**
- **Header:** Bold text "Save your progress"
- **Buttons:**
  - "Sign in with Apple": Black background, Apple icon, white text
  - "Sign in with Google": White background, Google icon, black text, black border
  - Height: ~56px
  - Border radius: ~28px (pill-shaped)
  - Icon + text layout
- **Spacing:** 16px gap between buttons
- **Progress:** Full progress bar

**Button Specs:**
- Height: 56px
- Border radius: 28px (pill)
- Padding: 16px horizontal
- Icon size: 24px
- Text: Medium weight, 16-18px

---

### Screen 8-9: Onboarding Feature Showcase
**File:** "Group" and "Progress Photos" screens

**Observations:**
- **Layout:** Phone mockup image at top, text below
- **Phone Frame:** Realistic device frame with screenshot
- **Header:** Bold black text (~24-28px)
- **Subtext:** Gray descriptive text (~16px)
- **Navigation Dots:** Bottom pagination (filled = black, unfilled = light gray)
- **Button:** Black "Next" button at bottom

---

### Screen 10: Onboarding - "Badges"
**File:** Achievement showcase

**Observations:**
- **Badge Display:** Large 3D-style badge graphic
  - Hexagonal shape
  - "365 STREAK" text
  - Flame icon on top
  - Gradient blue background
  - "Badge Unlocked!" text
  - "No Days Off - 365 day streak" description
- **Buttons:**
  - Primary: Black "Share Your Badge"
  - Secondary: White "View All Badges" with icon

---

### Screen 11: Onboarding - "Enhanced Scanning Accuracy"
**File:** Camera tutorial

**Observations:**
- **Phone Mockup:** Camera interface screenshot
  - Black camera UI with white elements
  - Scan frame overlay
  - Bottom toolbar with "Scan Food", "Barcode", "Food label", "Library" options
  - Zoom controls: .5x, 1x, 2x
  - Flash and gallery icons
- **Instructions:** Bulleted list with camera icons and text
- **Design:** Educational/tutorial style

---

### Screen 12-13: Home Screen
**Files:** Main dashboard views

**Observations:**

**Header:**
- "Cal AI" logo (apple + text) aligned left
- Streak badge aligned right (flame icon + number in white pill)
- Background: White
- Height: ~60px

**Calendar Strip:**
- Horizontal week view
- Days in circles
- Today: Highlighted with ring
- Past days: Dotted border (logged) or solid (not logged)
- Day labels above numbers (S, M, T, W, T, F, S)
- Size: ~48px diameter per day
- Spacing: ~8px between days

**Calorie Card (Hero Card):**
- Large white card with rounded corners (~20px)
- Shadow: Subtle elevation
- Left side: Large calorie number (~72px) + "Calories left"
- Right side: Circular progress ring
- Below: 3 smaller metric cards (Protein, Carbs, Fat)
  - Each with progress ring
  - Number + label
  - Color-coded (red, orange, blue)
- Pagination dots below

**Recently Uploaded Section:**
- Header: Bold "Recently uploaded"
- Meal cards: Horizontal list
  - Image thumbnail
  - Meal name
  - Calories
  - Macros (protein/carbs/fats with icons)
- Empty state card: "Tap + to add your first meal of the day"
  - Light background
  - Icon + text centered

**Bottom Navigation:**
- 5 tabs: Home, Progress, + (FAB), Group, Profile
- Selected: Black icon
- Unselected: Gray icon
- FAB (center): Black circle with white + icon, elevated
- Icon size: ~24px
- Height: ~60px

**Color System Identified:**
- Background: White (#FFFFFF)
- Surface: Off-white (#FAFAFA or #F8F9FA)
- Primary: Black (#000000)
- Accent: Orange (#FF6B00 or similar)
- Text primary: Black (#000000)
- Text secondary: Gray (#6B7280)
- Borders: Light gray (#E5E7EB)
- Protein: Red/pink (#FF6B88)
- Carbs: Orange (#FFA756)
- Fats: Blue (#6B9DFF)

---

### Screen 14-15: Progress Tab
**Files:** Progress tracking screens

**Observations:**

**Top Cards Row:**
- Two cards side by side
- Left: "My Weight" card
  - Weight display (~40px)
  - Goal text
  - "Next weigh-in: 7d"
  - Light gray background
- Right: "Day Streak" card
  - Flame icon (orange)
  - "0" in center
  - Week labels (S M T W T F S)
  - Gray dots for days

**Time Period Selector:**
- Horizontal pills: "90 Days", "6 Months", "1 Year", "All time"
- Selected: Black background, white text
- Unselected: White background, black text, border

**Goal Progress Card:**
- Large white card
- "Goal Progress" header + "0% of goal" badge
- Line chart
- Y-axis labels (70, 72, 74, 76, 78)
- X-axis: Day labels
- Encouragement message: Green text at bottom
- Chart line: Black

**Progress Photos Section:**
- Header: Bold "Progress Photos"
- Upload card: Icon + "Upload a Photo" button
- Time filter: "This week", "Last week", etc.

**Total Calories Card:**
- Empty state: "No data to show"
- Icon centered
- Explanation text

**BMI Card:**
- "Your BMI" header with info icon
- Large number display
- "Healthy" status badge (green)
- Color scale bar (blue → green → yellow/orange → red)
- Labels: Underweight, Healthy, Overweight, Obese

---

### Screen 16: Group Tab
**File:** Social feature

**Observations:**
- Meal photo grid
- User avatars + names on photos
- Calorie counts displayed
- "Weight loss is easier together..." tagline
- Buttons:
  - Black "Create New Group"
  - White "Join Existing Group" with border

---

### Screen 17-18: Profile Tab
**File:** Settings and profile

**Observations:**

**Profile Header:**
- Circular avatar (initials or photo)
- Name + username
- Arrow right for navigation
- Background: White card with padding

**Menu Sections:**
- Section headers: Gray text (~14px)
- Menu items: White cards with:
  - Icon (left)
  - Label
  - Arrow (right)
  - Height: ~60px
  - Border radius: ~12px
  - Spacing: 2px between items in section, 24px between sections

**Bottom Sheet/Modal (visible):**
- White background
- Rounded top corners
- 4 options in 2×2 grid:
  - "Log exercise" (shoe icon)
  - "Saved foods" (bookmark icon)
  - "Food Database" (search icon)
  - "Scan food" (camera icon)
- Each option: Icon + label, white card with shadow
- Card size: ~160px × 120px
- Icons: ~32px
- Modal appears from bottom

---

### Screen 19: Exercise Logging
**File:** Activity input options

**Observations:**
- Header: "Exercise" with back button
- Large title: "Log Exercise"
- List of options:
  - "Run" with shoe icon
  - "Weight lifting" with dumbbell icon
  - "Describe" with pencil icon
  - "Manual" with flame icon
- Each option: Icon + title + description
- Light gray background cards
- Consistent padding and spacing

---

### Screen 20: Scanning Tutorial
**File:** Food scan tutorial

**Observations:**
- Step indicator: Circles at top (1, 2, 3)
- Current step: Black filled circle
- Phone mockup showing camera interface
- Checkmark + "Perfect! Scan now."
- Header: "Capture the full meal"
- Instructions with camera icons
- Black "Next" button at bottom

---

## Design System Summary

### Colors (Extracted)

**Primary:**
- Black: #000000
- White: #FFFFFF

**Grays:**
- Background: #F8F9FA
- Surface: #FAFAFA
- Border: #E5E7EB
- Text Secondary: #6B7280
- Text Tertiary: #9CA3AF
- Disabled: #D1D5DB

**Accent:**
- Orange: #FF6B00 (flame, streak)
- Orange Light: #FFE8D6

**Status:**
- Success/Green: #10B981
- Warning/Yellow: #F59E0B
- Error/Red: #EF4444
- Info/Blue: #3B82F6

**Macros:**
- Protein: #FF6B88 (pink/red)
- Carbs: #FFA756 (orange)
- Fats: #6B9DFF (blue)

---

### Typography Scale

**Font Family:** System default (San Francisco on iOS)

**Sizes:**
- Display: 72px (large numbers like calories)
- H1: 32px (screen titles)
- H2: 24-28px (section headers)
- H3: 20px (card titles)
- Body: 16px (regular text)
- Body Small: 14px (descriptions)
- Caption: 12px (labels, metadata)

**Weights:**
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700

**Line Heights:**
- Tight: 1.2 (large numbers, headers)
- Normal: 1.5 (body text)
- Relaxed: 1.75 (longer descriptions)

---

### Spacing Scale

**Base: 4px**

- 0: 0px
- 1: 4px
- 2: 8px
- 3: 12px
- 4: 16px
- 5: 20px
- 6: 24px
- 8: 32px
- 10: 40px
- 12: 48px
- 16: 64px

**Common Patterns:**
- Screen padding: 20-24px
- Card padding: 16-24px
- Button padding: 16px horizontal, 14-16px vertical
- Section spacing: 24-32px
- Component spacing: 12-16px

---

### Border Radius

- xs: 4px (small badges)
- sm: 8px (small cards)
- md: 12px (buttons, inputs, cards)
- lg: 16px (large cards)
- xl: 20px (hero cards)
- pill: 9999px (fully rounded buttons)
- circle: 50% (avatars, progress rings)

---

### Shadows/Elevation

**Level 0 (flat):**
- No shadow

**Level 1 (subtle):**
- shadowColor: #000
- shadowOffset: { width: 0, height: 1 }
- shadowOpacity: 0.05
- shadowRadius: 2
- elevation: 1

**Level 2 (card):**
- shadowColor: #000
- shadowOffset: { width: 0, height: 2 }
- shadowOpacity: 0.08
- shadowRadius: 4
- elevation: 2

**Level 3 (elevated - FAB):**
- shadowColor: #000
- shadowOffset: { width: 0, height: 4 }
- shadowOpacity: 0.15
- shadowRadius: 8
- elevation: 4

---

### Component Specifications

#### 1. Button

**Primary Button:**
- Background: Black (#000000)
- Text: White (#FFFFFF)
- Height: 56px
- Border radius: 28px (pill)
- Font: Medium, 16-18px
- Padding: 16px horizontal
- Shadow: Level 1

**Secondary Button:**
- Background: White (#FFFFFF)
- Text: Black (#000000)
- Border: 1px solid #E5E7EB
- Height: 56px
- Border radius: 28px (pill)
- Font: Medium, 16-18px
- Padding: 16px horizontal

**Ghost Button:**
- Background: Transparent
- Text: Black (#000000)
- Height: 44px
- Font: Medium, 16px
- No border

**States:**
- Pressed: Opacity 0.8
- Disabled: Background #D1D5DB, text #9CA3AF

---

#### 2. Card

**Base Card:**
- Background: White (#FFFFFF)
- Border radius: 16px
- Padding: 20px
- Shadow: Level 2

**Stat Card (small metric):**
- Background: White
- Border radius: 12px
- Padding: 16px
- Size: Square or ~100-120px width

**Hero Card (calorie display):**
- Background: White
- Border radius: 20px
- Padding: 24px
- Shadow: Level 2

---

#### 3. Progress Ring

**Specifications:**
- Stroke width: 8-10px
- Background ring: Light gray (#E5E7EB)
- Progress ring: Color-coded (orange for calories, red for protein, etc.)
- Sizes:
  - Small: 60px diameter (stat cards)
  - Medium: 100px diameter (day circles)
  - Large: 120-140px diameter (hero card)
- Center content: Number + optional label

---

#### 4. Progress Bar (Linear)

**Specifications:**
- Height: 4-6px
- Background: Light gray (#E5E7EB)
- Fill: Black or color-coded
- Border radius: 2-3px (pill ends)

---

#### 5. Badge

**Pill Badge:**
- Background: White with border OR color fill
- Border radius: 12px (pill)
- Padding: 6px horizontal, 4px vertical
- Font: Medium, 12-14px
- Icon + text layout

**Streak Badge:**
- Flame icon + number
- White background
- Border radius: 16px
- Padding: 8px 12px
- Shadow: Level 1

---

#### 6. Input

**Text Input:**
- Background: #F5F5F7
- Border: 1px solid transparent (focused: #000000)
- Border radius: 12px
- Height: 48-52px
- Padding: 14px horizontal
- Font: Regular, 16px
- Placeholder: #9CA3AF

---

#### 7. Bottom Navigation (Tab Bar)

**Specifications:**
- Height: 60px + safe area
- Background: White
- Border top: 1px solid #E5E7EB
- Icons: 24px
- Active color: Black
- Inactive color: #6B7280
- FAB (center):
  - Size: 56px diameter
  - Background: Black
  - Icon: White +
  - Shadow: Level 3
  - Positioned above tab bar

---

#### 8. Meal/Nutrition Card

**Specifications:**
- Layout: Horizontal (image + content)
- Image: 80x80px, rounded 12px
- Content padding: 12px
- Title: Medium, 16px
- Calories: Bold, 16px with flame icon
- Macros: Row of colored text with icons
- Shadow: Level 1

---

#### 9. Icon Button (FAB)

**Specifications:**
- Size: 56px diameter (large), 44px (medium), 36px (small)
- Background: Black
- Icon: White, 24px
- Border radius: 50% (circle)
- Shadow: Level 3

---

#### 10. Avatar

**Specifications:**
- Sizes: 32px (small), 44px (medium), 64px (large)
- Border radius: 50% (circle)
- Border: Optional 2px white border
- Background: Color from palette if no image
- Text: Initials, white, medium weight

---

#### 11. Modal/Bottom Sheet

**Specifications:**
- Background: White
- Border radius: 20px top corners
- Padding: 20-24px
- Handle bar: 4px × 36px gray pill at top center
- Shadow: Level 3
- Backdrop: rgba(0,0,0,0.4)

---

#### 12. Empty State

**Specifications:**
- Icon: 48-64px, gray
- Text: Medium, 16px, centered
- Subtext: Regular, 14px, gray, centered
- Spacing: 16px between elements
- Background: Light gray card or section

---

### Iconography Guidelines

**Style:**
- Outlined (stroke) style primarily
- Consistent stroke weight: 2px
- Rounded line caps and corners
- Sizes: 16px, 20px, 24px, 32px

**Recommended Library:**
- Lucide React Native (matches CalAI style)
- Or React Native Vector Icons (Feather set)

**Usage:**
- Navigation: 24px
- Buttons: 20-24px
- Cards: 20px
- Decorative: 32-48px

---

### Layout Patterns

**Screen Layout:**
```
┌─────────────────────────┐
│ Header (60px)           │
├─────────────────────────┤
│                         │
│ Content                 │
│ (Scrollable)            │
│ Padding: 20-24px        │
│                         │
│                         │
├─────────────────────────┤
│ Tab Bar (60px + safe)   │
└─────────────────────────┘
```

**Content Sections:**
- Spacing between: 24-32px
- Section headers: 20px bottom margin
- Horizontal scrolls: Full width with horizontal padding

**Grid System:**
- 2 columns for stat cards (gap: 12px)
- 3-4 items for icon grids
- Consistent gutters: 12-16px

---

### Animation/Transitions

**Button Press:**
- Scale: 0.95
- Duration: 100ms
- Easing: ease-out

**Modal/Sheet:**
- Slide from bottom
- Duration: 300ms
- Easing: ease-out

**Progress Rings:**
- Animate on mount
- Duration: 800ms
- Easing: ease-in-out

**Tab Switching:**
- Fade + slight slide
- Duration: 200ms

---

### Accessibility Considerations

**Touch Targets:**
- Minimum: 44x44px (iOS HIG)
- Buttons: 56px height
- Icon buttons: 44-56px
- FAB: 56px

**Color Contrast:**
- Black on white: 21:1 (AAA)
- Gray text: Ensure minimum 4.5:1
- Colored text: Test for WCAG AA

**Typography:**
- Minimum body text: 16px
- Support Dynamic Type/font scaling
- Clear hierarchy

---

## Next Steps

1. Update `theme.ts` with extracted values
2. Build component library based on specs
3. Create usage examples and guidelines
4. Apply to existing screens
5. Document component API

---

**Analysis Complete:** 2025-11-04
