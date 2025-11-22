# Design System Migration Guide

## 🎯 Purpose
This guide helps developers migrate existing components to use the new GC-ORGANIZE design system while maintaining backward compatibility.

---

## ⚡ Quick Rules

### ✅ DO
- Use design system classes for new components
- Gradually migrate during feature updates
- Test on mobile devices
- Follow the documentation

### ❌ DON'T
- Force immediate refactoring of all components
- Remove working legacy styles without testing
- Skip mobile testing
- Ignore accessibility features

---

## 🔄 Migration Strategies

### Strategy 1: New Components (Recommended)
Use design system from the start for all new components.

```html
<!-- ✅ Good: New component using design system -->
<button class="gc-btn gc-btn-primary">
  <i class="fas fa-save"></i>
  <span>Save</span>
</button>
```

### Strategy 2: Feature Updates
Update components when adding/modifying features.

```html
<!-- Before: Legacy Tailwind -->
<button class="px-4 py-2 bg-[#679436] hover:bg-[#56732e] text-white rounded-lg">
  Save
</button>

<!-- After: Design system (during feature update) -->
<button class="gc-btn gc-btn-primary">
  <i class="fas fa-save"></i>
  <span>Save</span>
</button>
```

### Strategy 3: Coexistence
Mix both approaches in the same component if needed.

```html
<!-- Both work fine together -->
<div class="p-6 bg-gray-100">
  <!-- Legacy button -->
  <button class="px-4 py-2 bg-[#679436] text-white rounded-lg">Old</button>
  
  <!-- Design system button -->
  <button class="gc-btn gc-btn-primary">New</button>
</div>
```

---

## 📋 Component Migration Checklist

### Buttons
- [ ] Replace hardcoded colors with `gc-btn` classes
- [ ] Add icons before text
- [ ] Ensure hover states work
- [ ] Test on mobile (44x44px touch target)
- [ ] Verify disabled state

**Before:**
```html
<button class="px-4 py-2 bg-[#679436] hover:bg-[#56732e] text-white rounded-lg font-semibold">
  Create
</button>
```

**After:**
```html
<button class="gc-btn gc-btn-primary">
  <i class="fas fa-plus"></i>
  <span>Create</span>
</button>
```

### Cards
- [ ] Replace `bg-white rounded-lg shadow-md p-4` with `gc-card`
- [ ] Test hover effects
- [ ] Verify responsive padding

**Before:**
```html
<div class="bg-white rounded-lg shadow-md p-4 sm:p-5">
  <h2>Title</h2>
  <p>Content</p>
</div>
```

**After:**
```html
<div class="gc-card">
  <h2>Title</h2>
  <p>Content</p>
</div>
```

### Inputs
- [ ] Replace input classes with `gc-input`
- [ ] Verify focus states (green ring)
- [ ] Test on mobile (16px font size)
- [ ] Check disabled state

**Before:**
```html
<input type="text" 
       class="w-full px-4 py-2 border border-gray-300 rounded-lg 
              focus:ring-2 focus:ring-[#679436] focus:border-[#679436]">
```

**After:**
```html
<input type="text" class="gc-input">
```

### Badges
- [ ] Replace badge markup with `gc-badge` classes
- [ ] Add appropriate color variant
- [ ] Include icons for clarity
- [ ] Verify border consistency

**Before:**
```html
<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold 
             bg-green-50 text-green-800 border-2 border-green-300">
  Active
</span>
```

**After:**
```html
<span class="gc-badge gc-badge-success">
  <i class="fas fa-check"></i>
  <span>Active</span>
</span>
```

### Tables
- [ ] Apply `gc-table` class
- [ ] Verify header styling (green background)
- [ ] Test hover effects on rows
- [ ] Check mobile horizontal scroll

**Before:**
```html
<table class="min-w-full">
  <thead class="bg-[#679436]">
    <tr>
      <th class="px-6 py-3 text-white">Header</th>
    </tr>
  </thead>
  <!-- ... -->
</table>
```

**After:**
```html
<table class="gc-table">
  <thead>
    <tr>
      <th>Header</th>
    </tr>
  </thead>
  <!-- ... -->
</table>
```

### Headers
- [ ] Use `gc-header` for page headers
- [ ] Include `gc-header-icon` for icons
- [ ] Ensure responsive layout
- [ ] Test action button placement

