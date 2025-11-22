# Quick Design Reference

## 🎨 Colors (CSS Variables)

### Primary Palette
```css
var(--gc-primary)           /* #679436 - Main green */
var(--gc-primary-hover)     /* #56732e - Hover state */
var(--gc-secondary)         /* #05668D - Secondary blue */
var(--gc-secondary-hover)   /* #044f6b - Hover state */
var(--gc-admin)             /* #14532d - Admin green */
var(--gc-admin-hover)       /* #166534 - Hover state */
```

### Quick Color Classes
```html
<!-- Tailwind (still works) -->
<div class="bg-[#679436]">Organization</div>
<div class="bg-[#14532d]">OSWS Admin</div>
<div class="bg-[#05668D]">Secondary</div>

<!-- Design System (recommended) -->
<div class="gc-bg-primary">Organization</div>
<div class="gc-text-primary">Green Text</div>
```

---

## 🔘 Buttons

```html
<!-- Primary (Green) -->
<button class="gc-btn gc-btn-primary">
  <i class="fas fa-icon"></i>
  <span>Action</span>
</button>

<!-- Secondary (Blue) -->
<button class="gc-btn gc-btn-secondary">Action</button>

<!-- Admin (Dark Green) -->
<button class="gc-btn gc-btn-admin">Admin Action</button>

<!-- Outline -->
<button class="gc-btn gc-btn-outline">Cancel</button>

<!-- Danger (Red) -->
<button class="gc-btn gc-btn-danger">Delete</button>

<!-- Legacy Tailwind (still supported) -->
<button class="px-4 py-2 bg-[#679436] hover:bg-[#56732e] text-white rounded-lg">
  Old Style
</button>
```

---

## 📦 Cards

```html
<!-- Design System Card -->
<div class="gc-card">
  <h2>Title</h2>
  <p>Content</p>
</div>

<!-- Legacy Tailwind (still works) -->
<div class="bg-white rounded-lg shadow-md p-4">
  <h2>Title</h2>
</div>
```

---

## 📝 Form Inputs

```html
<!-- Design System Input -->
<input type="text" class="gc-input" placeholder="Enter text">

<!-- Legacy Tailwind (still works) -->
<input type="text" 
       class="w-full px-4 py-2 border border-gray-300 rounded-lg 
              focus:ring-2 focus:ring-[#679436]">
```

---

## 🏷️ Badges/Status

```html
<!-- Success/Concluded -->
<span class="gc-badge gc-badge-success">
  <i class="fas fa-check"></i>
  <span>Active</span>
</span>

<!-- Warning/Pending -->
<span class="gc-badge gc-badge-warning">
  <i class="fas fa-clock"></i>
  <span>Pending</span>
</span>

<!-- Info/Ongoing -->
<span class="gc-badge gc-badge-info">
  <i class="fas fa-play"></i>
  <span>Ongoing</span>
</span>

<!-- Error/Cancelled -->
<span class="gc-badge gc-badge-error">
  <i class="fas fa-times"></i>
  <span>Error</span>
</span>

<!-- Legacy Tailwind (still works) -->
<span class="inline-flex items-center px-3 py-1 rounded-full 
             text-xs font-bold bg-green-50 text-green-800 border-2 border-green-300">
  Status
</span>
```

---

## 📊 Tables

```html
<!-- Design System Table -->
<table class="gc-table">
  <thead>
    <tr>
      <th>Column 1</th>
      <th>Column 2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Data 1</td>
      <td>Data 2</td>
    </tr>
  </tbody>
</table>

<!-- For OSWS Admin (Dark Green Header) -->
<table class="gc-table">
  <thead class="bg-[#14532d]">
    <!-- headers -->
  </thead>
</table>
```

---

## 🎯 Page Headers

```html
<!-- Standard Page Header -->
<div class="mb-6 mx-2 lg:mx-6">
  <div class="gc-header">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="gc-header-icon">
          <i class="fas fa-calendar"></i>
        </div>
        <div>
          <h1 class="text-xl font-bold text-gray-800">Page Title</h1>
          <p class="text-sm text-gray-600">Description</p>
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

## 🔄 Loading States

```html
<!-- Spinner -->
<div class="flex items-center gap-2">
  <div class="gc-loading"></div>
  <span>Loading...</span>
</div>

