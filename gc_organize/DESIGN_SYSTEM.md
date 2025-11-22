# GC-ORGANIZE Design System

## Overview
This document outlines the comprehensive, professional design system for GC-ORGANIZE. All components should follow these guidelines to maintain consistency across the application.

---

## Color Palette

### Primary Colors
- **Primary Green**: `#679436` (var(--gc-primary))
  - Used for: Organization panels, primary buttons, main branding
  - Hover: `#56732e` (var(--gc-primary-hover))
  
- **Secondary Blue**: `#05668D` (var(--gc-secondary))
  - Used for: Secondary actions, info states
  - Hover: `#044f6b` (var(--gc-secondary-hover))
  
- **Admin Dark Green**: `#14532d` (var(--gc-admin))
  - Used for: OSWS admin panels
  - Hover: `#166534` (var(--gc-admin-hover))

### Department Colors
- **CCS (Computer Studies)**: `#f97316` (Orange)
- **CBA (Business Admin)**: `#fbbf24` (Yellow)
- **CAHS (Allied Health)**: `#ef4444` (Red)
- **CEAS (Engineering)**: `#3b82f6` (Blue)
- **CHTM (Tourism)**: `#ec4899` (Pink)

### Status Colors
- **Pending/Not Started**: Yellow (`#fbbf24`)
- **Ongoing**: Blue (`#3b82f6`)
- **Success/Concluded**: Green (`#10b981`)
- **Error/Cancelled**: Red (`#ef4444`)

### Neutral Colors
- Gray scale from 50 (lightest) to 900 (darkest)
- Background: Gray-100 (`#f3f4f6`)
- Text Primary: Gray-800 (`#1f2937`)
- Text Muted: Gray-600 (`#4b5563`)

---

## Typography

### Font Family
- **Primary**: DM Sans (with fallbacks)
- Applied via: `var(--gc-font-family)`

### Font Weights
- **Bold**: 800 (extrabold)
- **Semibold**: 700
- **Medium**: 600
- **Regular**: 400

### Text Sizes (Mobile First)
- Use responsive classes that scale appropriately
- Minimum 16px on inputs (prevents iOS zoom)

---

## Spacing System

Use consistent spacing variables:
- **XS**: 4px (`var(--gc-space-xs)`)
- **SM**: 8px (`var(--gc-space-sm)`)
- **MD**: 16px (`var(--gc-space-md)`)
- **LG**: 24px (`var(--gc-space-lg)`)
- **XL**: 32px (`var(--gc-space-xl)`)
- **2XL**: 48px (`var(--gc-space-2xl)`)

---

## Components

### Buttons

#### Primary Button
```html
<button class="gc-btn gc-btn-primary">
  <i class="fas fa-icon"></i>
  <span>Action</span>
</button>
```
- Use for main actions
- Always include icon + text for clarity
- Min height: 40px (44px on mobile)

#### Secondary Button
```html
<button class="gc-btn gc-btn-secondary">Action</button>
```
- Use for secondary actions
- Blue theme

#### Admin Button
```html
<button class="gc-btn gc-btn-admin">Action</button>
```
- Only for OSWS admin actions
- Dark green theme

#### Outline Button
```html
<button class="gc-btn gc-btn-outline">Cancel</button>
```
- Use for cancel/neutral actions

#### Danger Button
```html
<button class="gc-btn gc-btn-danger">Delete</button>
```
- Use for destructive actions

### Cards
```html
<div class="gc-card">
  <!-- Content -->
</div>
```
- White background
- Rounded corners (12px)
- Medium shadow
- Hover: Lifts with larger shadow

### Input Fields
```html
<input type="text" class="gc-input" placeholder="Enter text">
```
- Full width
- 2px border
- Focus: Green ring
- Min 16px font size on mobile

### Badges
```html
<span class="gc-badge gc-badge-success">
  <i class="fas fa-check"></i>
  <span>Status</span>
</span>
```
Types:
- `gc-badge-success`: Green (completed, active)
- `gc-badge-warning`: Yellow (pending, not started)
- `gc-badge-info`: Blue (ongoing, processing)
- `gc-badge-error`: Red (error, cancelled)
- `gc-badge-neutral`: Gray (neutral, archived)

### Tables
```html
<table class="gc-table">
  <thead>
    <tr>
      <th>Header</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Data</td>
    </tr>
  </tbody>
</table>
```
- Green header
- Hover effect on rows
- Mobile: Horizontal scroll

### Headers
```html
<div class="gc-header">
  <div class="flex items-center gap-3">
    <div class="gc-header-icon">
      <i class="fas fa-icon"></i>
    </div>
    <div>
      <h1 class="text-xl font-bold">Title</h1>
      <p class="text-sm text-gray-600">Subtitle</p>
    </div>
  </div>
</div>
```

### Empty States
```html
<div class="gc-empty-state">
  <div class="gc-empty-state-icon">
    <i class="fas fa-icon"></i>
  </div>
  <h3 class="text-lg font-semibold text-gray-700 mb-2">No Data</h3>
  <p class="text-sm text-gray-500">Message here</p>
</div>
```

### Loading States
```html
<div class="flex items-center gap-2">
  <div class="gc-loading"></div>
  <span>Loading...</span>
</div>
```

---

## Shadows

- **Small**: `var(--gc-shadow-sm)` - Subtle elevation
- **Medium**: `var(--gc-shadow-md)` - Cards, buttons
- **Large**: `var(--gc-shadow-lg)` - Modals, hover states
- **XL**: `var(--gc-shadow-xl)` - Popovers, dropdowns

