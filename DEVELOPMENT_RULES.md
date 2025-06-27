# Porchlite Development Rules & Guidelines

## Core Architecture

### Database Schema Updates

#### Guest Experience System Tables

```sql
-- Guest Book Entries
CREATE TABLE guest_book_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  guest_name VARCHAR(255) NOT NULL,
  guest_email VARCHAR(255),
  visit_date DATE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  message TEXT,
  is_public BOOLEAN DEFAULT true,
  is_approved BOOLEAN DEFAULT false, -- For moderation
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Guest Photos
CREATE TABLE guest_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guest_book_entry_id UUID REFERENCES guest_book_entries(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Guest Recommendations (places they visited)
CREATE TABLE guest_recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guest_book_entry_id UUID REFERENCES guest_book_entries(id) ON DELETE CASCADE,
  place_name VARCHAR(255) NOT NULL,
  place_type VARCHAR(100), -- restaurant, activity, attraction, etc
  location TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  would_recommend BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Guest Reported Issues (becomes tasks)
CREATE TABLE guest_reported_issues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guest_book_entry_id UUID REFERENCES guest_book_entries(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL, -- Links to created task
  issue_type VARCHAR(100), -- maintenance, cleanliness, amenity, etc
  description TEXT NOT NULL,
  location TEXT, -- where in the property
  priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high
  photo_url TEXT, -- optional photo of the issue
  status VARCHAR(50) DEFAULT 'reported', -- reported, acknowledged, resolved
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Guest Inventory Notes (low supplies, etc)
CREATE TABLE guest_inventory_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guest_book_entry_id UUID REFERENCES guest_book_entries(id) ON DELETE CASCADE,
  inventory_id UUID REFERENCES inventory(id) ON DELETE SET NULL,
  item_name VARCHAR(255) NOT NULL,
  note_type VARCHAR(50), -- low_stock, missing, damaged, suggestion
  quantity_used INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Existing Core Tables (Reference)

```sql
-- Properties
CREATE TABLE properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  description TEXT,
  main_photo_url TEXT,
  header_image_url TEXT, -- Used for dashboard banners
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  max_guests INTEGER DEFAULT 1,
  bedrooms INTEGER DEFAULT 1,
  bathrooms DECIMAL(3,1) DEFAULT 1,
  square_footage INTEGER,
  amenities JSONB DEFAULT '[]',
  house_rules TEXT,
  check_in_instructions TEXT,
  wifi_name VARCHAR(255),
  wifi_password VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks (Dashboard Widget)
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  severity VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
  location VARCHAR(255) NOT NULL,
  photo_urls TEXT[],
  reported_by UUID REFERENCES profiles(id),
  reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'open', -- open, in_progress, resolved
  category VARCHAR(100) DEFAULT 'general', -- general, maintenance, cleaning, etc
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory (Dashboard Widget)
CREATE TABLE inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100), -- essentials, cleaning, amenities, maintenance
  quantity INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'good', -- good, low, out, damaged
  location VARCHAR(255), -- where in property
  cost_per_unit DECIMAL(10,2),
  supplier VARCHAR(255),
  notes TEXT,
  last_restocked DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Component Architecture

#### Dashboard System
- **Modular Components**: Each dashboard widget is a separate component in `/components/dashboard/`
- **DashboardLayout**: Main layout component that orchestrates all widgets
- **Configurable**: Uses `enabledComponents` prop for future customization
- **Clickable Navigation**: All widgets link to their respective sections

#### Guest Experience System
- **Guest Book**: Public display of guest experiences (`/app/guest-book/`)
- **Trip Report Wizard**: Multi-step form for comprehensive guest feedback
- **Automatic Integration**: Guest reports create tasks and inventory notes
- **Moderation System**: Owner approval required for public entries

### File Structure Standards

```
/components/
  /dashboard/
    DashboardLayout.tsx       # Main dashboard orchestrator
    StatsOverview.tsx         # 4-card stats grid
    UpcomingVisits.tsx        # Visits widget
    InventoryAlerts.tsx       # Inventory alerts widget
    TaskAlerts.tsx            # Tasks widget (replaces maintenance)
    DashboardHeader.tsx       # Existing header with image management
    HeaderImageManager.tsx    # Existing image upload modal
  
  /guest-book/
    TripReportWizard.tsx      # Multi-step guest feedback form
    BasicInfoStep.tsx         # Step 1: Basic guest info
    PhotosStep.tsx            # Step 2: Photo uploads
    RecommendationsStep.tsx   # Step 3: Place recommendations
    IssuesStep.tsx            # Step 4: Report issues
    SuppliesStep.tsx          # Step 5: Inventory feedback
    ReviewStep.tsx            # Step 6: Final review

/app/
  page.tsx                    # Main dashboard page
  /guest-book/
    page.tsx                  # Guest book display
    /new/
      page.tsx                # New guest entry form
```

### useProperty Hook Standards

```tsx
// Always use loading guards to prevent duplicate API calls
const [isLoadingTenants, setIsLoadingTenants] = useState(false);
const [isLoadingProperties, setIsLoadingProperties] = useState(false);

// useCallback for all async functions
const loadUserTenants = useCallback(async () => {
  if (!user?.id || isLoadingTenants) return;
  // ... implementation
}, [user?.id, isLoadingTenants]);

// Minimal useEffect hooks with proper dependencies
useEffect(() => {
  if (user?.id) {
    loadUserTenants();
  }
}, [user?.id]);
```