<!-- Legacy (still works) -->
<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#679436]"></div>
```

---

## 📭 Empty States

```html
<div class="gc-empty-state">
  <div class="gc-empty-state-icon">
    <i class="fas fa-inbox"></i>
  </div>
  <h3 class="text-lg font-semibold text-gray-700 mb-2">No Data Found</h3>
  <p class="text-sm text-gray-500">Try adjusting your filters</p>
  <button class="gc-btn gc-btn-primary mt-4">
    <i class="fas fa-plus"></i>
    <span>Create New</span>
  </button>
</div>
```

---

## 📱 Responsive Guidelines

### Mobile First Classes
```html
<!-- Stack on mobile, row on desktop -->
<div class="flex flex-col sm:flex-row gap-3">
  <!-- content -->
</div>

<!-- Hidden on mobile, visible on desktop -->
<div class="hidden lg:block">Desktop only</div>

<!-- Visible on mobile, hidden on desktop -->
<div class="lg:hidden">Mobile only</div>

<!-- Responsive padding -->
<div class="p-4 sm:p-6 lg:p-8">
  <!-- content -->
</div>
```

---

## 🎨 Department Colors

```html
<!-- CCS - Orange -->
<div class="border-t-4 border-[#f97316]">CCS Event</div>

<!-- CBA - Yellow -->
<div class="border-t-4 border-[#fbbf24]">CBA Event</div>

<!-- CAHS - Red -->
<div class="border-t-4 border-[#ef4444]">CAHS Event</div>

<!-- CEAS - Blue -->
<div class="border-t-4 border-[#3b82f6]">CEAS Event</div>

<!-- CHTM - Pink -->
<div class="border-t-4 border-[#ec4899]">CHTM Event</div>

<!-- OSWS - Green -->
<div class="border-t-4 border-[#679436]">OSWS Event</div>
```

---

## 🔔 Modals

```html
<!-- Modal Overlay -->
<div class="fixed inset-0 z-50 flex items-center justify-center 
            modal-blur animate-fade-in"
     (click)="closeModal()">
  
  <!-- Modal Content -->
  <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 
              animate-scale-in"
       (click)="$event.stopPropagation()">
    
    <!-- Header -->
    <div class="flex items-center justify-between p-6 border-b">
      <h2 class="text-xl font-bold">Modal Title</h2>
      <button (click)="closeModal()" 
              class="text-gray-400 hover:text-gray-600">
        <i class="fas fa-times"></i>
      </button>
    </div>
    
    <!-- Body -->
    <div class="p-6 max-h-[70vh] overflow-y-auto">
      <!-- Content -->
    </div>
    
    <!-- Footer -->
    <div class="flex justify-end gap-3 p-6 border-t bg-gray-50">
      <button class="gc-btn gc-btn-outline">Cancel</button>
      <button class="gc-btn gc-btn-primary">Save</button>
    </div>
  </div>
</div>
```

---

## 🎯 Common Patterns

### Search Bar
```html
<div class="relative">
  <input type="text" 
         class="gc-input pl-10" 
         placeholder="Search...">
  <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
</div>
```

### Action Buttons Group
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

### Pagination
```html
<div class="flex items-center justify-between gap-4">
  <span class="text-sm text-gray-600">
    Page 1 of 10
  </span>
  <div class="flex gap-2">
    <button class="gc-btn gc-btn-outline" [disabled]="currentPage === 1">
      <i class="fas fa-chevron-left"></i>
    </button>
    <button class="gc-btn gc-btn-primary">1</button>
    <button class="gc-btn gc-btn-outline">2</button>
    <button class="gc-btn gc-btn-outline">3</button>
    <button class="gc-btn gc-btn-outline" [disabled]="currentPage === totalPages">
      <i class="fas fa-chevron-right"></i>
    </button>
  </div>
</div>
```

---

## ⚡ Quick Tips

1. **Always use design system classes** for new components
2. **Legacy Tailwind still works** - no need to refactor everything immediately
3. **Mobile-first** - Design for mobile, enhance for desktop
4. **Touch targets** - Minimum 44x44px on mobile
5. **Icons** - Always pair with text for clarity
6. **Colors** - Use CSS variables for consistency
7. **Spacing** - Use var(--gc-space-*) or Tailwind spacing
8. **Animations** - Respect reduced-motion preferences

---

## 🚀 Migration Path

### Phase 1 (Current)
- Design system is available
- Legacy Tailwind still works
- Both can coexist

### Phase 2 (Gradual)
- New components use design system
- Update components during feature work
- No forced refactoring

### Phase 3 (Future)
- All components use design system
- Consistent codebase
- Easier maintenance

---

**Quick Start**: Copy examples above and adapt to your needs!