---

## Border Radius

- **Small**: 6px (`var(--gc-radius-sm)`)
- **Medium**: 8px (`var(--gc-radius-md)`)
- **Large**: 12px (`var(--gc-radius-lg)`)
- **XL**: 16px (`var(--gc-radius-xl)`)
- **Full**: 9999px (`var(--gc-radius-full)`) - Pills, badges

---

## Transitions

- **Fast**: 150ms (`var(--gc-transition-fast)`) - Hovers, clicks
- **Base**: 200ms (`var(--gc-transition-base)`) - Most transitions
- **Slow**: 300ms (`var(--gc-transition-slow)`) - Complex animations

---

## Responsive Breakpoints

- **Mobile**: 0 - 640px
- **Tablet**: 640px - 1024px
- **Desktop**: 1024px+

### Mobile Guidelines
- Touch targets min 44x44px
- Input font-size min 16px (prevents iOS zoom)
- Stack layouts (single column)
- Reduce padding/spacing
- Horizontal scroll for tables

### Tablet Guidelines
- 2-column grids where appropriate
- Balanced padding
- Optimize modal sizes

### Desktop Guidelines
- Full feature set
- Hover effects
- Multi-column layouts

---

## Accessibility

### Focus States
- All interactive elements have visible focus rings
- Focus ring: 2px solid primary color

### Color Contrast
- All text meets WCAG AA standards
- Minimum 4.5:1 contrast ratio

### Reduced Motion
- Respects `prefers-reduced-motion`
- Disables animations for users who prefer it

### High Contrast
- Increased border widths in high contrast mode
- Enhanced visual separation

---

## Modals

### Structure
```html
<div class="fixed inset-0 modal-blur animate-fade-in">
  <div class="animate-scale-in bg-white rounded-lg ...">
    <!-- Modal content -->
  </div>
</div>
```

### Guidelines
- Blur background
- Disable body scroll
- Animate entrance/exit
- Close on overlay click (optional)
- ESC key support
- Focus trap
- Mobile: Max 96vw width, 85vh height

---

## Icons

- **Library**: Font Awesome
- **Size**: Consistent with text
- **Color**: Inherit or semantic colors
- **Spacing**: Always gap between icon and text

---

## Department Color Usage

Apply department colors to:
- Border-top on event cards
- Department badges
- Organization-specific elements

```html
<!-- Example: CCS Event Card -->
<div class="border-t-4 border-[#f97316]">
  <!-- Card content -->
</div>
```

---

## Utility Classes

### Text
- `.gc-text-primary`: Primary green color
- `.gc-text-secondary`: Secondary blue color
- `.gc-text-muted`: Muted gray text

### Background
- `.gc-bg-primary`: Primary green background
- `.gc-bg-secondary`: Secondary blue background
- `.gc-bg-light`: Light gray background

### Layout
- `.gc-section`: Section padding
- `.gc-container`: Centered container with max-width
- `.gc-transition`: Standard transition
- `.gc-shadow`: Standard shadow

### Hover Effects
- `.gc-hover-lift`: Lifts on hover
- `.gc-hover-scale`: Scales on hover

---

## Best Practices

### DO ✅
- Use CSS variables for colors
- Follow mobile-first approach
- Maintain consistent spacing
- Use semantic HTML
- Include ARIA labels
- Test on real devices
- Use design system classes

### DON'T ❌
- Hardcode colors
- Skip hover/focus states
- Ignore mobile optimization
- Use pixel-perfect spacing
- Override without reason
- Create one-off styles
- Forget accessibility

---

## Implementation Examples

### Page Header
```html
<div class="p-6 bg-gray-100 min-h-screen">
  <div class="mb-6 mx-2 lg:mx-6">
    <div class="gc-header">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="gc-header-icon">
            <i class="fas fa-calendar"></i>
          </div>
          <div>
            <h1 class="text-xl font-bold text-gray-800">Page Title</h1>
            <p class="text-sm text-gray-600">Page description</p>
          </div>
        </div>
        <button class="gc-btn gc-btn-primary">
          <i class="fas fa-plus"></i>
          <span>Create</span>
        </button>
      </div>
    </div>
  </div>
  <!-- Page content -->
</div>
```

### Data Table
```html
<div class="gc-card">
  <table class="gc-table">
    <thead>
      <tr>
        <th>Name</th>
        <th>Status</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Item Name</td>
        <td>
          <span class="gc-badge gc-badge-success">Active</span>
        </td>
        <td>
          <button class="gc-btn gc-btn-secondary">View</button>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

### Form
```html
<form class="gc-card space-y-4">
  <div>
    <label class="block text-sm font-semibold text-gray-700 mb-2">
      Field Label
    </label>
    <input type="text" class="gc-input" placeholder="Enter value">
  </div>
  <div class="flex gap-3">
    <button type="submit" class="gc-btn gc-btn-primary">Save</button>
    <button type="button" class="gc-btn gc-btn-outline">Cancel</button>
  </div>
</form>
```

---

## Version
**Version**: 1.0.0  
**Last Updated**: November 22, 2025  
**Maintained by**: GC-ORGANIZE Development Team

---

## Support

For questions or suggestions about the design system:
1. Review this documentation first
2. Check existing component implementations
3. Propose changes through proper channels
4. Maintain backward compatibility when updating

---

**Remember**: Consistency is key to a professional user experience. When in doubt, refer to existing implementations that follow this design system.
