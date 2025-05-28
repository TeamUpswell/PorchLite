import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface RoomProps {
  room: {
    id: string;
    name: string;
    icon: LucideIcon;
  };
  stats: {
    total: number;
    completed: number;
  };
}

export default function RoomCard({ room, stats }: RoomProps) {
  const Icon = room.icon;
  const completionPercentage = stats.total
    ? (stats.completed / stats.total) * 100
    : 0;

  return (
    <Link href={`/cleaning/checklist/${room.id}`}>
      <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
        <div className="flex items-center mb-4">
          <div className="p-2 bg-blue-100 rounded-full mr-3">
            <Icon className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium">{room.name}</h3>
        </div>

        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600 text-sm">Completion</span>
            <span className="font-medium">
              {stats.completed}/{stats.total}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                completionPercentage === 100
                  ? "bg-green-500"
                  : completionPercentage > 50
                  ? "bg-blue-500"
                  : "bg-amber-500"
              }`}
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
        </div>

        {stats.total === 0 && (
          <p className="mt-2 text-sm text-gray-500">No tasks found</p>
        )}

        {stats.total > 0 && stats.completed === stats.total && (
          <p className="mt-2 text-sm text-green-600 font-medium">
            All tasks completed!
          </p>
        )}
      </div>
    </Link>
  );
}