**Before:**
```html
<div class="mb-6 mx-2 lg:mx-6">
  <div class="bg-white rounded-lg shadow-md p-4 sm:p-5">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-[#679436] flex items-center justify-center">
          <i class="fas fa-calendar text-white"></i>
        </div>
        <h1 class="text-xl font-bold">Events</h1>
      </div>
      <button class="px-4 py-2 bg-[#679436] text-white rounded-lg">Create</button>
    </div>
  </div>
</div>
```

**After:**
```html
<div class="mb-6 mx-2 lg:mx-6">
  <div class="gc-header">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="gc-header-icon">
          <i class="fas fa-calendar"></i>
        </div>
        <div>
          <h1 class="text-xl font-bold text-gray-800">Events</h1>
          <p class="text-sm text-gray-600">Manage your events</p>
        </div>
      </div>
      <button class="gc-btn gc-btn-primary">
        <i class="fas fa-plus"></i>
        <span>Create</span>
      </button>
    </div>
  </div>
</div>
```

---

## 🎨 Color Migration

### Replace Hardcoded Colors

**Before:**
```html
<!-- Hardcoded organization color -->
<div class="bg-[#679436] text-white">Organization</div>
<button class="bg-[#679436] hover:bg-[#56732e]">Button</button>

<!-- Hardcoded admin color -->
<div class="bg-[#14532d] text-white">OSWS Admin</div>

<!-- Hardcoded secondary color -->
<div class="bg-[#05668D] text-white">Secondary</div>
```

**After:**
```html
<!-- Using design system classes -->
<div class="gc-bg-primary text-white">Organization</div>
<button class="gc-btn gc-btn-primary">Button</button>

<!-- Admin variant -->
<div style="background-color: var(--gc-admin)" class="text-white">OSWS Admin</div>
<button class="gc-btn gc-btn-admin">Admin Button</button>

<!-- Secondary variant -->
<button class="gc-btn gc-btn-secondary">Secondary</button>
```

**Or use CSS variables directly:**
```html
<div style="background-color: var(--gc-primary)" class="text-white">
  Organization
</div>
```

---

## 📱 Responsive Migration

### Mobile Touch Targets

**Before:**
```html
<button class="px-3 py-2 bg-[#679436] text-white rounded">Button</button>
```

**After:**
```html
<!-- Automatically has min 44x44px on mobile -->
<button class="gc-btn gc-btn-primary">Button</button>
```

### Mobile Input Font Size

**Before:**
```html
<input type="text" class="text-sm">
```

**After:**
```html
<!-- Automatically 16px on mobile (prevents iOS zoom) -->
<input type="text" class="gc-input">
```

---

## ♿ Accessibility Migration

### Focus States

**Before:**
```html
<button class="px-4 py-2 bg-[#679436] text-white focus:outline-none">
  Button
</button>
```

**After:**
```html
<!-- Automatically has proper focus ring -->
<button class="gc-btn gc-btn-primary">Button</button>
```

### Color Contrast

**Before:**
```html
<span class="text-gray-400">Low contrast text</span>
```

**After:**
```html
<span class="gc-text-muted">Proper contrast text</span>
<!-- or -->
<span class="text-gray-600">Proper contrast text</span>
```

---

## 🔧 Common Migration Patterns

### Pattern 1: Page Layout

**Before:**
```html
<div class="p-6 bg-gray-100 min-h-screen">
  <div class="mb-6 bg-white rounded-lg shadow-md p-4">
    <h1 class="text-xl font-bold">Page Title</h1>
  </div>
  <div class="bg-white rounded-lg shadow-md p-4">
    <!-- Content -->
  </div>
</div>
```

**After:**
```html
<div class="p-6 bg-gray-100 min-h-screen">
  <div class="mb-6 mx-2 lg:mx-6">
    <div class="gc-header">
      <h1 class="text-xl font-bold text-gray-800">Page Title</h1>
    </div>
  </div>
  <div class="mx-2 lg:mx-6">
    <div class="gc-card">
      <!-- Content -->
    </div>
  </div>
</div>
```

### Pattern 2: Form

**Before:**
```html
<form class="space-y-4">
  <div>
    <label class="block text-sm font-medium mb-2">Name</label>
    <input type="text" class="w-full px-4 py-2 border rounded-lg">
  </div>
  <button class="px-4 py-2 bg-[#679436] text-white rounded-lg">Submit</button>
</form>
```

