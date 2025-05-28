// lib/utils/categoryUtils.ts
import { useInventoryCategories } from '@/lib/hooks/useInventoryCategories';

// Helper function to get category icon
export function getCategoryIcon(categoryName: string, categories: any[]): string {
  const category = categories.find(cat => cat.name === categoryName);
  return category?.icon || '📋'; // Default icon if not found
}

// Category display helper
export function formatCategoryDisplay(categoryName: string, categories: any[]): string {
  const icon = getCategoryIcon(categoryName, categories);
  const name = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
  return `${icon} ${name}`;
}