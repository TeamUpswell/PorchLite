#!/bin/bash

# All manual pages that need fixing
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
    echo "🔧 Fixing $file..."
    
    # Step 1: Add ProtectedPageWrapper import
    if ! grep -q "ProtectedPageWrapper" "$file"; then
      sed -i '' '/import.*StandardCard/a\
import ProtectedPageWrapper from "@/components/layout/ProtectedPageWrapper";
' "$file"
    fi
    
    # Step 2: Remove StandardPageLayout import
    sed -i '' '/import.*StandardPageLayout.*from/d' "$file"
    
    # Step 3: Replace StandardPageLayout wrapper with ProtectedPageWrapper
    sed -i '' 's/<StandardPageLayout/<ProtectedPageWrapper/g' "$file"
    sed -i '' 's/<\/StandardPageLayout>/<\/ProtectedPageWrapper>/g' "$file"
    
    # Step 4: Remove title, subtitle, headerIcon, breadcrumb props
    # This is complex, so let's do it manually for each file
    
    echo "✅ Basic fixes applied to $file"
  else
    echo "❌ File not found: $file"
  fi
done

echo ""
echo "🎯 MANUAL FIXES NEEDED:"
echo "Each file needs manual header/breadcrumb conversion"
echo "Run this script first, then we'll fix the headers manually"
