# Retro App Design System
*Warm & Inviting Relationship Retrospective Interface*

## Color Palette

### Light Mode
- **Background**: Warm cream (`35 25% 97%`) - Creates a cozy, welcoming foundation
- **Cards**: Soft warm white (`30 25% 98%`) - Clean, inviting surfaces
- **Primary**: Warm coral (`15 85% 70%`) - Engaging, romantic accent
- **Secondary**: Soft peach (`25 40% 95%`) - Gentle, supportive tones
- **Accent**: Soft rose (`345 60% 88%`) - Subtle, loving highlights

### Dark Mode
- **Background**: Warm dark (`25 20% 12%`) - Intimate, cozy darkness
- **Cards**: Dark warm (`25 15% 16%`) - Comfortable, nested feeling
- **Primary**: Softer coral (`15 75% 65%`) - Gentler for night use
- **Borders**: Subtle warm borders (`25 15% 22%`) - Barely visible definition

## Typography
- **Font**: Inter with fallbacks for optimal readability
- **Sizing**: Generous spacing for comfortable reading
- **Hierarchy**: Clear distinction between question, content, and interaction elements

## Component Styling

### Cards (`.retro-card`)
- **Background**: Semi-transparent with backdrop blur
- **Borders**: Soft, rounded corners (1rem radius)
- **Hover**: Subtle lift animation with enhanced shadow
- **Transition**: Smooth cubic-bezier easing

### Question Cards (`.question-card`)
- **Special styling**: Gradient background with primary/accent blend
- **Border**: Enhanced primary border for emphasis
- **Purpose**: Makes the reflection question feel special and important

### Buttons (`.retro-button`)
- **Default**: Gradient coral background with subtle border
- **Hover**: Lift animation with enhanced shadow
- **Recording**: Pulse animation when actively recording
- **Sizes**: Generous padding for touch-friendly interaction

### Inputs (`.retro-input`)
- **Background**: Semi-transparent with backdrop blur
- **Focus**: Gentle primary ring and border enhancement
- **Sizing**: Generous height for comfortable typing

## Interactive Elements

### Recording Animation
- **Pulse effect**: Warm red glow that expands outward
- **Duration**: 2-second cycle for calm, breathing rhythm
- **Purpose**: Clear visual feedback without being aggressive

### Hover States
- **Cards**: Gentle lift with scale and shadow
- **Buttons**: Upward movement with enhanced shadow
- **Timing**: 300ms cubic-bezier for natural feel

### Loading States
- **Spinner**: Primary-colored with transparent top
- **Container**: Accent background with rounded corners
- **Message**: Encouraging, specific feedback

## Background Pattern
- **Subtle dots**: Accent-colored radial gradients
- **Positioning**: 25% and 75% offsets for visual interest
- **Size**: 60px grid for gentle texture without distraction

## Design Philosophy

### Warmth & Invitation
- **Color temperature**: Warm oranges, corals, and roses
- **Avoid**: Cool blues, greys, or stark whites
- **Goal**: Create a cozy, safe space for vulnerable conversation

### Relationship-Focused
- **Gentle interactions**: No harsh edges or aggressive animations
- **Encouraging feedback**: Positive language and helpful guidance
- **Partner distinction**: Clear but non-competitive partner identification

### Modern Polish
- **Backdrop blur**: Creates depth and sophistication
- **Gradient overlays**: Adds visual richness without complexity
- **Smooth animations**: Everything feels connected and intentional

## Usage Guidelines

### When to Use Each Component
- **Question cards**: For displaying reflection prompts
- **Default cards**: For content areas and responses
- **Primary buttons**: For main actions (recording, submitting)
- **Secondary buttons**: For analysis and helper functions
- **Outline buttons**: For navigation and less prominent actions

### Animation Timing
- **Quick feedback**: 200ms for input focus
- **Standard transitions**: 300ms for most interactions
- **Recording pulse**: 2s for calming rhythm

### Accessibility
- **Color contrast**: All combinations meet WCAG AA standards
- **Focus indicators**: Clear ring indicators for keyboard navigation
- **Touch targets**: Minimum 44px for mobile interaction

## Implementation Notes

The design system uses CSS custom properties for theming, making it easy to:
- Switch between light and dark modes
- Adjust colors for different contexts
- Maintain consistency across components

All animations use `cubic-bezier(0.4, 0, 0.2, 1)` for natural, responsive feel.

Background patterns are achieved with CSS gradients to avoid additional image assets.