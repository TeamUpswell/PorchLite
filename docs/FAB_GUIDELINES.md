# Floating Action Button Guidelines

## Default Pattern for All Pages

### 1. List/Index Pages
Use `CreatePattern` for adding new items:
```tsx
import { CreatePattern } from "@/components/ui/FloatingActionPresets";

// In your page component:
<CreatePattern 
  href="/path/to/new" 
  label="Add Item" 
/>
```

### 2. Edit/Form Pages  
Use `EditPattern` for save + back actions:
```tsx
import { EditPattern } from "@/components/ui/FloatingActionPresets";

// In your page component:
<EditPattern
  form="edit-form-id"
  backHref="/path/back"
  saveLabel="Save Changes"
  saving={isSaving}
  disabled={!isValid}
/>
```

### 3. Detail/View Pages
Use `DetailPattern` for edit + back actions:
```tsx
import { DetailPattern } from "@/components/ui/FloatingActionPresets";

// In your page component:
<DetailPattern
  editHref="/path/to/edit"
  backHref="/path/back"
  showDelete={hasDeletePermission}
  onDelete={handleDelete}
/>
```

### 4. Custom Multi-Action Pages
Use `MultiActionPattern` for complex scenarios:
```tsx
import { MultiActionPattern } from "@/components/ui/FloatingActionPresets";
import { Plus, Download, Settings } from "lucide-react";

// In your page component:
<MultiActionPattern
  actions={[
    {
      icon: Plus,
      label: "Add Item",
      href: "/add",
      variant: "primary"
    },
    {
      icon: Download,
      label: "Export",
      onClick: handleExport,
      variant: "secondary"
    },
    {
      icon: Settings,
      label: "Settings",
      href: "/settings",
      variant: "gray"
    }
  ]}
/>
```

## Color Coding Standards

- **Blue (primary)**: Add/Create new items
- **Green (success)**: Save/Submit actions  
- **Orange (warning)**: Edit/Modify existing items
- **Gray**: Navigation/Back actions
- **Red (danger)**: Delete/Remove actions
- **Purple (secondary)**: Secondary actions (export, share, etc.)

## Rules to Follow

1. **Never use header action buttons** - Always use floating action buttons
2. **Remove action props** from StandardPageLayout 
3. **Use preset patterns** when possible for consistency
4. **Stack multiple actions** vertically in order of importance
5. **Always include back/navigation** options on detail pages
6. **Use form integration** for submit buttons when applicable

## Migration Checklist

- [ ] Remove `action` prop from StandardPageLayout
- [ ] Replace header buttons with floating action buttons
- [ ] Use appropriate preset pattern
- [ ] Test mobile and desktop responsiveness
- [ ] Verify accessibility (focus states, aria-labels)
- [ ] Ensure proper color coding