**After:**
```html
<form class="gc-card space-y-4">
  <div>
    <label class="block text-sm font-semibold text-gray-700 mb-2">Name</label>
    <input type="text" class="gc-input">
  </div>
  <button class="gc-btn gc-btn-primary">
    <i class="fas fa-check"></i>
    <span>Submit</span>
  </button>
</form>
```

### Pattern 3: Action Buttons

**Before:**
```html
<div class="flex gap-2">
  <button class="px-4 py-2 bg-blue-600 text-white rounded-lg">View</button>
  <button class="px-4 py-2 bg-[#679436] text-white rounded-lg">Edit</button>
  <button class="px-4 py-2 bg-red-600 text-white rounded-lg">Delete</button>
</div>
```

**After:**
```html
<div class="flex gap-2">
  <button class="gc-btn gc-btn-secondary">
    <i class="fas fa-eye"></i>
    <span>View</span>
  </button>
  <button class="gc-btn gc-btn-primary">
    <i class="fas fa-edit"></i>
    <span>Edit</span>
  </button>
  <button class="gc-btn gc-btn-danger">
    <i class="fas fa-trash"></i>
    <span>Delete</span>
  </button>
</div>
```

---

## 🧪 Testing Checklist

After migration, verify:

### Visual
- [ ] Colors match design system
- [ ] Spacing is consistent
- [ ] Shadows/borders look correct
- [ ] Hover states work
- [ ] Focus states visible

### Functional
- [ ] All buttons clickable
- [ ] Forms submit correctly
- [ ] Modals open/close
- [ ] Dropdowns work
- [ ] Links navigate properly

### Responsive
- [ ] Mobile view works (below 640px)
- [ ] Tablet view works (640px - 1024px)
- [ ] Desktop view works (1024px+)
- [ ] Touch targets are 44x44px on mobile
- [ ] No horizontal scroll on mobile

### Accessibility
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Screen reader friendly
- [ ] Color contrast passes WCAG AA
- [ ] Text is readable

---

## 📊 Migration Priority

### High Priority (Do First)
1. New components
2. Frequently used components
3. User-facing pages
4. Forms and inputs

### Medium Priority (Do During Updates)
1. Dashboard components
2. Data tables
3. Modals and popups
4. Navigation elements

### Low Priority (Optional)
1. Admin-only pages (if rarely used)
2. Legacy features being deprecated
3. Experimental/beta features

---

## 🎓 Best Practices

### 1. Test First
Always test in a development environment before deploying.

### 2. Incremental Changes
Don't refactor entire pages at once. Update section by section.

### 3. Document Changes
Add comments explaining why changes were made.

```html
<!-- Updated to design system (2025-11-22) -->
<button class="gc-btn gc-btn-primary">Save</button>
```

### 4. Keep Backups
Keep track of what worked before changes.

### 5. Use Version Control
Commit after each successful migration.

```bash
git commit -m "feat: migrate event cards to design system"
```

---

## 🆘 Troubleshooting

### Issue: Styles don't apply
**Solution**: Check class name spelling, ensure `styles.css` is imported

### Issue: Colors look different
**Solution**: Verify you're using correct CSS variable or class

### Issue: Mobile view broken
**Solution**: Test with browser dev tools, check responsive classes

### Issue: Hover effects not working
**Solution**: Check if `transition` classes are applied

### Issue: Focus ring missing
**Solution**: Ensure you haven't used `focus:outline-none` without replacement

---

## 📚 Resources

- **Full Documentation**: `DESIGN_SYSTEM.md`
- **Quick Reference**: `QUICK_DESIGN_REFERENCE.md`
- **Examples**: `DESIGN_SYSTEM_EXAMPLE.html`
- **Implementation Summary**: `DESIGN_SYSTEM_IMPLEMENTATION.md`

---

## 🎯 Success Metrics

Migration is successful when:
- ✅ Component looks identical or better
- ✅ All functionality works
- ✅ Responsive on all devices
- ✅ Accessible via keyboard
- ✅ Code is more maintainable

---

## 💡 Tips

1. Start with simple components (buttons, inputs)
2. Move to complex ones (tables, modals)
3. Test continuously
4. Ask for review
5. Document learnings

---

**Remember**: The goal is gradual improvement, not perfection. Every small step counts! 🚀
