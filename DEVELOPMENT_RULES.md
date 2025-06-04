# PorchLite Development Rules & Patterns

## 🔐 Authentication & Layout Patterns

### Protected Pages Structure
```tsx
// For pages with existing ProtectedPageWrapper
return (
  <ProtectedRoute>
    <ProtectedPageWrapper>
      {/* Page content */}
    </ProtectedPageWrapper>
  </ProtectedRoute>
);

// For new pages without existing layout
return (
  <ProtectedRoute>
    <AuthenticatedLayout>
      {/* Page content */}
    </AuthenticatedLayout>
  </ProtectedRoute>
);
```

### Public Pages (Auth related)
- Never wrap `/auth/*`, `/login`, `/signup` with ProtectedRoute
- These should remain completely public

## 🧭 Navigation & Layout Patterns

### Side Navigation
- Use consistent navigation structure across all pages
- Maintain active state indicators for current page
- Ensure responsive behavior for mobile devices
- Include user context and property selection in nav

### Page Layouts
- Use `StandardPageLayout` for consistent page structure
- Include proper page titles and subtitles
- Add appropriate header icons for visual hierarchy
- Maintain consistent spacing and padding

## 🎨 Design System & UI Components

### Color Patterns
- Primary: Blue (#3B82F6, #1D4ED8) for main actions
- Success: Green for positive actions/states
- Warning: Yellow/Orange for attention items
- Error: Red for destructive actions/errors
- Gray scale: Consistent gray palette for text hierarchy

### Card Components
- Use `StandardCard` for consistent card layouts
- Include proper shadow and border radius
- Maintain consistent padding (p-4, p-6)
- Use white backgrounds for content cards

### Button Patterns
```tsx
// Primary action buttons
className="bg-blue-600 hover:bg-blue-700 text-white"

// Secondary buttons  
className="bg-gray-200 hover:bg-gray-300 text-gray-900"

// Destructive actions
className="bg-red-600 hover:bg-red-700 text-white"
```

### Icon Usage
- Use Lucide React icons consistently
- Size: h-4 w-4 for inline, h-6 w-6 for headers
- Always include proper accessibility labels
- Use semantic icons that match action purpose

## 📊 Data Display Patterns

### Loading States
```tsx
// Skeleton loading for lists/grids
<div className="animate-pulse">
  <div className="h-4 bg-gray-200 rounded mb-2"></div>
  <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
</div>

// Spinner for actions
<div className="animate-spin h-4 w-4 border-2 border-blue-600 rounded-full border-t-transparent"></div>
```

### Grid Layouts
- Use responsive grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Consistent gap spacing: `gap-4` or `gap-6`
- Maintain aspect ratios for images/cards

### Form Patterns
- Use consistent input styling
- Include proper validation states
- Add clear error messaging
- Implement proper focus states

## 🔄 State Management Rules

### Modal Patterns
- Use boolean state for modal visibility
- Include proper backdrop click handling
- Implement escape key functionality
- Clear form state on modal close

### Data Fetching
```tsx
// Standard data fetching pattern
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/endpoint');
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  fetchData();
}, []);
```

## 🚀 Performance Rules

### Image Handling
- Use ResponsiveImage component for all images
- Implement proper loading states and fallbacks
- Optimize uploads with WebP conversion when supported

### API Usage
- Don't store Google API data unnecessarily
- Use dynamic fetching for external APIs (photos, weather)
- Implement proper caching strategies

## 🎯 Interactive Elements

### Hover States
- Cards: `hover:shadow-md transition-shadow`
- Buttons: Color darkening on hover
- Links: `hover:text-blue-600` for text links
- Interactive elements: Include `cursor-pointer`

### Focus States
- Maintain visible focus indicators
- Use `focus:ring-2 focus:ring-blue-500`
- Ensure keyboard navigation works
- Test with screen readers

### Animation Guidelines
- Use subtle transitions: `transition-all duration-200`
- Prefer transform over changing layout properties
- Use `animate-pulse` for loading states
- Keep animations under 300ms for interactions

## 📱 Responsive Design Rules

### Breakpoints (Tailwind)
- `sm:` 640px+ (small tablets)
- `md:` 768px+ (tablets)  
- `lg:` 1024px+ (small laptops)
- `xl:` 1280px+ (desktops)

### Mobile-First Patterns
```tsx
// Start with mobile, enhance for larger screens
className="text-sm md:text-base lg:text-lg"
className="p-4 md:p-6 lg:p-8"
className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
```

### Navigation Behavior
- Show/hide side nav based on screen size
- Implement hamburger menu for mobile
- Maintain navigation state across page changes

## 🧩 Component Architecture

### File Organization
```
components/
├── ui/           # Reusable UI components
├── auth/         # Authentication components
├── layout/       # Layout components
├── forms/        # Form components
├── maps/         # Map-related components
└── [feature]/    # Feature-specific components
```

### Component Naming
- Use PascalCase for component names
- Be descriptive: `RecommendationFilters` not `Filters`
- Include purpose: `DeleteButton`, `AddItemModal`

### Props Patterns
```tsx
interface ComponentProps {
  // Required props first
  data: DataType[];
  onAction: (item: DataType) => void;
  
  // Optional props with defaults
  className?: string;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}
```

## 🔧 Development Workflow

### Error Handling
- Always wrap async operations in try/catch
- Provide user-friendly error messages
- Log errors to console with clear context
- Include retry mechanisms where appropriate

### TypeScript Standards
- Define interfaces for all data structures
- Use strict typing, avoid `any`
- Export interfaces that might be reused
- Use union types for specific value sets

### Console Logging
- Use emoji prefixes for easy scanning
- Include context in log messages
- Remove debug logs before production
- Use different log levels appropriately

## 🎨 Styling Conventions

### Tailwind Patterns
- Use consistent spacing scale (4, 6, 8, 12, 16)
- Group related classes: positioning, sizing, colors, effects
- Use design tokens for consistency
- Prefer utility classes over custom CSS

### Component Styling
- Use conditional classes with template literals
- Extract complex class logic to functions
- Maintain consistent hover/focus states
- Use CSS variables for theme customization

## 🗄️ Database & Data Management Patterns

### Supabase Configuration
```tsx
// Project Reference: hkrgfqpshdoroimlulzw
// URL: https://hkrgfqpshdoroimlulzw.supabase.co

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

### Core Database Tables & Interfaces

#### Properties (Multi-tenant Structure)
```tsx
interface Property {
  id: string;
  name: string;
  address: string;
  description?: string;
  tenant_id: string;              // Always required - multi-tenant support
  created_by: string;
  main_photo_url?: string;
  header_image_url?: string;
  property_type?: string;
  bedrooms?: number;
  bathrooms?: number;
  max_occupancy?: number;
  latitude?: number;
  longitude?: number;
  wifi_name?: string;
  wifi_password?: string;
  amenities?: string[];           // Array of amenity strings
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

#### Recommendations (Property-scoped)
```tsx
interface Recommendation {
  id: string;
  property_id: string;            // Always required - property-scoped
  name: string;
  category: 'restaurant' | 'grocery' | 'entertainment' | 'healthcare' | 'shopping' | 'services' | 'outdoor' | 'emergency';
  address: string;
  coordinates?: { lat: number; lng: number };
  description: string;
  rating?: number;
  website?: string;
  phone_number?: string;
  images: string[];               // Array of image URLs
  place_id?: string;              // Google Places ID for dynamic fetching
  is_recommended: boolean;
  created_at: string;
  updated_at: string;
}
```

#### Reservations (Property-scoped)
```tsx
interface Reservation {
  id: string;
  property_id: string;            // Always required
  tenant_id: string;              // Multi-tenant support
  user_id: string;
  title: string;
  description?: string;
  start_date: string;             // timestamp with time zone
  end_date: string;               // timestamp with time zone
  guests: number;
  companion_count: number;
  status: 'pending approval' | 'confirmed' | 'cancelled' | 'rejected';
  created_at: string;
  updated_at: string;
}
```

#### Cleaning System Tables
```tsx
interface CleaningTask {
  id: string;
  property_id: string;            // Property-scoped
  room: string;
  task: string;
  name?: string;
  description?: string;
  is_completed: boolean;
  completed_by?: string;
  completed_at?: string;
  photo_url?: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface CleaningVisit {
  id: string;
  property_id: string;
  reservation_id?: string;        // Optional link to reservation
  visit_date: string;             // date
  notes?: string;
  status: 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}
```

#### Manual/Documentation System
```tsx
interface ManualSection {
  id: string;
  property_id: string;            // Property-scoped
  title: string;
  description?: string;
  icon?: string;
  category?: string;
  type?: string;
  order_index: number;
  is_priority: boolean;
  priority_order?: number;
  created_at: string;
  updated_at: string;
}

interface ManualItem {
  id: string;
  section_id: string;
  title: string;
  content: string;
  photos: string[];               // Array of photo URLs
  photo_captions: string[];       // Array of captions
  order_index: number;
  important: boolean;
  created_at: string;
  updated_at: string;
}
```

### Standard Query Patterns

#### Property-Scoped Queries (Most Common)
```tsx
// Always filter by current property for property-scoped data
const fetchRecommendations = async () => {
  if (!currentProperty?.id) {
    setRecommendations([]);
    return;
  }
  
  const { data, error } = await supabase
    .from('recommendations')
    .select('*')
    .eq('property_id', currentProperty.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Database error:', error);
    throw error;
  }
  
  setRecommendations(data || []);
};

// Clear data when property changes
useEffect(() => {
  fetchRecommendations();
}, [currentProperty?.id]);
```

#### Multi-tenant Queries
```tsx
// For tenant-scoped data (properties, tenant users)
const fetchProperties = async () => {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('tenant_id', currentTenant?.id)
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data;
};
```

#### Complex Joins
```tsx
// Fetch cleaning visits with related tasks
const fetchCleaningHistory = async () => {
  const { data, error } = await supabase
    .from('cleaning_visits')
    .select(`
      *,
      cleaning_visit_tasks (
        *,
        cleaning_tasks (
          name,
          room,
          description
        )
      ),
      reservations (
        title,
        guest_name
      )
    `)
    .eq('property_id', currentProperty?.id)
    .order('visit_date', { ascending: false });

  return data;
};
```

### Database Operation Patterns

#### Insert with Proper Error Handling
```tsx
const addRecommendation = async (newRec: Partial<Recommendation>) => {
  if (!currentProperty?.id) {
    throw new Error('No property selected');
  }

  const { data, error } = await supabase
    .from('recommendations')
    .insert([{
      ...newRec,
      property_id: currentProperty.id,
      id: uuid(), // Generate UUID if needed
    }])
    .select()
    .single();

  if (error) {
    console.error('❌ Insert failed:', error);
    throw error;
  }
  
  // Update local state optimistically
  setRecommendations(prev => [data, ...prev]);
  return data;
};
```

#### Update Operations
```tsx
const updateTaskStatus = async (taskId: string, isCompleted: boolean) => {
  const { error } = await supabase
    .from('cleaning_tasks')
    .update({
      is_completed: isCompleted,
      completed_by: isCompleted ? user?.id : null,
      completed_at: isCompleted ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId);

  if (error) {
    console.error('❌ Update failed:', error);
    throw error;
  }
};
```

#### Soft Delete Pattern
```tsx
// For important data, consider soft deletes
const softDeleteReservation = async (reservationId: string) => {
  const { error } = await supabase
    .from('reservations')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', reservationId);

  if (error) throw error;
};
```

### External API Data Rules

#### Google Places Integration
```tsx
// Store place_id, not photo references (they expire)
interface Recommendation {
  place_id?: string;              // ✅ Store this for dynamic fetching
  images: string[];               // ✅ Keep empty for Google Places
}

// Fetch photos dynamically, don't store URLs
const DynamicGooglePlacePhoto = ({ placeId }) => {
  // Always fetch fresh photo reference
  // Don't cache photo URLs in database
};
```

#### Weather and Real-time Data
```tsx
// Don't store weather data - always fetch fresh
// Store location coordinates for API calls
interface Property {
  latitude?: number;
  longitude?: number;
  // Don't store: current_weather, forecast, etc.
}
```

### Security & Permissions

#### Row Level Security (RLS) Patterns
```sql
-- Property-based access control (most tables follow this pattern)
CREATE POLICY "Users can access their property data" ON recommendations
  FOR ALL USING (
    property_id IN (
      SELECT property_id FROM property_users 
      WHERE user_id = auth.uid()
    )
  );

-- Tenant-based access for tenant-scoped data
CREATE POLICY "Users can access their tenant data" ON properties
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users 
      WHERE user_id = auth.uid()
    )
  );
```

#### Role-based Access
```tsx
// Check user role before operations
const canManageProperty = (userRole: string) => {
  return ['owner', 'property_manager'].includes(userRole);
};

// Role hierarchy from role_definitions table
const ROLE_HIERARCHY = {
  owner: 1,
  property_manager: 2,
  renter: 3,
  guest: 4,
  friend: 5,
};
```

### Data Validation

#### Required Field Validation
```tsx
const validateRecommendation = (data: Partial<Recommendation>) => {
  if (!data.name?.trim()) throw new Error('Name is required');
  if (!data.category) throw new Error('Category is required');
  if (!data.address?.trim()) throw new Error('Address is required');
  if (!data.property_id) throw new Error('Property ID is required');
  return true;
};
```

#### Status Enum Validation
```tsx
// Use explicit status values from database constraints
type ReservationStatus = 'pending approval' | 'confirmed' | 'cancelled' | 'rejected';
type TaskStatus = 'pending' | 'in_progress' | 'completed';
type CleaningVisitStatus = 'in_progress' | 'completed' | 'cancelled';
type IssueSeverity = 'Low' | 'Medium' | 'High';

// Always use these exact strings to match DB constraints
```

### Performance Optimization

#### Selective Field Queries
```tsx
// Only select fields you need
const { data } = await supabase
  .from('reservations')
  .select('id, title, start_date, end_date, status, guests')
  .eq('property_id', propertyId)
  .order('start_date', { ascending: false });
```

#### Pagination for Large Datasets
```tsx
const fetchReservationsPage = async (page: number, pageSize: number = 10) => {
  const start = page * pageSize;
  const end = start + pageSize - 1;
  
  const { data, error, count } = await supabase
    .from('reservations')
    .select('*', { count: 'exact' })
    .eq('property_id', currentProperty?.id)
    .range(start, end)
    .order('start_date', { ascending: false });
    
  return { data, totalCount: count };
};
```

### Real-time Features

#### Supabase Subscriptions
```tsx
// Listen for real-time updates on property-scoped data
useEffect(() => {
  if (!currentProperty?.id) return;

  const subscription = supabase
    .channel(`property_${currentProperty.id}_changes`)
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'recommendations',
        filter: `property_id=eq.${currentProperty.id}`
      },
      (payload) => {
        console.log('🔄 Real-time update:', payload);
        // Update local state based on payload.eventType
      }
    )
    .subscribe();

  return () => subscription.unsubscribe();
}, [currentProperty?.id]);
```

### Schema Management

#### Migration Commands
```bash
# Export current schema
supabase db dump --project-ref hkrgfqpshdoroimlulzw --schema public > schema.sql

# Generate TypeScript types
npx supabase gen types typescript --project-id hkrgfqpshdoroimlulzw > types/database.types.ts

# Always run after schema changes
```

#### Foreign Key Relationships
- Most tables are **property-scoped** via `property_id`
- Some tables are **tenant-scoped** via `tenant_id`
- User relationships via `auth.users(id)`
- Maintain referential integrity with proper constraints

### Common Pitfalls to Avoid

1. **❌ Don't store Google photo URLs** - they expire
2. **❌ Don't store weather data** - always fetch fresh
3. **❌ Don't forget property_id filtering** - causes data leaks
4. **❌ Don't use calculated status fields** - store explicit status
5. **❌ Don't skip error handling** - always check for errors
6. **❌ Don't ignore RLS policies** - test permissions thoroughly

### Backup & Export

#### Property Data Export
```tsx
const exportPropertyData = async (propertyId: string) => {
  const tables = [
    'recommendations', 'reservations', 'cleaning_tasks', 
    'cleaning_visits', 'manual_sections', 'manual_items',
    'contacts', 'inventory', 'notes', 'tasks'
  ];
  
  const exportData: Record<string, any[]> = {};
  
  for (const table of tables) {
    const { data } = await supabase
      .from(table)
      .select('*')
      .eq('property_id', propertyId);
    exportData[table] = data || [];
  }
  
  return exportData;
};
```