### Dashboard Widget Standards

#### Navigation Rules
- **Stats cards** → Link to main sections (`/calendar`, `/inventory`, `/tasks`)
- **Widget headers** → Clickable with external link icons
- **Individual items** → Deep link with query params (`/tasks?task=123`)
- **Empty states** → Show helpful links to create content

#### Visual Standards
- **Hover effects** → `hover:scale-105` for cards, color changes for headers
- **Loading states** → Consistent spinners and guards
- **Icons** → Lucide icons with semantic meaning
- **Colors** → Blue (visits), Green (inventory), Yellow (alerts), Purple (tasks)

### Guest Experience Integration

#### Automatic Task Creation
```tsx
// Guest issues automatically become tasks
const { data: task } = await supabase
  .from('tasks')
  .insert({
    property_id: property.id,
    title: `Guest Report: ${issue.issueType}`,
    description: issue.description,
    priority: issue.priority,
    status: 'pending',
    category: 'maintenance',
    source: 'guest_report'
  });
```

#### Inventory Integration
```tsx
// Guest inventory notes link to existing inventory
await supabase
  .from('guest_inventory_notes')
  .insert({
    guest_book_entry_id: entryId,
    item_name: note.itemName,
    note_type: note.noteType, // low_stock, missing, damaged
    notes: note.notes
  });
```

### API Best Practices

#### Supabase Queries
- **Always filter by property_id** for multi-tenant security
- **Use select() with specific columns** to optimize performance
- **Include proper error handling** with try/catch blocks
- **Limit results** with `.limit()` for dashboard widgets

#### State Management
- **Loading guards** prevent duplicate API calls
- **Error boundaries** handle failed requests gracefully
- **Optimistic updates** for better UX where appropriate

#### API Field Naming Standards
- **Database fields**: Always use `snake_case` (e.g., `property_id`, `created_at`)
- **API requests/responses**: Use `snake_case` to match database schema
- **Frontend state**: Can use `camelCase` internally, but convert for API calls
- **Consistency rule**: Never accept both formats in the same API endpoint

#### Example API Request:
```json
{
  "property_id": "uuid-here",
  "description": "Task description",
  "severity": "medium"
}
```

### Permission System

#### Guest Book Moderation
- **is_approved** flag for owner moderation
- **is_public** flag for guest privacy control
- **Role-based access** for management features

#### Header Image Management
- **ALLOWED_ROLES**: `["owner", "manager", "admin"]`
- **Permission checks** before showing upload UI
- **Graceful degradation** for unauthorized users

### Performance Guidelines

#### Image Optimization
- **WebP conversion** for modern browsers
- **Compression** at 85% quality for 1920px width
- **Lazy loading** for gallery components
- **CDN delivery** via Supabase Storage

#### Database Performance
- **Proper indexing** on property_id, status, created_at
- **Pagination** for large datasets
- **Efficient joins** using select() with relationships

### Testing Standards

#### Component Testing
- **Loading states** should be tested
- **Error states** should be handled
- **Navigation** should work correctly
- **Form validation** should prevent invalid submissions

#### Integration Testing
- **Guest report workflow** end-to-end
- **Task creation** from guest issues
- **Inventory updates** from guest notes
- **Permission enforcement** for all features

### Future Considerations

#### Customization System
- **Widget configuration** stored in user preferences
- **Drag-and-drop** dashboard layouts
- **Custom widget** creation for power users

#### Analytics Integration
- **Guest satisfaction** tracking
- **Task completion** metrics
- **Inventory turnover** analysis
- **Property performance** dashboards

### Migration Notes

#### Dashboard Updates
- **Maintenance widget** renamed to Tasks widget
- **Navigation routes** updated to `/tasks` instead of `/maintenance`
- **Color scheme** changed from red to purple for tasks
- **Data source** changed from `cleaning_issues` to `tasks` table

#### Backward Compatibility
- **Prop names** maintained for `maintenanceAlerts` in DashboardLayout
- **State variables** can be gradually renamed
- **API endpoints** maintain existing contracts

## Database Tables

### Tasks Table (`tasks`)
- **Purpose**: Track property issues, maintenance requests, and tasks
- **Structure**: 
  - `id` (uuid, primary key)
  - `property_id` (uuid, foreign key to properties) 
  - `description` (text, required) - Description of the issue/task
  - `severity` (varchar, required) - Severity level (low, medium, high, critical)
  - `location` (varchar, required) - Location within the property
  - `photo_urls` (text[], optional) - Array of photo URLs
  - `reported_by` (uuid, foreign key to profiles)
  - `reported_at` (timestamp, default now())
  - `is_resolved` (boolean, default false)
  - `resolved_by` (uuid, foreign key to profiles)
  - `resolved_at` (timestamp, optional)
  - `notes` (text, optional) - Additional notes
  - `status` (text, default 'open') - Status: 'open', 'in_progress', 'resolved'
  - `category` (text, default 'general') - Category: 'general', 'maintenance', 'cleaning', etc.

**Note**: This table was previously named `cleaning_issues` but was renamed to `tasks` to better reflect its broader purpose.

**RLS Policy**: `tasks_property_isolation` - Users can only access tasks for properties they own/manage.