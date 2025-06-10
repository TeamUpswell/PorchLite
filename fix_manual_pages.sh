#!/bin/bash

# Manual pages - likely similar structure
MANUAL_FILES=(
  "app/manual/sections/[id]/edit/page.tsx"
  "app/manual/sections/[id]/items/[itemId]/edit/page.tsx"
  "app/manual/sections/[id]/items/[itemId]/page.tsx"
  "app/manual/sections/[id]/items/new/page.tsx"
  "app/manual/sections/[id]/page.tsx"
  "app/manual/sections/new/page.tsx"
)

for file in "${MANUAL_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "�� Fixing $file..."
    
    # Add ProtectedPageWrapper import if not present
    if ! grep -q "ProtectedPageWrapper" "$file"; then
      sed -i '' '/import.*StandardCard/a\
import ProtectedPageWrapper from "@/components/layout/ProtectedPageWrapper";
' "$file"
    fi
    
    # Remove StandardPageLayout import
    sed -i '' '/import.*StandardPageLayout.*from/d' "$file"
    
    echo "✅ Fixed imports for $file"
  else
    echo "❌ File not found: $file"
  fi
done
