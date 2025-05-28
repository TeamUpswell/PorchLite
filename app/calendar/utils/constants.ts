export const statusColors: Record<string, string> = {
  confirmed: "#10B981", // green
  "pending approval": "#FF8C00", // orange
  cancelled: "#EF4444", // red
  default: "#3B82F6", // blue
};

export const relationshipOptions = [
  { value: "spouse", label: "Spouse/Partner" },
  { value: "child", label: "Child" },
  { value: "parent", label: "Parent" },
  { value: "sibling", label: "Sibling" },
  { value: "friend", label: "Friend" },
  { value: "colleague", label: "Colleague" },
  { value: "other", label: "Other" },
];

export const ageRangeOptions = [
  { value: "adult", label: "Adult (18+)" },
  { value: "teen", label: "Teen (13-17)" },
  { value: "child", label: "Child (3-12)" },
  { value: "infant", label: "Infant (0-2)" },
];