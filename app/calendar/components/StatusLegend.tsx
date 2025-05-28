import { statusColors } from "../utils/constants";

export const StatusLegend = () => {
  const statuses = [
    { key: "confirmed", label: "Confirmed" },
    { key: "pending approval", label: "Pending" },
    { key: "cancelled", label: "Cancelled" },
  ];

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-3 mb-4">
      <div className="flex flex-wrap items-center justify-center space-x-8">
        {statuses.map((status) => (
          <div key={status.key} className="flex items-center">
            <div 
              className="w-3 h-3 rounded-full mr-2 ring-2 ring-white shadow-sm" 
              style={{ backgroundColor: statusColors[status.key] }}
            ></div>
            <span className="text-sm font-medium text-gray-700">
              {status.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};